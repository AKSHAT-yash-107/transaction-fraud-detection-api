## Transaction Fraud Detection API

A secure, production-ready RESTful API for personal finance management built with **Node.js**, **Express.js**, and **MySQL**.

##  Features

- **JWT Authentication** — Secure login/register with token-based auth
- **Transaction Management** — Full CRUD with filtering, pagination & date ranges
- **Category System** — Organize transactions by custom income/expense categories
- **Budget Tracking** — Set monthly budgets per category with overspend alerts
- **Monthly Summary** — Aggregated stats with category-wise breakdown
- **Rate Limiting** — 100 req/15 min per IP to prevent abuse
- **Input Validation** — Centralized validation middleware on all endpoints
- **SQL Optimization** — Indexed queries for high-performance data retrieval

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL |
| Auth | JSON Web Tokens (JWT) |
| Password | bcryptjs |
| Validation | express-validator |
| Rate Limiting | express-rate-limit |

---

##  Project Structure

```
finance-tracker/
├── src/
│   ├── config/
│   │   └── db.js              # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js         # Register, Login, Me
│   │   ├── transactionController.js  # CRUD + Summary
│   │   └── categoryController.js     # Categories + Budgets
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── validate.js        # Request validation
│   ├── routes/
│   │   ├── auth.js
│   │   ├── transactions.js
│   │   └── financeRoutes.js
│   └── index.js               # App entry point
├── schema.sql                 # Database schema
├── .env.example
└── package.json
```

---

##  Setup & Installation

### 1. Clone and install dependencies
```bash
git clone https://github.com/yourusername/finance-tracker-api.git
cd finance-tracker-api
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
```

### 3. Set up the database
```bash
mysql -u root -p < schema.sql
```

### 4. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:3000`

---

##  API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user (auth required) |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions (filter/paginate) |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET | `/api/transactions/summary` | Monthly summary + budget alerts |

### Categories & Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Create a category |
| DELETE | `/api/categories/:id` | Delete a category |
| GET | `/api/budgets` | Get budgets for a month |
| POST | `/api/budgets` | Set/update a monthly budget |

---

##  Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

##  Example Requests

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Akshat", "email": "akshat@example.com", "password": "secret123"}'
```

### Create Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Lunch", "amount": 150, "type": "expense", "category_id": 3, "date": "2025-06-15"}'
```

### Get Monthly Summary
```bash
curl http://localhost:3000/api/transactions/summary?month=6&year=2025 \
  -H "Authorization: Bearer <token>"
```

### Filter Transactions
```bash
curl "http://localhost:3000/api/transactions?type=expense&start_date=2025-06-01&end_date=2025-06-30&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

---

##  Key Design Decisions

- **Connection Pooling** — MySQL pool with 10 connections for scalability
- **Parameterized Queries** — All SQL uses `?` placeholders to prevent SQL injection
- **Password Hashing** — bcrypt with salt rounds of 12 for secure storage
- **Soft Category Deletion** — Deleting a category sets `category_id` to NULL in transactions (data preserved)
- **Budget Upsert** — `ON DUPLICATE KEY UPDATE` to create or update budgets in one query
- **Indexed Columns** — `user_id + date` composite index for fast transaction retrieval

---

## 📊 Database Schema

```
users ──┬── transactions ── categories
        └── budgets ──────── categories
```

---

*Built with Node.js + Express + MySQL | © 2025 Akshat Shrivastav*
