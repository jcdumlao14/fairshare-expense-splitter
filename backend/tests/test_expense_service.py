from decimal import Decimal

import pytest

from app.services.expense_service import (
    calculate_balances,
    calculate_equal_split,
)


def test_equal_split_even_amount():
    per_person, remainder = calculate_equal_split(
        Decimal("120.00"),
        ["Jocelyn", "Ana", "Mark"],
    )

    assert per_person == Decimal("40.00")
    assert remainder == 0


def test_equal_split_with_remainder():
    per_person, remainder = calculate_equal_split(
        Decimal("100.00"),
        ["Jocelyn", "Ana", "Mark"],
    )

    assert per_person == Decimal("33.33")
    assert remainder == 1


def test_equal_split_requires_participants():
    with pytest.raises(ValueError, match="At least one participant"):
        calculate_equal_split(
            Decimal("100.00"),
            [],
        )


def test_equal_split_rejects_zero_amount():
    with pytest.raises(ValueError, match="greater than zero"):
        calculate_equal_split(
            Decimal("0.00"),
            ["Jocelyn"],
        )


def test_equal_split_rejects_duplicate_participants():
    with pytest.raises(ValueError, match="unique"):
        calculate_equal_split(
            Decimal("100.00"),
            ["Jocelyn", "Jocelyn"],
        )


def test_balances():
    expenses = [
        {
            "amount": "90.00",
            "paid_by": "Jocelyn",
            "participants": ["Jocelyn", "Ana", "Mark"],
        }
    ]

    balances = calculate_balances(expenses)

    result = {
        item["member"]: item["balance"]
        for item in balances
    }

    assert result["Jocelyn"] == Decimal("60.00")
    assert result["Ana"] == Decimal("-30.00")
    assert result["Mark"] == Decimal("-30.00")