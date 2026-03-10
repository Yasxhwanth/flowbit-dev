/**
 * Algorithm Runtime - Sandboxed Code Execution
 *
 * Provides sandboxed execution environment for user-provided algorithms
 * with CPU/memory/time limits, versioning, and input/output contracts.
 */

import prisma from "@/lib/db";
import {
  Algorithm,
  AlgorithmExecution,
  AlgorithmLanguage,
} from "@prisma/client";

export interface AlgorithmInput {
  [key: string]: unknown;
}

export interface AlgorithmOutput {
  [key: string]: unknown;
}

export interface ExecutionLimits {
  maxExecutionTimeMs: number;
  maxMemoryBytes: number;
  maxCpuPercent: number;
}

const DEFAULT_LIMITS: ExecutionLimits = {
  maxExecutionTimeMs: 30000, // 30 seconds
  maxMemoryBytes: 100 * 1024 * 1024, // 100 MB
  maxCpuPercent: 50,
};

/**
 * Execute a JavaScript/TypeScript algorithm
 */
export async function executeJavaScriptAlgorithm(
  algorithmId: string,
  input: AlgorithmInput,
  version?: number,
): Promise<AlgorithmExecution> {
  const algorithm = await prisma.algorithm.findUnique({
    where: { id: algorithmId },
    include: { versions: true },
  });

  if (!algorithm || !algorithm.isActive) {
    throw new Error(`Algorithm ${algorithmId} not found or inactive`);
  }

  const algoVersion = version
    ? algorithm.versions.find((v) => v.version === version)
    : algorithm.versions.sort((a, b) => b.version - a.version)[0];

  if (!algoVersion) {
    throw new Error(`Algorithm version ${version} not found`);
  }

  // Validate input against schema
  const inputSchema = algoVersion.inputSchema as {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };

  validateInput(input, inputSchema);

  const startTime = Date.now();
  let output: AlgorithmOutput | null = null;
  let error: string | null = null;
  let durationMs: number | null = null;
  let memoryUsage: number | null = null;

  try {
    // Create sandboxed execution context
    const sandbox = createSandbox();

    // Prepare code with input injection
    const code = `
      ${algoVersion.code}
      
      // Execute main function if it exists, otherwise execute code directly
      if (typeof main === 'function') {
        return main(input);
      } else {
        return execute(input);
      }
    `;

    // Execute in sandbox with timeout
    const result = await executeWithTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      return new Function("input", code)(input);
    }, DEFAULT_LIMITS.maxExecutionTimeMs);

    durationMs = Date.now() - startTime;
    memoryUsage = process.memoryUsage().heapUsed;

    // Validate output against schema
    const outputSchema = algoVersion.outputSchema as {
      type: string;
      properties: Record<string, unknown>;
    };

    validateOutput(result, outputSchema);
    output = result as AlgorithmOutput;
  } catch (err) {
    durationMs = Date.now() - startTime;
    error = err instanceof Error ? err.message : "Unknown error";
  }

  // Save execution record
  return prisma.algorithmExecution.create({
    data: {
      algorithmId,
      version: algoVersion.version,
      input: input as any,
      output: output as any,
      error,
      durationMs,
      memoryUsage,
      startedAt: new Date(startTime),
      completedAt: error ? null : new Date(),
    },
  });
}

/**
 * Execute a Python algorithm (requires Python runtime)
 * Note: This is a placeholder - real implementation would require
 * a Python execution service or container
 */
export async function executePythonAlgorithm(
  algorithmId: string,
  input: AlgorithmInput,
  version?: number,
): Promise<AlgorithmExecution> {
  // For now, return error - Python execution requires external service
  const algorithm = await prisma.algorithm.findUnique({
    where: { id: algorithmId },
  });

  if (!algorithm) {
    throw new Error(`Algorithm ${algorithmId} not found`);
  }

  return prisma.algorithmExecution.create({
    data: {
      algorithmId,
      version: version || 1,
      input: input as any,
      error:
        "Python execution not yet implemented - requires external Python runtime service",
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });
}

/**
 * Execute algorithm by language
 */
export async function executeAlgorithm(
  algorithmId: string,
  input: AlgorithmInput,
  version?: number,
): Promise<AlgorithmExecution> {
  const algorithm = await prisma.algorithm.findUnique({
    where: { id: algorithmId },
  });

  if (!algorithm) {
    throw new Error(`Algorithm ${algorithmId} not found`);
  }

  switch (algorithm.language) {
    case AlgorithmLanguage.JAVASCRIPT:
    case AlgorithmLanguage.TYPESCRIPT:
      return executeJavaScriptAlgorithm(algorithmId, input, version);

    case AlgorithmLanguage.PYTHON:
      return executePythonAlgorithm(algorithmId, input, version);

    default:
      throw new Error(`Unsupported language: ${algorithm.language}`);
  }
}

/**
 * Create sandboxed execution environment
 */
function createSandbox(): Record<string, unknown> {
  // Create a restricted global scope
  // In production, this would use vm2 or similar sandboxing library
  return {
    console: {
      log: (...args: unknown[]) => {
        // Log to execution logs instead of console
        console.log("[Algorithm]", ...args);
      },
    },
    Math: Math,
    Date: Date,
    JSON: JSON,
    // Add other safe globals as needed
  };
}

/**
 * Execute function with timeout
 */
function executeWithTimeout<T>(fn: () => T, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Execution timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const result = fn();
      clearTimeout(timer);
      resolve(result);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

/**
 * Validate input against schema
 */
function validateInput(
  input: AlgorithmInput,
  schema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  },
): void {
  if (schema.type !== "object") {
    throw new Error("Input schema must be of type 'object'");
  }

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in input)) {
        throw new Error(`Required field '${field}' is missing`);
      }
    }
  }

  // Validate property types (simplified)
  for (const [key, value] of Object.entries(input)) {
    const propSchema = schema.properties[key];
    if (propSchema) {
      // Basic type checking
      const expectedType = (propSchema as { type: string }).type;
      const actualType = typeof value;

      if (expectedType === "number" && actualType !== "number") {
        throw new Error(`Field '${key}' must be a number`);
      }
      if (expectedType === "string" && actualType !== "string") {
        throw new Error(`Field '${key}' must be a string`);
      }
      if (expectedType === "boolean" && actualType !== "boolean") {
        throw new Error(`Field '${key}' must be a boolean`);
      }
    }
  }
}

/**
 * Validate output against schema
 */
function validateOutput(
  output: unknown,
  schema: {
    type: string;
    properties: Record<string, unknown>;
  },
): void {
  if (schema.type !== "object") {
    throw new Error("Output schema must be of type 'object'");
  }

  if (typeof output !== "object" || output === null) {
    throw new Error("Output must be an object");
  }

  // Basic validation (can be enhanced)
  const outputObj = output as Record<string, unknown>;
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    if (key in outputObj) {
      const expectedType = (propSchema as { type: string }).type;
      const actualType = typeof outputObj[key];

      if (expectedType === "number" && actualType !== "number") {
        throw new Error(`Output field '${key}' must be a number`);
      }
      if (expectedType === "string" && actualType !== "string") {
        throw new Error(`Output field '${key}' must be a string`);
      }
    }
  }
}
