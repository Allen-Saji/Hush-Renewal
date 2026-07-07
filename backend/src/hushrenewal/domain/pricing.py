"""Off-chain clearing-price selection.

The matcher draws the deal price uniformly at random inside the overlap band
[floor, ceiling]. The contract only asserts band membership, so neither party
can reconstruct the other's sealed number from the published price. Uses a
system-entropy RNG so the draw is not reconstructable from a seed.
"""

from __future__ import annotations

import random
from decimal import ROUND_HALF_UP, Decimal

_CENTS = Decimal("0.01")
_rng = random.SystemRandom()


def draw_in_band(floor: Decimal, ceiling: Decimal) -> Decimal:
    """Return a price in [floor, ceiling], rounded to cents and clamped."""
    if floor > ceiling:
        raise ValueError("floor must be <= ceiling to draw a price")
    raw = Decimal(str(_rng.uniform(float(floor), float(ceiling))))
    price = raw.quantize(_CENTS, rounding=ROUND_HALF_UP)
    return max(floor, min(price, ceiling))
