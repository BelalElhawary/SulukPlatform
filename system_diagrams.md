# SulukPlatform — System Diagrams

---

## 1. Use Case Diagram

```mermaid
graph TB
    subgraph ACTORS["Actors"]
        BU(["👤 Business User\n(Authenticated)"])
        GA(["🔓 Guest\n(Unauthenticated)"])
        AI(["🤖 Ollama AI\n(External Service)"])
    end

    subgraph SYSTEM["SulukPlatform System"]
        subgraph AUTH_UC["Authentication"]
            UC1["Register Account"]
            UC2["Login"]
            UC3["Logout"]
            UC4["View Profile"]
        end

        subgraph CLIENT_UC["Client Management"]
            UC5["Add Client"]
            UC6["View Client List"]
            UC7["View Client Details"]
        end

        subgraph ITEM_UC["Item Management"]
            UC8["Add Item / Product / Service"]
            UC9["View Item List"]
            UC10["View Item Details"]
        end

        subgraph PURCHASE_UC["Purchase Management"]
            UC11["Record Purchase"]
            UC12["View Purchase History"]
            UC13["Calculate Purchase Total"]
        end

        subgraph ANALYSIS_UC["AI Analysis"]
            UC14["Select Client for Analysis"]
            UC15["View Spending Charts"]
            UC16["View Top Purchased Items"]
            UC17["Generate AI Insight"]
            UC18["Stream AI Response"]
            UC19["Switch Language (EN/AR)"]
            UC20["Select AI Model"]
        end
    end

    GA --> UC1
    GA --> UC2

    BU --> UC3
    BU --> UC4
    BU --> UC5
    BU --> UC6
    BU --> UC7
    BU --> UC8
    BU --> UC9
    BU --> UC10
    BU --> UC11
    BU --> UC12
    BU --> UC14
    BU --> UC15
    BU --> UC16
    BU --> UC17
    BU --> UC19
    BU --> UC20

    UC11 -.->|"«include»"| UC13
    UC14 -.->|"«include»"| UC15
    UC14 -.->|"«include»"| UC16
    UC17 -.->|"«include»"| UC18
    UC18 -.->|"«uses»"| AI
    UC20 -.->|"«include»"| UC17
```

---

## 2. Context Diagram (Level 0 DFD)

```mermaid
graph LR
    BU(["👤 Business User"])
    OL(["🤖 Ollama\nLLM Service"])
    FS(["📁 File System\nSQLite DB"])

    subgraph SYS["⬛ SulukPlatform"]
        CORE["Core System\n────────────────\nFastAPI Backend\n+\nReact Frontend"]
    end

    BU -->|"Credentials\n(username / password)"| CORE
    CORE -->|"JWT Access Token\n+ User Profile"| BU

    BU -->|"Client Data\n(name, email, phone)"| CORE
    CORE -->|"Client Records\n+ Confirmation"| BU

    BU -->|"Item Data\n(name, type, price)"| CORE
    CORE -->|"Item Records\n+ Confirmation"| BU

    BU -->|"Purchase Request\n(client_id, items[])"| CORE
    CORE -->|"Purchase History\n+ Totals"| BU

    BU -->|"Analysis Request\n(client_id, lang, model)"| CORE
    CORE -->|"Charts + KPIs\n+ Streamed AI Text"| BU

    CORE -->|"Prompt + Purchase\nHistory Context"| OL
    OL -->|"Streamed Token\nChunks"| CORE

    CORE -->|"SQL Queries\n(INSERT / SELECT)"| FS
    FS -->|"Persisted Records\n(users, clients,\nitems, purchases)"| CORE
```

---

