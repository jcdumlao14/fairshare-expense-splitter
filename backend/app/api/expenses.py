import json
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Expense
from app.schemas import ExpenseCreate, ExpenseResponse
from app.services.expense_service import calculate_equal_split


router = APIRouter(prefix="/expenses", tags=["Expenses"])


def expense_to_response(expense: Expense) -> ExpenseResponse:
    participants = json.loads(expense.participants)

    per_person, remainder_cents = calculate_equal_split(
        Decimal(str(expense.amount)),
        participants,
    )

    split_amount = (
        per_person + Decimal("0.01")
        if remainder_cents > 0
        else per_person
    )

    return ExpenseResponse(
        id=expense.id,
        description=expense.description,
        amount=Decimal(str(expense.amount)),
        paid_by=expense.paid_by,
        participants=participants,
        category=expense.category,
        expense_date=expense.expense_date,
        split_amount=split_amount,
        created_at=expense.created_at.isoformat(),
    )


@router.post(
    "",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
):
    if expense_data.paid_by not in expense_data.participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payer must be included in participants",
        )

    expense = Expense(
        description=expense_data.description,
        amount=expense_data.amount,
        paid_by=expense_data.paid_by,
        participants=json.dumps(expense_data.participants),
        category=expense_data.category,
        expense_date=expense_data.expense_date,
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense_to_response(expense)


@router.get(
    "",
    response_model=list[ExpenseResponse],
)
def list_expenses(
    db: Session = Depends(get_db),
):
    expenses = db.scalars(
        select(Expense).order_by(Expense.id.desc())
    ).all()

    return [
        expense_to_response(expense)
        for expense in expenses
    ]


@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse,
)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
):
    expense = db.get(Expense, expense_id)

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    return expense_to_response(expense)


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
):
    expense = db.get(Expense, expense_id)

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    db.delete(expense)
    db.commit()
