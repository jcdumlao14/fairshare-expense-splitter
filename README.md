# FairShare — AI-Assisted Expense Splitter

FairShare is a full-stack expense-splitting application built as part of Homework 2: **Build and Ship an AI-Assisted Full-Stack App**.

The application allows a group to record shared expenses, calculate equal shares, view member balances, and determine settlement payments. The project demonstrates an AI-assisted development workflow in which AI is used to accelerate implementation while the resulting code is reviewed, tested, and verified by the developer.

## Features

- Create shared expenses
- Equal expense splitting
- Automatic remainder-cent handling
- Track who paid for each expense
- Track expense participants
- View expense history
- View individual and group balances
- Calculate direct settlement payments
- Delete expenses
- REST API with FastAPI
- SQLite persistence
- React + TypeScript frontend
- API-connected frontend
- Local fallback/cache using browser localStorage
- Responsive user interface
- Docker containerization
- Docker Compose orchestration
- Automated GitHub Actions CI
- Automated backend testing with pytest
- Production frontend build with Vite

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- CSS
- Browser localStorage
- Fetch API

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- SQLite
- Uvicorn

### Testing

- pytest
- FastAPI TestClient
- httpx

### DevOps

- Docker
- Docker Compose
- GitHub Actions
- Nginx

## Architecture

```text
                    ┌─────────────────────────┐
                    │      React Frontend     │
                    │   TypeScript + Vite     │
                    │                         │
                    │ Dashboard               │
                    │ Expenses                │
                    │ Balances                │
                    │ Settlements             │
                    └────────────┬────────────┘
                                 │
                              HTTP/JSON
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      FastAPI Backend     │
                    │                         │
                    │ /expenses               │
                    │ /balances               │
                    │ /settlements            │
                    │ /health                 │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │        SQLite DB         │
                    │       fairshare.db       │
                    └─────────────────────────┘
````

## Project Structure

```text
fairshare-expense-splitter/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── balances.py
│   │   │   ├── expenses.py
│   │   │   └── settlements.py
│   │   │
│   │   ├── services/
│   │   │   ├── expense_service.py
│   │   │   └── settlement_service.py
│   │   │
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   │
│   └── tests/
│       ├── test_api.py
│       └── test_expense_service.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── fairshareApi.ts
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── package.json
│   └── package-lock.json
│
├── docs/
│   └── ai-usage-report.md
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── AGENTS.md
├── product-spec.md
├── openapi.yaml
├── requirements.txt
├── pytest.ini
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
├── .dockerignore
├── .gitignore
└── README.md
```

## Requirements

### Local development

* Python 3.12+
* Node.js 22+
* npm
* Git

### Optional

* Docker Desktop
* Docker Compose

## Local Setup

Clone the repository and enter the project directory:

```bash
git clone https://github.com/jcdumlao14/fairshare-expense-splitter.git
cd fairshare-expense-splitter
```

## Backend Setup

Create and activate a Python virtual environment.

### Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Run the backend:

```powershell
uvicorn app.main:app --reload --app-dir backend
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

The frontend API configuration is controlled by:

```text
frontend/.env
```

Example:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The `.env` file is intentionally excluded from version control.

## API Endpoints

| Method | Endpoint         | Purpose                       |
| ------ | ---------------- | ----------------------------- |
| GET    | `/`              | API welcome message           |
| GET    | `/health`        | Health check                  |
| POST   | `/expenses`      | Create an expense             |
| GET    | `/expenses`      | List expenses                 |
| GET    | `/expenses/{id}` | Retrieve one expense          |
| DELETE | `/expenses/{id}` | Delete an expense             |
| GET    | `/balances`      | Calculate member balances     |
| GET    | `/settlements`   | Calculate settlement payments |

## Expense Splitting

FairShare uses equal splitting across all selected participants.

For example:

```text
Expense: ₱1,850.00
Participants: 4

₱1,850.00 / 4 = ₱462.50 per person
```

The backend uses `Decimal` arithmetic and explicitly handles remainder cents when an amount cannot be divided evenly.

Example:

```text
Expense: ₱100.00
Participants: 3

Base share: ₱33.33
Remainder: ₱0.01
```

The remaining cent is distributed deterministically so that the participant shares reconcile with the original expense.

## Balance Calculation

Balances are calculated from:

1. The amount each member paid.
2. The member's equal share of participating expenses.
3. The difference between what a member paid and what they owe.

Interpretation:

