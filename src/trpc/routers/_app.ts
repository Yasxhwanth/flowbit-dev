import { credentialsRouter } from '@/features/credentials/server/routers';
import { createTRPCRouter } from '../init';
import { workflowsRouter } from '@/features/workflows/server/routers';
import { executionsRouter } from '@/features/executions/server/routers';
import { portfolioRouter } from '@/features/portfolio/server/router';
import { workflowVersionRouter } from '@/features/workflows/server/version-router';
import { aiRouter } from '@/features/ai/server/router';

export const appRouter = createTRPCRouter({
  workflows: workflowsRouter,
  credentials: credentialsRouter,
  executions: executionsRouter,
  portfolio: portfolioRouter,
  workflowVersion: workflowVersionRouter,
  ai: aiRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
