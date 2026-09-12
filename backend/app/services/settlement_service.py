from decimal import Decimal

CENT = Decimal("0.01")


def calculate_settlements(balances: list[dict]) -> list[dict]:
    """
    Convert net member balances into direct settlement payments.

    Positive balance = member should receive money.
    Negative balance = member owes money.
    """

    creditors = [
        {
            "member": item["member"],
            "amount": Decimal(str(item["balance"])),
        }
        for item in balances
        if Decimal(str(item["balance"])) > 0
    ]

    debtors = [
        {
            "member": item["member"],
            "amount": abs(Decimal(str(item["balance"]))),
        }
        for item in balances
        if Decimal(str(item["balance"])) < 0
    ]

    creditors.sort(key=lambda item: item["amount"], reverse=True)
    debtors.sort(key=lambda item: item["amount"], reverse=True)

    settlements = []

    creditor_index = 0
    debtor_index = 0

    while (
        creditor_index < len(creditors)
        and debtor_index < len(debtors)
    ):
        creditor = creditors[creditor_index]
        debtor = debtors[debtor_index]

        amount = min(
            creditor["amount"],
            debtor["amount"],
        ).quantize(CENT)

        if amount > 0:
            settlements.append(
                {
                    "from_member": debtor["member"],
                    "to_member": creditor["member"],
                    "amount": amount,
                }
            )

        creditor["amount"] -= amount
        debtor["amount"] -= amount

        if creditor["amount"] <= CENT / 2:
            creditor_index += 1

        if debtor["amount"] <= CENT / 2:
            debtor_index += 1

    return settlements