# SulukPlatform — Data Flow Diagram

## System Overview

SulukPlatform is a business intelligence web app with three major tiers: a **React/TypeScript Frontend**, a **FastAPI AI Backend**, and a local **Ollama LLM** service.

```mermaid
graph TB
    subgraph USER["👤 User (Browser)"]
        UI["React SPA\n(Vite + TypeScript)"]
    end

    subgraph FRONTEND["Frontend Layer"]
        AC["AuthContext\n(JWT + Axios)"]
        LP["LoginPage /\nRegisterPage"]
        DP["DashboardPage"]
        CP["ClientsPage"]
        IP["ItemsPage"]
        PP["PurchasesPage"]
        AP["AnalyzePage"]
        LS["localStorage\n(JWT Token)"]
    end

    subgraph BACKEND["FastAPI Backend (Python)"]
        AUTH["auth.py\n/register\n/token\n/users/me"]
        CLIENTS["clients router\n/clients"]
        ITEMS["items router\n/items"]
        PURCHASES["purchases router\n/purchases"]
        ANALYSIS["analysis router\n/analysis/{id}\n/analysis/{id}/stream\n/analysis/models"]
        DB_LAYER["database.py\nSQLModel Session"]
    end

    subgraph DB["SQLite Database"]
        T_USER["users\n(id, username,\nhashed_password)"]
        T_CLIENT["clients\n(id, name,\nemail, phone)"]
        T_ITEM["items\n(id, name,\ntype, price)"]
        T_PURCHASE["purchases\n(id, client_id,\ntotal_amount)"]
        T_PUR_ITEM["purchase_items\n(purchase_id,\nitem_id, qty,\nunit_price)"]
    end

    subgraph AI["AI Layer"]
        OLLAMA["Ollama\nlocalhost:11434"]
        LLM["LLM Model\n(gpt-oss:20b)"]
    end

    UI --> AC
    AC --> LP
    AC --> DP
    AC --> CP
    AC --> IP
    AC --> PP
    AC --> AP
    AC <--> LS

    LP -->|"POST /token\nPOST /register"| AUTH
    AUTH -->|"JWT Token"| LP
    LP -->|"store token"| LS

    CP -->|"GET/POST/DELETE\n/clients"| CLIENTS
    IP -->|"GET/POST/DELETE\n/items"| ITEMS
    PP -->|"GET/POST\n/purchases"| PURCHASES
    AP -->|"GET /analysis/{id}\nGET /analysis/{id}/stream\nGET /analysis/models"| ANALYSIS

    AUTH --> DB_LAYER
    CLIENTS --> DB_LAYER
    ITEMS --> DB_LAYER
    PURCHASES --> DB_LAYER
    ANALYSIS --> DB_LAYER

    DB_LAYER <--> T_USER
    DB_LAYER <--> T_CLIENT
    DB_LAYER <--> T_ITEM
    DB_LAYER <--> T_PURCHASE
    DB_LAYER <--> T_PUR_ITEM

    ANALYSIS -->|"POST /api/generate\n(stream)"| OLLAMA
    OLLAMA --> LLM
    LLM -->|"Streamed text\nchunks"| ANALYSIS
    ANALYSIS -->|"StreamingResponse\n(text/plain)"| AP
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant LS as localStorage
    participant BE as FastAPI /auth

    User->>FE: Enter credentials
    FE->>BE: POST /token {username, password}
    BE->>BE: bcrypt.verify(password)
    BE->>BE: Create JWT (HS256, 30min TTL)
    BE-->>FE: {access_token, token_type}
    FE->>LS: Store JWT token
    FE->>BE: GET /users/me (Bearer token)
    BE->>BE: Decode & validate JWT
    BE-->>FE: {id, username, created_at}
    FE->>FE: Set AuthContext user state
    FE-->>User: Redirect to Dashboard
```

---

## Purchase Creation Flow

```mermaid
sequenceDiagram
    actor User
    participant PP as PurchasesPage
    participant BE as FastAPI /purchases
    participant DB as SQLite

    User->>PP: Select Client + Items + Qty
    PP->>PP: Calculate total locally
    PP->>BE: POST /purchases {client_id, items:[]}
    BE->>BE: sum(qty * unit_price) = total
    BE->>DB: INSERT Purchase (client_id, total)
    DB-->>BE: purchase.id
    loop for each item
        BE->>DB: INSERT PurchaseItem\n(purchase_id, item_id, qty, price)
    end
    BE-->>PP: Purchase object
    PP-->>User: Success toast + table refresh
```

---

## AI Analysis Flow

```mermaid
sequenceDiagram
    actor User
    participant AP as AnalyzePage
    participant BE as FastAPI /analysis
    participant DB as SQLite
    participant OL as Ollama API

    User->>AP: Select Client → "Analyze"
    AP->>BE: GET /analysis/{client_id}
    BE->>DB: Query Purchases + PurchaseItems + Items
    DB-->>BE: Aggregated data
    BE-->>AP: {total_spent, chart_data, top_items}
    AP->>AP: Render charts (Recharts)

    User->>AP: Click "Generate AI Insight"
    AP->>BE: GET /analysis/{client_id}/stream?lang=en&model=X
    BE->>BE: Build prompt from aggregated data
    BE->>OL: POST /api/generate {model, prompt, stream:true}
    loop Streaming chunks
        OL-->>BE: {response: "text_chunk"}
        BE-->>AP: text chunk (StreamingResponse)
        AP->>AP: Append to Markdown display
    end
    AP-->>User: Full AI insight rendered
```

---

## Data Models & Relationships

```mermaid
erDiagram
    USER {
        int id PK
        string username
        string hashed_password
        datetime created_at
    }

    CLIENT {
        int id PK
        string name
        string email
        string phone
        int user_id FK
        datetime created_at
    }

    ITEM {
        int id PK
        string name
        string type
        float price
        datetime created_at
    }

    PURCHASE {
        int id PK
        int client_id FK
        float total_amount
        datetime created_at
    }

    PURCHASE_ITEM {
        int id PK
        int purchase_id FK
        int item_id FK
        int quantity
        float unit_price
    }

    CLIENT ||--o{ PURCHASE : "has"
    PURCHASE ||--o{ PURCHASE_ITEM : "contains"
    USER ||--o{ CLIENT : "contains"
    ITEM ||--o{ PURCHASE_ITEM : "referenced by"
```

---

## Deployment Topology

```mermaid
graph LR
    subgraph Production["Production (suluk.santrafysh.pro)"]
        FE_PROD["Frontend\nstatic files\n(Nginx/CDN)"]
        BE_PROD["FastAPI Backend\napi.santrafysh.pro"]
    end

    subgraph Local["Local Development"]
        FE_DEV["Vite Dev Server\nlocalhost:5173"]
        BE_DEV["Uvicorn\nlocalhost:8000"]
        OL_DEV["Ollama\nlocalhost:11434"]
        DB_DEV["SQLite\ndatabase.db"]
    end

    FE_PROD -->|HTTPS REST| BE_PROD
    FE_DEV -->|HTTP REST| BE_DEV
    BE_DEV -->|HTTP| OL_DEV
    BE_DEV -->|file| DB_DEV
```
