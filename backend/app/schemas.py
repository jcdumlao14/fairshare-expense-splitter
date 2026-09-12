from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExpenseCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=200)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    paid_by: str = Field(..., min_length=1, max_length=100)
    participants: list[str] = Field(..., min_length=1)
    category: str = Field(default="Other", max_length=50)
    expense_date: date | None = None

    @field_validator("description", "paid_by", "category")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Value cannot be empty")
        return value

    @field_validator("participants")
    @classmethod
    def validate_participants(cls, value: list[str]) -> list[str]:
        cleaned = [participant.strip() for participant in value]

        if any(not participant for participant in cleaned):
            raise ValueError("Participant names cannot be empty")

        if len(set(cleaned)) != len(cleaned):
            raise ValueError("Participants must be unique")

        return cleaned


class ExpenseResponse(ExpenseCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    split_amount: Decimal
    created_at: str


class BalanceResponse(BaseModel):
    member: str
    balance: Decimal


class SplitResponse(BaseModel):
    amount: Decimal
    participants: list[str]
    per_person: Decimal
    remainder_cents: int

class SettlementResponse(BaseModel):
    from_member: str
    to_member: str
    amount: Decimal