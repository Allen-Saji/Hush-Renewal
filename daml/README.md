# HushRenewal - Daml Contract Layer

This folder contains the Canton/Daml smart contracts powering HushRenewal's private SaaS renewal negotiation. Neither the customer nor the vendor ever sees the other's price. Canton enforces this at the protocol level, not just by policy.

## Parties

- Customer: The company renewing a SaaS contract
- Vendor: The SaaS provider
- Matcher: Neutral party that runs the clearing logic

## Templates

- RenewalRound: Signed by Matcher, visible to all three parties. Opens a negotiation round.
- SealedBid: Signed by Customer, visible to Customer and Matcher only. Customer's private ceiling price.
- SealedAsk: Signed by Vendor, visible to Vendor and Matcher only. Vendor's private floor price.
- ClearingResult: Signed by Matcher, visible to all three parties. Contains outcome only, no raw numbers.
- Cash: Signed by Customer, visible to Customer, Vendor, and Matcher. Payment token.
- RenewedLicense: Signed by Vendor, visible to Vendor and Customer. Renewed SaaS subscription.

## Flow

1. Matcher creates RenewalRound
2. Customer submits SealedBid (vendor cannot see this)
3. Vendor submits SealedAsk (customer cannot see this)
4. Matcher exercises Clear
   - if minPrice <= maxPrice: DEAL at midpoint price
   - else: NO_DEAL, nothing revealed
5. If DEAL: all three parties co-authorize Settle
   - Cash transfers to vendor and RenewedLicense issued to customer atomically

## Tests

Run with: daml build && daml test

- test_deal: Customer ceiling 100000, Vendor floor 80000, expected DEAL at 90000
- test_no_deal: Customer ceiling 70000, Vendor floor 90000, expected NO_DEAL with no price revealed
- test_settlement: Customer ceiling 100000, Vendor floor 80000, expected DEAL plus cash transfer plus licence issued

## Privacy Guarantee

- Vendor's view never contains a contract with maxPrice
- Customer's view never contains a contract with minPrice
- Matcher sees both numbers as required to compute the result but is a neutral infrastructure party
- Full zero-knowledge hiding from the matcher is marked as future work
