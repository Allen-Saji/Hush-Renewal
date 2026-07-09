"""HushRenewal negotiation agents.

Two isolated LLM services -- one customer-side, one vendor-side. Each reasons
over *only its own private brief*, commits to a single reservation price, and
seals it on Canton through the matcher backend's party-locked endpoint. Neither
agent is ever handed the other side's brief or number; that is the whole point.
"""
