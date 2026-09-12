from decimal import Decimal, ROUND_DOWN


CENT = Decimal("0.01")


def calculate_equal_split(
    amount: Decimal,
    participants: list[str],
) -> tuple[Decimal, int]:
    """
    Calculate an equal split rounded to cents.

    Returns:
        per_person: base amount each participant pays
        remainder_cents: number of cents that must be distributed
                       to the first participants
    """
    if amount <= 0:
        raise ValueError("Amount must be greater than zero")

    if not participants:
        raise ValueError("At least one participant is required")

    if len(set(participants)) != len(participants):
        raise ValueError("Participants must be unique")

    per_person = (amount / len(participants)).quantize(
        CENT,
        rounding=ROUND_DOWN,
    )

    distributed = per_person * len(participants)
    remainder = amount - distributed
    remainder_cents = int((remainder / CENT).to_integral_value())

    return per_person, remainder_cents


def calculate_balances(expenses: list[dict]) -> list[dict]:
    """
    Calculate each member's net balance.

    Positive balance = member should receive money.
    Negative balance = member owes money.
    """
    balances: dict[str, Decimal] = {}

    for expense in expenses:
        amount = Decimal(str(expense["amount"]))
        paid_by = expense["paid_by"]
        participants = expense["participants"]

        balances.setdefault(paid_by, Decimal("0.00"))

        for participant in participants:
            balances.setdefault(participant, Decimal("0.00"))

        per_person, remainder_cents = calculate_equal_split(
            amount,
            participants,
        )

        for index, participant in enumerate(participants):
            share = per_person

            if index < remainder_cents:
                share += CENT

            balances[participant] -= share

        balances[paid_by] += amount

    return [
        {
            "member": member,
            "balance": balance.quantize(CENT),
        }
        for member, balance in sorted(balances.items())
    ]