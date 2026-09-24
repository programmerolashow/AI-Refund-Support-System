# AI-Powered Customer Support Refund System
> **Worknoon Full Stack Engineer Technical Assessment**

A production-minded, fully containerized web application that evaluates e-commerce customer refund requests. The system combines **deterministic policy enforcement** with a **controlled LLM decision-support layer** to automatically output `APPROVED`, `DENIED`, or `ESCALATED` decisions, backed by immutable audit logging and an internal support dashboard.

---

## 🏗 Architecture

```mermaid
flowchart TD
    Customer["Customer (Portal UI)"] -->|POST /api/refunds| API["Backend Express API"]
    Admin["Support Staff (Admin Dashboard)"] -->|GET /api/refunds (Bearer Auth)| API
    
    subgraph Backend Engine
        API --> Validator["Zod Schema Validator"]
        Validator --> Repo["Prisma Repositories"]
        Repo --> DB[("PostgreSQL DB")]
        
        API --> Policy["1. Deterministic Policy Engine"]
        Policy -->|Policy Checks| AI["2. AI Service (OpenAI / Provider)"]
        Policy --> Decision["3. Decision Engine Hierarchy"]
        AI -->|JSON Analysis / Signals| Decision
        
        Decision --> Audit["4. Audit Service ($transaction)"]
        Audit --> DB
    end
    
    Decision -->|Response: APPROVED / DENIED / ESCALATED| Customer
```

### Architectural Component Boundaries
1. **Frontend**: React + TypeScript + Vite + Tailwind CSS (`/` Customer Portal, `/admin` Support Dashboard).
2. **Backend API**: Node.js + Express + TypeScript with Zod validation and structured error handling.
3. **Deterministic Policy Engine**: Independent, zero-LLM policy evaluator enforcing hard business constraints.
4. **AI Service**: Isolated OpenAI provider abstraction producing structured JSON analysis with graceful fallbacks.
5. **Decision Engine**: Explicit 3-tier hierarchy that fuses policy rules and AI risk signals. Policy hard blocks ALWAYS take precedence over LLM signals.
6. **Database & Audit Layer**: PostgreSQL + Prisma ORM storing relational models and structured audit logs.

---

## ⚡ Major Features

- **Customer Refund Portal**: Clean, responsive interface allowing customers to submit natural-language refund requests with instant decision feedback and clear next steps.
- **Interactive Preset Scenarios**: One-click demo triggers for valid refunds, expired orders, final-sale items, and high-value orders.
- **Support Admin Dashboard**: Separate `/admin` route providing real-time metrics, search/filtering, and detailed request inspection modals.
- **Deterministic Policy Enforcement**: Strict policy engine evaluating 7 business rules independently of LLM outputs.
- **Controlled LLM Decision Support**: Uses OpenAI `gpt-4o-mini` for intent extraction, ambiguity detection, and natural language explanation generation.
- **Security & Prompt Guard**: Protects system prompts against jailbreak attacks (`System:`, `Ignore instructions`, `Override policy`) using XML tags (`<untrusted_customer_message>`) and input sanitization.
- **Full Containerization**: Zero-configuration startup with `docker-compose up --build`.

---

## 🔄 Refund Decision Flow

```text
Customer Request 
  ➜ Zod Input Validation 
  ➜ Customer & Order Retrieval 
  ➜ Customer/Order Ownership Verification 
  ➜ Deterministic Policy Evaluation (Hard Rules)
  ➜ AI Intent & Risk Analysis (Structured JSON)
  ➜ Decision Engine Fusion (Explicit 3-Tier Hierarchy)
  ➜ Prisma Transaction (RefundRequest + AuditLog)
  ➜ API Response (Clean Public Explanation)
```

### Decision Hierarchy Rules:
1. **Level 1: Hard Policy Denial (`DENIED`)** — If any hard policy rule fails (`FINAL_SALE`, `REFUND_WINDOW` >30d, `ORDER_STATUS` cancelled, `MISSING_DATA`), the decision is **`DENIED`**. **Hard Rule**: AI output can NEVER override a hard policy denial.
2. **Level 2: Mandatory Escalation (`ESCALATED`)** — If order total > $500 OR statement conflicts are detected OR `aiRisk === 'high'` OR `aiNeedsEscalation === true`, the request is routed for human support review.
3. **Level 3: Policy & AI Consensus (`APPROVED`)** — Granted only when all policy rules pass AND AI risk assessment is low.

---

## 🤖 AI Integration & Boundaries

### Why AI is Used
Natural language customer requests contain context, tone, and intent that static regex cannot understand. The LLM acts as an **analytical support layer** to interpret natural language, extract product/condition mentions, and generate empathetic explanations.

### What AI Controls vs. What AI Does NOT Control
- **AI Controls**: Intent classification (`refund_request`, `status_inquiry`), confidence scoring, ambiguity flags, risk assessment (`low`, `medium`, `high`), and polite customer-facing explanations.
- **AI Does NOT Control**: Policy eligibility, hard block enforcement, refund authorization limits, or database records.

