import json
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Expense
from app.schemas import SettlementResponse
from app.services.expense_service import calculate_balances
from app.services.settlement_service import calculate_settlements


router = APIRouter(
    prefix="/settlements",
    tags=["Settlements"],
)


@router.get(
    "",
    response_model=list[SettlementResponse],
)
def get_settlements(
    db: Session = Depends(get_db),
):
    expenses = db.scalars(
        select(Expense).order_by(Expense.id)
    ).all()

    expense_data = [
        {
            "amount": Decimal(str(expense.amount)),
            "paid_by": expense.paid_by,
            "participants": json.loads(expense.participants),
        }
        for expense in expenses
    ]

    balances = calculate_balances(expense_data)

    return calculate_settlements(balances)