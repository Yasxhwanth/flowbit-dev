// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://8791b1caa2c3a09006ccce1c89bd9a92@o4510374549127168.ingest.us.sentry.io/4510374550568960",

  integrations: [
    Sentry.vercelAIIntegration({
      recordInputs: true, // Whether to record AI inputs
      recordOutputs: true, // Whether to record AI outputs
    }),
    Sentry.consoleLoggingIntegration({levels:["log","warn","error"]}),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  debug:false,
});