### Structured Output & Zod Validation
The AI service enforces JSON mode matching `aiAnalysisSchema`:
```json
{
  "intent": "refund_request",
  "confidence": 0.96,
  "risk": "low",
  "needsEscalation": false,
  "isAmbiguous": false,
  "suspiciousFlags": [],
  "extractedDetails": { "productMentioned": "Coffee Maker", "claimedCondition": "DAMAGED" },
  "reasoning": "Customer reported transit damage for eligible order.",
  "customerResponse": "Your refund request for ORD-1004 has been approved."
}
```

### Graceful Fallback Behavior
If the OpenAI API key is missing, network calls fail, requests time out (>5s), or output fails Zod validation, the system **falls back to a deterministic safety response**. The application never crashes and never issues unverified automatic approvals.

---

## 🔒 Security Model

- **Prompt Injection Defense**: Sanitizes adversarial strings (`"System:"`, `"Ignore previous instructions"`, `"I am an administrator"`, `"Override policy"`) and wraps customer input in `<untrusted_customer_message>` tags.
- **Deterministic Override Prevention**: Hard blocks enforced by code logic before LLM output is evaluated.
- **Payload Validation**: Zod schema rejects malformed payloads and caps input length at 1000 characters to prevent buffer size attacks.
- **Admin API Authorization**: Protected GET endpoints require `Authorization: Bearer <ADMIN_API_KEY>` or `x-admin-api-key` header.
- **Secret & Prompt Leak Prevention**: System prompts, API keys, and internal DB errors are filtered out of public customer API responses.

---

## 🛠 Local Development & Setup

### Prerequisites
- Docker & Docker Compose
- Node.js v20+ & npm (for local non-Docker development)

### Quick Start with Docker
```bash
# 1. Clone repository
cd worknoon-customer-support

# 2. Copy environment template
cp .env.example .env

# 3. Launch container stack
docker-compose up --build
```
*App Services:*
- **Frontend Portal**: `http://localhost:3000` (Customer Portal) & `http://localhost:3000/admin` (Support Admin Dashboard)
- **Backend API**: `http://localhost:3001/api/health`
- **PostgreSQL**: `localhost:5432`

---

## 🧪 Testing

The repository includes **36 automated unit, policy, API, AI, decision, and security penetration tests**.

```bash
# Run all backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Type check monorepo
npx tsc --project backend/tsconfig.json
npx tsc --project frontend/tsconfig.json
```

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System health check |
| `POST` | `/api/refunds` | Public | Submit refund request for evaluation |
| `GET` | `/api/refunds` | Admin Bearer | List all refund requests & audit records |
| `GET` | `/api/refunds/:id` | Admin Bearer | Get detailed refund request & audit log |
| `GET` | `/api/customers/:id` | Admin Bearer | Get customer profile & order history |
| `GET` | `/api/orders/:id` | Admin Bearer | Get order details & item conditions |

---

## 📊 Synthetic Seed Dataset

The seed script (`npm run db:seed`) populates **15 realistic synthetic customers** and order histories covering key assessment scenarios:

- **ORD-1001 (Alice Johnson)**: Valid refund (<30 days old, standard items) ➔ `APPROVED`
- **ORD-1002 (Bob Smith)**: Expired order (45 days old > 30-day limit) ➔ `DENIED`
- **ORD-1003 (Charlie Davis)**: Final-sale clearance item ➔ `DENIED`
- **ORD-1004 (Diana Prince)**: Damaged ceramic coffee maker ➔ `APPROVED`
- **ORD-1005 (Evan Wright)**: Incorrect item sent ➔ `APPROVED`
- **ORD-1006 (Fiona Gallagher)**: High-value order ($850 4K Monitor > $500 threshold) ➔ `ESCALATED`
- **ORD-1007 (George Clark)**: Suspicious request (Cancelled order status) ➔ `ESCALATED`
- **ORD-1008 to ORD-1015**: 8 additional realistic customer order histories.

---

## 💡 Assumptions & Trade-Offs

### Key Assumptions
1. **Refund Window**: Standard policy refund window is configured to 30 calendar days.
2. **Review Threshold**: Refund requests exceeding $500 total amount require human review.
3. **Admin Token**: Simplified Bearer key (`ADMIN_API_KEY`) used for interview demonstration.

### Strategic Trade-Offs
- **Synchronous AI Evaluation vs. Asynchronous Queue**: Used synchronous API processing with strict 5-second timeouts for immediate customer feedback.
- **Single DB Transaction vs. Distributed Sagas**: Wrapped `RefundRequest` creation and `AuditLog` generation in a single Prisma transaction (`$transaction`) for transactional consistency.

---

## 🔮 Future Improvements

1. **Enterprise SSO & Role-Based Access Control (RBAC)**: OAuth2 / OIDC integration for support agents vs. admins.
2. **Human Approval Workflow UI**: Interactive approval/rejection buttons for support staff on `ESCALATED` tickets in `/admin`.
3. **Asynchronous Job Queue**: BullMQ / Redis background worker for batch processing LLM evaluations during peak traffic.
4. **CRM Integration**: Webhook sync with Zendesk, Salesforce Service Cloud, or Gorgias.
5. **Observability & Tracing**: OpenTelemetry tracing for prompt latency, token costs, and policy execution timing.