# Flowbit - Local Development Setup Guide

This guide will help you set up Flowbit for local development on `localhost:3000`.

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **PostgreSQL** database (local or remote)
- **npm** or **yarn** package manager
- **Git** (for cloning the repository)

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
# If you haven't already cloned the repository
git clone <repository-url>
cd flowbit-dev

# Install dependencies
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/flowbit

# Better Auth Configuration
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here-change-in-production-min-32-chars

# OAuth Providers (Optional - leave empty if not using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI Providers (Optional - can also be configured via credentials UI)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Polar (Subscription Management - Optional)
POLAR_ACCESS_TOKEN=
POLAR_SUCCESS_URL=http://localhost:3000/dashboard

# Inngest (Workflow Orchestration - Optional for local dev)
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Sentry (Error Tracking - Optional)
SENTRY_DSN=
SENTRY_ORG=flowbit-no
SENTRY_PROJECT=javascript-nextjs
SENTRY_AUTH_TOKEN=

# Node Environment
NODE_ENV=development
```

**Important Notes:**
- Replace `DATABASE_URL` with your actual PostgreSQL connection string
- Generate a secure `BETTER_AUTH_SECRET` (minimum 32 characters) - you can use: `openssl rand -base64 32`
- OAuth and AI provider keys are optional for basic functionality

### 3. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### 4. Start Development Server

```bash
# Start the Next.js development server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API Routes**: http://localhost:3000/api/*

### 5. Create Your First User

1. Navigate to http://localhost:3000
2. You'll be redirected to `/workflows` (login required)
3. Click "Sign Up" or navigate to `/signup`
4. Create an account with email and password
5. You'll be automatically logged in

## Project Structure

```
flowbit-dev/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/      # Dashboard pages
│   │   └── api/              # API routes
│   ├── components/           # React components
│   ├── features/             # Feature modules
│   │   ├── auth/             # Authentication
│   │   ├── credentials/      # Credential management
│   │   ├── executions/       # Workflow execution
│   │   ├── triggers/         # Trigger nodes
│   │   └── workflows/        # Workflow management
│   ├── lib/                  # Core libraries
│   │   ├── algorithms/       # Algorithm runtime
│   │   ├── data/             # Data layer (connectors, model, governance)
│   │   ├── rules/            # Rule engine
│   │   ├── workflow/         # Workflow execution
│   │   └── ...
│   ├── inngest/             # Inngest functions
│   └── trpc/                 # tRPC routers
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
└── public/                   # Static assets
```

## Key Features Available

### 1. Data Layer
- ✅ Data connectors (REST API, PostgreSQL, Webhooks)
- ✅ Unified data model (Entities, Relationships, Events)
- ✅ Data governance (Audit logs, Permissions)

### 2. Logic & Decision Layer
- ✅ Rule engine (If/Then/Else, thresholds, boolean logic)
- ✅ Algorithm runtime (JavaScript/TypeScript sandboxed execution)
- ✅ AI reasoning (OpenAI, Anthropic, Gemini integrations)

### 3. Workflow Engine
- ✅ Visual workflow builder (React Flow)
- ✅ Node-based execution (Triggers, Conditions, Actions)
- ✅ Execution monitoring and logging

### 4. Governance
- ✅ RBAC (Roles, Teams, Permissions)
- ✅ Audit logging
- ✅ Approval workflows

## Common Issues & Solutions

### Database Connection Issues

**Error**: `Can't reach database server`

**Solution**:
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env` is correct
3. Verify database exists: `createdb flowbit` (PostgreSQL)

### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find and kill process on port 3000
# Windows PowerShell:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port:
PORT=3001 npm run dev
```

### Prisma Client Not Generated

**Error**: `PrismaClient is not initialized`

**Solution**:
```bash
npx prisma generate
```

### Missing Environment Variables

**Error**: `BETTER_AUTH_SECRET is required`

**Solution**: Add `BETTER_AUTH_SECRET` to your `.env` file (minimum 32 characters)

## Development Commands

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

# Database commands
npx prisma generate          # Generate Prisma client
npx prisma migrate dev        # Run migrations
npx prisma studio            # Open Prisma Studio
npx prisma migrate reset     # Reset database (WARNING: deletes all data)
```

## Testing the Application

1. **Create a Workflow**:
   - Navigate to `/workflows`
   - Click "New Workflow"
   - Use the visual editor to build a workflow

2. **Test Data Connectors**:
   - Go to Settings → Data Connectors
   - Add a REST API connector
   - Test connection

3. **Test Rule Engine**:
   - Create a rule with conditions
   - Execute rule with test data

4. **Test Algorithm Runtime**:
   - Create an algorithm (JavaScript)
   - Execute with test inputs

## Next Steps

- Explore the workflow editor at `/workflows`
- Check execution logs at `/executions`
- Review audit logs (via API or database)
- Customize connectors and nodes for your use case

## Support

For issues or questions:
1. Check the [README.md](./README.md) for architecture details
2. Review Prisma schema in `prisma/schema.prisma`
3. Check API routes in `src/app/api/`

## Production Deployment

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md)

