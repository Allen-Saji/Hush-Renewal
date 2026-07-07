# Settlement handshake (propose / accept) - Daml change spec

## Why

Today `ClearingResult.Settle` has `controller matcher, customer, vendor`, so it
needs all three signatures in a single exercise. That only works if one actor
holds all three parties' authority at once. Our backend runs strict
matcher-only: it may act as the matcher and nothing else. So we replace the
single atomic `Settle` with a propose/accept handshake where each party
authorizes only its own step, and the atomic delivery-versus-payment (DvP)
fires on the final accept.

Authority recap: exercising a choice grants the authority of the contract's
signatories plus the choice controller. We chain two contracts so that by the
final step the authority set is {matcher, customer, vendor} without any single
submitter ever holding more than its own party.

## Change 1: replace `Settle` with a matcher-only `ProposeSettlement`

On `ClearingResult`, drop the `Settle` choice and add:

```daml
    -- nonconsuming: keep the cleared result as an on-ledger audit record
    nonconsuming choice ProposeSettlement : ContractId SettlementProposal
      controller matcher
      do
        assertMsg "Can only settle a DEAL" (outcome == "DEAL")
        dealPrice <- case price of
          None   -> abort "No price on a DEAL result"
          Some p -> pure p
        create SettlementProposal with
          matcher; customer; vendor; roundId; subscription; price = dealPrice
```

## Change 2: two new templates

```daml
template SettlementProposal
  with
    matcher      : Party
    customer     : Party
    vendor       : Party
    roundId      : Text
    subscription : Text
    price        : Decimal
  where
    signatory matcher
    observer  customer, vendor

    -- Customer accepts and names the cash it will pay with.
    choice AcceptByCustomer : ContractId SettlementCustomerAccepted
      with cashCid : ContractId Cash
      controller customer
      do
        cash <- fetch cashCid
        assertMsg "Cash must belong to the customer" (cash.owner == customer)
        assertMsg "Cash amount must match the deal price" (cash.amount == price)
        create SettlementCustomerAccepted with
          matcher; customer; vendor; roundId; subscription; price; cashCid

    choice RejectByCustomer : ()
      controller customer
      do pure ()

template SettlementCustomerAccepted
  with
    matcher      : Party
    customer     : Party
    vendor       : Party
    roundId      : Text
    subscription : Text
    price        : Decimal
    cashCid      : ContractId Cash
  where
    signatory matcher, customer
    observer  vendor

    -- Vendor accepts -> atomic DvP executes here.
    choice AcceptByVendor : (ContractId RenewedLicense, ContractId Cash)
      controller vendor
      do
        cash <- fetch cashCid
        assertMsg "Cash must belong to the customer" (cash.owner == customer)
        assertMsg "Cash amount must match the deal price" (cash.amount == price)
        archive cashCid
        licenceCid <- create RenewedLicense with
          vendor; customer; roundId; subscription; price
        vendorCashCid <- create Cash with
          owner = vendor; issuer = cash.issuer; amount = price; matcher
        pure (licenceCid, vendorCashCid)

    choice RejectByVendor : ()
      controller vendor
      do pure ()
```

## Why the authority works

- `ProposeSettlement`: controller `matcher`, on a contract signed by `matcher`.
  Matcher-only. Produces a proposal signed by matcher, observed by the others.
- `AcceptByCustomer`: controller `customer` on a matcher-signed proposal.
  Authority = {matcher, customer}. Creates a contract signed by both. The cash
  check runs here so a customer cannot accept with the wrong amount.
- `AcceptByVendor`: controller `vendor` on a {matcher, customer}-signed
  contract. Authority = {matcher, customer, vendor}. That is enough to:
  archive the customer's `Cash` (signed by `customer`), create `RenewedLicense`
  (signed by `vendor`), and create the vendor's `Cash` (signed by
  `issuer`=customer + `owner`=vendor). The whole swap is one atomic transaction.

## Flow

```
matcher:  ClearingResult(DEAL) --ProposeSettlement--> SettlementProposal
customer: SettlementProposal   --AcceptByCustomer(cash)--> SettlementCustomerAccepted
vendor:   SettlementCustomerAccepted --AcceptByVendor--> RenewedLicense + vendor Cash (atomic)
```

## Tests to add (Test.daml)

- `test_settlement_handshake`: DEAL -> propose -> accept(customer) -> accept(vendor)
  yields a `RenewedLicense` to the customer and `Cash` to the vendor.
- `test_wrong_cash_amount_rejected`: `AcceptByCustomer` with cash != price fails.
- `test_customer_can_reject` / `test_vendor_can_reject`: proposal can be abandoned.
- Keep the existing privacy and clearing tests unchanged.

## Known limitation (acceptable for now)

Between `AcceptByCustomer` and `AcceptByVendor` the customer's `Cash` is
referenced but not locked, so a customer could archive it and make settlement
fail. That is a liveness issue that only hurts the customer, not a theft. If we
want to close it later, `AcceptByCustomer` can archive the plain `Cash` and
re-create an escrowed `Cash` that also has `matcher` as a signatory, so it
cannot be spent unilaterally while the deal is pending.
