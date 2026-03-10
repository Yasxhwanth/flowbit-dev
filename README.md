# Flowbit - Palantir AIP-Style Workflow Automation Platform

A comprehensive workflow automation platform inspired by Palantir AIP, featuring data connectors, decision graphs, rule engines, AI reasoning, and enterprise-grade governance.

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory (see `.env.example` for reference):
   ```bash
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/flowbit
   
   # Better Auth (REQUIRED)
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
   BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars
   
   # OAuth Providers (Optional)
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   
   # AI Providers (Optional - can use credentials UI)
   OPENAI_API_KEY=
   ANTHROPIC_API_KEY=
   GOOGLE_GENERATIVE_AI_API_KEY=
   
   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   
   **Important**: Generate a secure `BETTER_AUTH_SECRET` (minimum 32 characters):
   ```bash
   # Linux/Mac
   openssl rand -base64 32
   
   # Or use any secure random string generator
   ```

3. **Set up database:**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # (Optional) Open Prisma Studio to view database
   npx prisma studio
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### 1. Data Layer (Foundation)
- **Data Connectors**: REST/GraphQL APIs, Database connectors (Postgres, MySQL, MongoDB), SaaS integrations, File ingestion, Webhooks
- **Unified Data Model**: Canonical object model with Entities, Relationships, Events, Schema versioning
- **Data Governance**: Read/write permissions, Row-level/field-level access control, Data lineage, Audit logs

### 2. Logic & Decision Layer
- **Rule Engine**: If/Then/Else rules, Thresholds, Boolean logic chaining, Priority & conflict resolution
- **User Algorithm Runtime**: Sandboxed Python/JS execution, Versioned algorithms, Input/output contracts
- **AI Reasoning Layer**: LLM-based reasoning, "Suggest decision" vs "Execute decision", Human-in-the-loop approval

### 3. Decision Graph & Workflow Engine
- **Decision Graph Builder**: Visual drag-and-drop builder with stateful graphs, Conditional branching, Parallel execution
- **Execution Engine**: Deterministic orchestration, Retry semantics, Idempotent actions, Rollback/compensation logic
- **Scheduling & Triggers**: Time-based (cron), Event-based, Data-change triggers, External webhooks

### 4. Action Layer
- **System Actions**: API calls, Database updates, File generation, Notifications
- **Human Actions**: Approval requests, Task assignments, Escalations, Manual overrides
- **Financial Actions**: Trade execution, Fund transfers (with guardrails)

### 5. Governance, Safety & Control
- **RBAC**: Users, roles, teams, Permissions per data/logic/action, Environment separation
- **Approval & Policy Enforcement**: Mandatory approvals, Multi-step approval chains, Policy-as-code, Emergency kill switches
- **Auditability**: Immutable execution logs, Full traceability, Exportable audit reports

### 6. Observability & Monitoring
- **Execution Monitoring**: Live workflow status, Failed step diagnostics, Execution timelines, Resource usage
- **Decision Analytics**: Success/failure rates, Outcome tracking, Drift detection, Performance metrics

### 7. Developer & Power-User Tooling
- **SDKs & APIs**: REST/GraphQL APIs, SDKs (Python, JS), Webhook support, CLI tooling
- **Testing & Simulation**: Dry-run execution, Backtesting on historical data, Scenario simulation, What-if analysis

### 8. UI/UX Features
- **Visual Builder**: Drag-and-drop decision graphs, Inline rule editing, Code editor for algos, Live validation
- **Dashboards**: Operational dashboards, Risk & compliance views, Performance metrics, Alert panels

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   └── (dashboard)/       # Dashboard pages
├── components/            # React components
├── features/              # Feature modules
│   ├── auth/             # Authentication
│   ├── credentials/      # Credential management
│   ├── executions/       # Workflow execution
│   ├── triggers/         # Trigger nodes
│   └── workflows/        # Workflow management
├── lib/                   # Core libraries
│   ├── auth.ts           # Auth configuration
│   ├── db.ts             # Database client
│   ├── broker/           # Broker integrations
│   ├── conditions/      # Condition evaluation
│   ├── credentials/     # Credential encryption
│   ├── workflow/        # Workflow execution
│   └── data/            # Data layer (NEW)
│       ├── connectors/  # Data connectors
│       ├── model/       # Unified data model
│       └── governance/  # Data governance
├── inngest/              # Inngest functions
└── trpc/                 # tRPC routers
```

## 🛠️ Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Database migrations
npx prisma migrate dev
npx prisma studio  # Open Prisma Studio
```

## 📚 Key Technologies

- **Next.js 15** - React framework
- **Prisma** - Database ORM
- **Inngest** - Workflow orchestration
- **tRPC** - Type-safe APIs
- **React Flow** - Visual workflow builder
- **Better Auth** - Authentication
- **Tailwind CSS** - Styling

## 🔐 Security

- Row-level and field-level access control
- Encrypted credential storage
- Audit logging for all operations
- Sandboxed algorithm execution
- Policy-based action enforcement

## 📝 License

Private - All rights reserved
