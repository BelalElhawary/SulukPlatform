# Suluk Platform
![Suluk](suluk-platform-frontend/public/logo.jpeg)

**Predictive Customer Behavior Analytics & Management Dashboard**

Suluk Platform is a modern, full-stack application designed to help businesses manage their clients, inventory, and purchases, while leveraging local AI to generate predictive insights into customer spending behavior.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Description
Suluk Platform seamlessly integrates traditional CRM and POS functionalities with advanced AI-driven analytics. By tracking purchase histories and client interactions, the platform uses local Large Language Models (LLMs) via Ollama and vector databases (ChromaDB) to analyze patterns, segment customers, and predict future behaviors (such as recurring purchases and holiday spending trends).

The application fully supports English and Arabic (RTL) layouts, ensuring a localized and accessible experience.

---

## 🚀 Key Features
* **Client & Inventory Management:** Add, edit, and track clients and products/services.
* **Purchase Tracking:** Record transactions and monitor total client spending.
* **AI-Powered Analytics:** 
  * Generate deep behavioral insights based on historical purchase data.
  * Vector embeddings (ChromaDB) for semantic search over customer data.
  * Local LLM integration (Ollama) to ensure data privacy while generating reports.
* **Interactive Dashboards:** Visualized metrics using Recharts (spending history, top items, holiday vs. regular purchases).
* **Bilingual UI (L10n):** Full support for English and Arabic with native Right-to-Left (RTL) Tailwind CSS logical properties.
* **Mobile Responsive:** Optimized data tables and fluid layouts for seamless use on any device.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (with logical properties for RTL), shadcn/ui
- **Data Visualization:** Recharts
- **Internationalization:** i18next

### Backend & AI
- **Framework:** FastAPI, Python
- **Database:** SQLModel (SQLite)
- **Authentication:** JWT (JSON Web Tokens)
- **AI & ML:** Ollama (Local LLMs), ChromaDB (Vector Database)

---

## 📁 Project Structure
```text
├── suluk-platform-frontend/    # React/Vite web application
│   ├── src/pages/              # Dashboard, Clients, Purchases, Analyze pages
│   ├── src/components/         # Reusable UI components & layouts
│   └── src/lib/                # i18n configurations and utilities
├── suluk-platform-ai-backend/  # FastAPI backend service
│   ├── routers/                # API routes (auth, clients, items, purchases, analysis)
│   ├── database.py             # SQLite setup
│   └── models.py               # SQLModel schemas
└── project-production-run.bat  # Production startup script
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- [Ollama](https://ollama.ai/) installed and running locally with desired models.

### Running the Application

For a production build and execution, simply run the included batch script from the root directory:

```bash
./project-production-run.bat
```

This script will:
1. Start the Ollama service.
2. Launch the FastAPI backend on `http://localhost:8000`.
3. Build the Vite React frontend and serve it on `http://localhost:4173`.