```text
Positive balance = member should receive money
Negative balance = member owes money
Zero balance     = member is settled
```

## Settlement Calculation

The settlement service converts net balances into direct payments between debtors and creditors.

Example:

```text
Ana      -₱500
Mark     -₱300
Jocelyn  +₱800
```

FairShare produces:

```text
Ana → Jocelyn   ₱500
Mark → Jocelyn  ₱300
```

## Testing

Run the complete backend test suite from the project root:

```powershell
python -m pytest
```

The current verified test suite contains:

```text
17 passed
```

The tests cover:

* Health endpoint
* Expense creation
* Input validation
* Expense listing
* Expense retrieval
* Missing expense handling
* Expense deletion
* Equal splitting
* Remainder handling
* Invalid amounts
* Duplicate participants
* Balance calculation
* Multiple expense balances
* Settlement calculation
* Multiple settlements

## Frontend Production Build

From the frontend directory:

```powershell
cd frontend
npm run build
```

The build output is generated in:

```text
frontend/dist/
```

The production build is also validated by the CI workflow.

## Docker

The project includes separate Dockerfiles for the backend and frontend:

```text
Dockerfile.backend
Dockerfile.frontend
docker-compose.yml
```

Build the application:

```powershell
docker compose build
```

Start the services:

```powershell
docker compose up -d
```

Check running services:

```powershell
docker compose ps
```

Backend health check:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

The frontend is exposed on:

```text
http://localhost:5173
```

Stop the services:

```powershell
docker compose down
```

## CI/CD

GitHub Actions automatically runs on:

* Pushes to `main`
* Pull requests targeting `main`

The CI pipeline performs:

### Backend

* Checks out the repository
* Sets up Python 3.12
* Installs backend dependencies
* Runs the complete pytest suite

### Frontend

* Checks out the repository
* Sets up Node.js 22
* Installs dependencies using `npm ci`
* Runs the production Vite build

Workflow:

```text
.github/workflows/ci.yml
```

## Persistence

The backend uses SQLite through SQLAlchemy.

Database:

```text
fairshare.db
```

The database is created automatically when the FastAPI application starts.

The API is the source of truth for application data. The frontend may cache retrieved expenses in browser localStorage to provide a fallback when the API is temporarily unavailable.

## API Contract

The API contract is documented in:

```text
openapi.yaml
```

The live FastAPI Swagger documentation is available at:

```text
http://127.0.0.1:8000/docs
```

## AI-Assisted Development

This project was developed using an AI-assisted software development workflow.

AI assistance was used for:

* Project planning
* Product specification
* Architecture suggestions
* Frontend implementation
* Backend implementation
* API design
* Database modeling
* Validation logic
* Testing
* Documentation
* Docker configuration
* CI/CD configuration
* Debugging and code improvement

Human review and verification remained part of the development process.

The AI-assisted workflow followed this principle:

```text
Specification
     ↓
AI-assisted implementation
     ↓
Human review
     ↓
Automated testing
     ↓
Manual verification
     ↓
Iteration
```

Detailed AI usage is documented in:

```text
docs/ai-usage-report.md
```

## Verification Status

The following project components have been implemented and verified during development:

* Product specification
* Frontend prototype
* FastAPI backend
* SQLite persistence
* Expense splitting logic
* Balance calculation
* Settlement calculation
* API validation
* Automated backend tests
* Frontend/API integration
* Frontend production build
* Docker configuration
* GitHub Actions CI configuration
* Project documentation
* AI usage documentation

Backend API routes verified:

```text
/
 /health
 /expenses
 /expenses/{expense_id}
 /balances
 /settlements
```

Automated backend test result:

```text
17 passed
```

## Development Philosophy

FairShare follows a simple development principle:

> AI accelerates implementation; the developer remains responsible for reviewing, testing, and verifying the result.

The project therefore combines AI-assisted coding with:

* Explicit requirements
* API contracts
* Automated tests
* Manual application testing
* Reproducible setup instructions
* Version control
* CI validation

## Future Improvements

Potential future enhancements include:

* User authentication
* Multiple expense groups
* Persistent member management
* Custom split percentages
* Exact-share/manual split modes
* Currency selection
* Expense editing
* Settlement history
* Receipt image uploads
* AI-powered natural-language expense entry
* Cloud database support
* Production deployment

## Repository

GitHub:

https://github.com/jcdumlao14/fairshare-expense-splitter

## License

This project was created for educational and portfolio purposes.