## 3. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER {
        INTEGER  id              PK   "AUTO INCREMENT"
        TEXT     username             "UNIQUE NOT NULL"
        TEXT     hashed_password      "NOT NULL (bcrypt)"
        DATETIME created_at           "DEFAULT utcnow()"
    }

    CLIENT {
        INTEGER  id              PK   "AUTO INCREMENT"
        TEXT     name                 "NOT NULL"
        TEXT     email                "NULLABLE"
        TEXT     phone                "NULLABLE"
        DATETIME created_at           "DEFAULT utcnow()"
    }

    ITEM {
        INTEGER  id              PK   "AUTO INCREMENT"
        TEXT     name                 "NOT NULL"
        TEXT     type                 "'Product' | 'Service'"
        REAL     price                "NOT NULL"
        DATETIME created_at           "DEFAULT utcnow()"
    }

    PURCHASE {
        INTEGER  id              PK   "AUTO INCREMENT"
        INTEGER  client_id       FK   "→ CLIENT.id"
        REAL     total_amount         "NOT NULL"
        DATETIME created_at           "DEFAULT utcnow()"
    }

    PURCHASEITEM {
        INTEGER  id              PK   "AUTO INCREMENT"
        INTEGER  purchase_id     FK   "→ PURCHASE.id"
        INTEGER  item_id         FK   "→ ITEM.id"
        INTEGER  quantity             "NOT NULL"
        REAL     unit_price           "NOT NULL (snapshot)"
    }

    CLIENT        ||--o{  PURCHASE      : "places"
    PURCHASE      ||--o{  PURCHASEITEM  : "contains"
    ITEM          ||--o{  PURCHASEITEM  : "appears in"
```

> **Note:** `USER` is decoupled — authentication is global (all users share the same data store). `unit_price` in `PURCHASEITEM` is a price snapshot at time of purchase, independent of `ITEM.price`.

---

## 4. Database Schema

```sql
-- ============================================================
-- SULUK PLATFORM DATABASE SCHEMA
-- Engine : SQLite  |  ORM : SQLModel (SQLAlchemy core)
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: user
-- Stores authenticated platform operator accounts.
-- Passwords are hashed with bcrypt (work factor default).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user" (
    id               INTEGER      PRIMARY KEY AUTOINCREMENT,
    username         TEXT         NOT NULL UNIQUE,
    hashed_password  TEXT         NOT NULL,
    created_at       DATETIME     NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS ix_user_username ON "user" (username);


-- ------------------------------------------------------------
-- TABLE: client
-- Represents a business's customer.
-- One client can have many purchases (1:N).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client (
    id          INTEGER   PRIMARY KEY AUTOINCREMENT,
    name        TEXT      NOT NULL,
    email       TEXT,
    phone       TEXT,
    created_at  DATETIME  NOT NULL DEFAULT (DATETIME('now'))
);


-- ------------------------------------------------------------
-- TABLE: item
-- A product or service offered by the business.
-- type: 'Product' | 'Service'
-- price: current list price (NOT the transactional price).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS item (
    id          INTEGER   PRIMARY KEY AUTOINCREMENT,
    name        TEXT      NOT NULL,
    type        TEXT      NOT NULL,     -- 'Product' | 'Service'
    price       REAL      NOT NULL,
    created_at  DATETIME  NOT NULL DEFAULT (DATETIME('now'))
);


-- ------------------------------------------------------------
-- TABLE: purchase
-- A sales transaction header linked to one client.
-- total_amount is pre-calculated as SUM(qty * unit_price).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase (
    id            INTEGER   PRIMARY KEY AUTOINCREMENT,
    client_id     INTEGER   NOT NULL REFERENCES client(id),
    total_amount  REAL      NOT NULL,
    created_at    DATETIME  NOT NULL DEFAULT (DATETIME('now'))
);


-- ------------------------------------------------------------
-- TABLE: purchaseitem
-- Line items belonging to a purchase (N:M bridge table).
-- unit_price is snapshotted at transaction time, so it is
-- independent of item.price which may change later.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchaseitem (
    id           INTEGER   PRIMARY KEY AUTOINCREMENT,
    purchase_id  INTEGER   NOT NULL REFERENCES purchase(id),
    item_id      INTEGER   NOT NULL REFERENCES item(id),
    quantity     INTEGER   NOT NULL,
    unit_price   REAL      NOT NULL    -- price at time of sale
);
```

### Column Summary Table

| Table | Column | Type | Constraint | Notes |
|---|---|---|---|---|
| `user` | `id` | INTEGER | PK, AUTO | — |
| `user` | `username` | TEXT | UNIQUE, NOT NULL | Indexed |
| `user` | `hashed_password` | TEXT | NOT NULL | bcrypt hash |
| `user` | `created_at` | DATETIME | NOT NULL | UTC default |
| `client` | `id` | INTEGER | PK, AUTO | — |
| `client` | `name` | TEXT | NOT NULL | — |
| `client` | `email` | TEXT | NULLABLE | — |
| `client` | `phone` | TEXT | NULLABLE | — |
| `client` | `created_at` | DATETIME | NOT NULL | UTC default |
| `item` | `id` | INTEGER | PK, AUTO | — |
| `item` | `name` | TEXT | NOT NULL | — |
| `item` | `type` | TEXT | NOT NULL | `'Product'` or `'Service'` |
| `item` | `price` | REAL | NOT NULL | Current list price |
| `item` | `created_at` | DATETIME | NOT NULL | UTC default |
| `purchase` | `id` | INTEGER | PK, AUTO | — |
| `purchase` | `client_id` | INTEGER | FK → `client.id` | — |
| `purchase` | `total_amount` | REAL | NOT NULL | Pre-calculated |
| `purchase` | `created_at` | DATETIME | NOT NULL | UTC default |
| `purchaseitem` | `id` | INTEGER | PK, AUTO | — |
| `purchaseitem` | `purchase_id` | INTEGER | FK → `purchase.id` | — |
| `purchaseitem` | `item_id` | INTEGER | FK → `item.id` | — |
| `purchaseitem` | `quantity` | INTEGER | NOT NULL | — |
| `purchaseitem` | `unit_price` | REAL | NOT NULL | Price snapshot |

### Relationship Summary

| Relationship | Cardinality | Description |
|---|---|---|
| `client` → `purchase` | **1 : N** | One client places many purchases |
| `purchase` → `purchaseitem` | **1 : N** | One purchase contains many line items |
| `item` → `purchaseitem` | **1 : N** | One item appears in many line items |
| `purchase` ↔ `item` | **N : M** | Resolved via `purchaseitem` bridge table |
