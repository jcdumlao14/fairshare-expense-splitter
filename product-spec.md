# FairShare — Product Specification

## 1. Product Overview

FairShare is a small full-stack web application for splitting shared expenses among members of a group.

The application allows users to create an expense group, add members, record shared expenses, and calculate how much each member owes or is owed.

FairShare is being developed as an AI-assisted software engineering project for Homework 2 — Build and Ship an AI-Assisted Full-Stack App.

## 2. Problem Statement

When people share expenses during trips, meals, household activities, student projects, or group events, manually calculating each person's share can become confusing.

FairShare provides a simple way to record expenses and automatically calculate member balances.

## 3. Target Users

FairShare is intended for small groups of people who need to track shared expenses.

Example use cases include:

- Friends sharing travel expenses
- Roommates sharing household expenses
- Coworkers sharing meals
- Students sharing project expenses
- Small groups organizing events

## 4. Core User Stories

### US-1: Create an Expense Group

As a user, I want to create an expense group so that I can organize shared expenses.

Acceptance criteria:

- The user can provide a group name.
- A group receives a unique ID.
- The group is persisted by the backend.
- The created group can be retrieved later.

### US-2: Add Members

As a user, I want to add members to a group so that expenses can be assigned to the correct people.

Acceptance criteria:

- A member has a name.
- A member belongs to a specific group.
- Multiple members can belong to the same group.
- A member receives a unique ID.

### US-3: Record an Expense

As a user, I want to record an expense so that FairShare can calculate how the cost should be divided.

Acceptance criteria:

- An expense has a description.
- An expense has an amount.
- An expense has a payer.
- An expense belongs to a group.
- An expense can include multiple participants.
- The expense is persisted by the backend.

### US-4: Calculate Balances

As a user, I want to see the balance of each group member so that I know who owes money and who should receive money.

Acceptance criteria:

- The application calculates each participant's share.
- The application considers the amount paid by each member.
- The application calculates each member's net balance.
- A positive balance means the member should receive money.
- A negative balance means the member owes money.
- A zero balance means the member is settled.

### US-5: View Group Expenses

As a user, I want to view the expenses for a group so that I can review recorded transactions.

Acceptance criteria:

- Expenses are displayed for the selected group.
- Each expense displays its description.
- Each expense displays its amount.
- Each expense displays its payer.
- Participants are displayed.

## 5. Functional Requirements

FairShare must provide:

1. Group creation.
2. Member creation.
3. Expense creation.
4. Expense listing.
5. Balance calculation.
6. REST API communication.
7. SQLite persistence.
8. Automated backend tests.
9. OpenAPI API documentation.
10. A React/TypeScript frontend.

## 6. Expense Calculation Rules

For the initial version, expenses are split equally among all participants.

Example:

An expense of 900 is shared by three members:

- Alice
- Bob
- Charlie

Each person's share is:

900 / 3 = 300

If Alice paid the entire 900:

- Alice: +600
- Bob: -300
- Charlie: -300

The application should calculate balances using:

net balance = amount paid - amount owed

## 7. Initial Data Model

### Group

Fields:

- id
- name
- created_at

### Member

Fields:

- id
- group_id
- name
- created_at

### Expense

Fields:

- id
- group_id
- description
- amount
- payer_id
- created_at

### Expense Participant

Fields:

- expense_id
- member_id

## 8. Initial API

The backend will expose endpoints including:

### Health

GET `/api/health`

### Groups

POST `/api/groups`

GET `/api/groups`

GET `/api/groups/{group_id}`

### Members

POST `/api/groups/{group_id}/members`

GET `/api/groups/{group_id}/members`

### Expenses

POST `/api/groups/{group_id}/expenses`

GET `/api/groups/{group_id}/expenses`

### Balances

GET `/api/groups/{group_id}/balances`

The exact request and response schemas will be defined in `openapi.yaml`.

## 9. Frontend Requirements

The frontend should provide:

- Group creation
- Group selection
- Member management
- Expense entry
- Expense history
- Balance summary

The frontend communicates with the backend through the documented REST API.

## 10. Backend Requirements

The backend will use:

- Python
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- pytest

The backend should separate:

- API routes
- request/response schemas
- database models
- database access
- business logic

## 11. Frontend Technology

The frontend will use:

- React
- TypeScript
- Vite

The frontend should keep API communication separate from presentation components.

## 12. Testing Requirements

Automated tests should verify important behavior including:

- Health endpoint
- Group creation
- Group retrieval
- Member creation
- Expense creation
- Expense retrieval
- Equal expense splitting
- Balance calculation
- Invalid input handling

## 13. Non-Functional Requirements

The application should:

- Be easy to run locally.
- Have clear documentation.
- Use maintainable code.
- Keep frontend and backend responsibilities separate.
- Use an explicit OpenAPI contract.
- Avoid unnecessary dependencies.
- Provide automated tests.
- Use environment variables for configuration where appropriate.
- Never commit secrets or credentials.

## 14. Non-Goals

The initial version will not include:

- User authentication
- Online payments
- Bank integrations
- Cryptocurrency
- Real-money transfers
- Mobile applications
- Advanced accounting
- Multi-currency support
- AI-generated financial advice

These may be considered future enhancements but are outside the scope of Homework 2.

## 15. Success Criteria

The project is successful when:

1. The backend runs locally.
2. The frontend runs locally.
3. The frontend communicates with the backend.
4. Groups can be created.
5. Members can be added.
6. Expenses can be recorded.
7. Expenses are persisted in SQLite.
8. Balances are calculated correctly.
9. Automated tests pass.
10. The API is documented through OpenAPI.
11. Another developer can run the project using the README instructions.

## 16. AI-Assisted Development Strategy

AI tools may be used throughout development to assist with:

- Product planning
- Architecture
- Code generation
- Refactoring
- Debugging
- Test generation
- Documentation
- Code review

AI-generated code must be reviewed by the developer before being accepted.

The developer is responsible for:

- Reviewing generated code
- Understanding important implementation decisions
- Running tests
- Verifying application behavior
- Checking security and correctness
- Approving commits

The project should favor small, understandable changes over large unchecked AI-generated implementations.

## 17. Development Workflow

Development will follow this sequence:

1. Product specification
2. Project instructions
3. Frontend prototype
4. API contract
5. Backend implementation
6. Database persistence
7. Frontend/backend integration
8. Automated testing
9. Quality review
10. Documentation
11. Containerization
12. CI/CD
13. Final verification
