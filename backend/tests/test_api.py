from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app


TEST_DATABASE_URL = "sqlite:///./test_fairshare.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


Base.metadata.create_all(bind=test_engine)

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)


def teardown_module():
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "fairshare-api",
    }


def test_create_expense():
    response = client.post(
        "/expenses",
        json={
            "description": "Dinner",
            "amount": "90.00",
            "paid_by": "Jocelyn",
            "participants": [
                "Jocelyn",
                "Ana",
                "Mark",
            ],
            "category": "Food",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] == 1
    assert data["description"] == "Dinner"
    assert Decimal(str(data["amount"])) == Decimal("90.00")
    assert data["paid_by"] == "Jocelyn"
    assert data["participants"] == [
        "Jocelyn",
        "Ana",
        "Mark",
    ]
    assert data["category"] == "Food"


def test_create_expense_requires_payer_in_participants():
    response = client.post(
        "/expenses",
        json={
            "description": "Dinner",
            "amount": "90.00",
            "paid_by": "Jocelyn",
            "participants": [
                "Ana",
                "Mark",
            ],
            "category": "Food",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Payer must be included in participants"
    )


def test_list_expenses():
    client.post(
        "/expenses",
        json={
            "description": "Dinner",
            "amount": "90.00",
            "paid_by": "Jocelyn",
            "participants": [
                "Jocelyn",
                "Ana",
                "Mark",
            ],
            "category": "Food",
        },
    )

    client.post(
        "/expenses",
        json={
            "description": "Taxi",
            "amount": "30.00",
            "paid_by": "Ana",
            "participants": [
                "Jocelyn",
                "Ana",
            ],
            "category": "Transport",
        },
    )

    response = client.get("/expenses")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[0]["description"] == "Taxi"
    assert data[1]["description"] == "Dinner"


def test_get_expense():
    create_response = client.post(
        "/expenses",
        json={
            "description": "Groceries",
            "amount": "120.00",
            "paid_by": "Ana",
            "participants": [
                "Jocelyn",
                "Ana",
            ],
            "category": "Groceries",
        },
    )

    expense_id = create_response.json()["id"]

    response = client.get(f"/expenses/{expense_id}")

    assert response.status_code == 200
    assert response.json()["description"] == "Groceries"


def test_get_missing_expense():
    response = client.get("/expenses/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Expense not found"


def test_delete_expense():
    create_response = client.post(
        "/expenses",
        json={
            "description": "Taxi",
            "amount": "50.00",
            "paid_by": "Mark",
            "participants": [
                "Mark",
                "Jocelyn",
            ],
            "category": "Transport",
        },
    )

    expense_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/expenses/{expense_id}"
    )

    assert delete_response.status_code == 204

    get_response = client.get(
        f"/expenses/{expense_id}"
    )

    assert get_response.status_code == 404
def test_get_balances():
    client.post(
        "/expenses",
        json={
            "description": "Dinner",
            "amount": "90.00",
            "paid_by": "Jocelyn",
            "participants": [
                "Jocelyn",
                "Ana",
                "Mark",
            ],
            "category": "Food",
        },
    )

    response = client.get("/balances")

    assert response.status_code == 200

    data = response.json()

    result = {
        item["member"]: Decimal(str(item["balance"]))
        for item in data
    }

    assert result["Jocelyn"] == Decimal("60.00")
    assert result["Ana"] == Decimal("-30.00")
    assert result["Mark"] == Decimal("-30.00")


def test_balances_with_multiple_expenses():
    client.post(
        "/expenses",
        json={
            "description": "Dinner",
            "amount": "90.00",
            "paid_by": "Jocelyn",
            "participants": [
                "Jocelyn",
                "Ana",
                "Mark",
            ],
            "category": "Food",
        },
    )

    client.post(
        "/expenses",
        json={
            "description": "Taxi",
            "amount": "30.00",
            "paid_by": "Ana",
            "participants": [
                "Jocelyn",
                "Ana",
            ],
            "category": "Transport",
        },
    )

    response = client.get("/balances")

    assert response.status_code == 200

    data = response.json()

    result = {
        item["member"]: Decimal(str(item["balance"]))
        for item in data
    }

    assert result["Jocelyn"] == Decimal("45.00")
    assert result["Ana"] == Decimal("-15.00")
    assert result["Mark"] == Decimal("-30.00")

def test_get_settlements():
    client.post(
        "/expenses",
        json={
            "description": "Dinner",
            "amount": "90.00",
            "paid_by": "Jocelyn",
            "participants": [
                "Jocelyn",
                "Ana",
                "Mark",
            ],
            "category": "Food",
        },
    )

    response = client.get("/settlements")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2

    assert data[0]["from_member"] == "Ana"
    assert data[0]["to_member"] == "Jocelyn"
    assert Decimal(str(data[0]["amount"])) == Decimal("30.00")

    assert data[1]["from_member"] == "Mark"
    assert data[1]["to_member"] == "Jocelyn"
    assert Decimal(str(data[1]["amount"])) == Decimal("30.00")


def test_settlements_with_multiple_expenses():
    client.post(
        "/expenses",
        json={
            "description": "Dinner",
            "amount": "90.00",
            "paid_by": "Jocelyn",
            "participants": [
                "Jocelyn",
                "Ana",
                "Mark",
            ],
            "category": "Food",
        },
    )

    client.post(
        "/expenses",
        json={
            "description": "Taxi",
            "amount": "30.00",
            "paid_by": "Ana",
            "participants": [
                "Jocelyn",
                "Ana",
            ],
            "category": "Transport",
        },
    )

    response = client.get("/settlements")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2

    result = {
        (
            item["from_member"],
            item["to_member"],
        ): Decimal(str(item["amount"]))
        for item in data
    }

    assert result[("Mark", "Jocelyn")] == Decimal("30.00")
    assert result[("Ana", "Jocelyn")] == Decimal("15.00")