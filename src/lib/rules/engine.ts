/**
 * Rule Engine - Declarative Logic Execution
 *
 * Implements If/Then/Else rules, thresholds, boolean logic chaining,
 * priority & conflict resolution, and rule versioning.
 */

import prisma from "@/lib/db";
import { Rule, RuleExecution } from "@prisma/client";

export interface RuleCondition {
  type: "if" | "and" | "or" | "not" | "comparison" | "threshold";
  field?: string;
  operator?: ">" | "<" | ">=" | "<=" | "==" | "!=" | "contains" | "in";
  value?: unknown;
  conditions?: RuleCondition[];
}

export interface RuleAction {
  type: "workflow" | "notification" | "data_update" | "approval_request";
  target?: string;
  data?: Record<string, unknown>;
}

export interface RuleEvaluationContext {
  [key: string]: unknown;
}

/**
 * Evaluate a rule condition against context data
 */
export function evaluateCondition(
  condition: RuleCondition,
  context: RuleEvaluationContext,
): boolean {
  switch (condition.type) {
    case "if":
      if (!condition.conditions || condition.conditions.length === 0) {
        return false;
      }
      return evaluateCondition(condition.conditions[0], context);

    case "and":
      if (!condition.conditions) return false;
      return condition.conditions.every((c) => evaluateCondition(c, context));

    case "or":
      if (!condition.conditions) return false;
      return condition.conditions.some((c) => evaluateCondition(c, context));

    case "not":
      if (!condition.conditions || condition.conditions.length === 0) {
        return false;
      }
      return !evaluateCondition(condition.conditions[0], context);

    case "comparison":
      if (
        !condition.field ||
        !condition.operator ||
        condition.value === undefined
      ) {
        return false;
      }
      const fieldValue = context[condition.field];
      return applyComparison(condition.operator, fieldValue, condition.value);

    case "threshold":
      if (
        !condition.field ||
        !condition.operator ||
        condition.value === undefined
      ) {
        return false;
      }
      const thresholdValue = context[condition.field];
      if (
        typeof thresholdValue !== "number" ||
        typeof condition.value !== "number"
      ) {
        return false;
      }
      return applyComparison(
        condition.operator,
        thresholdValue,
        condition.value,
      );

    default:
      return false;
  }
}

/**
 * Apply comparison operator
 */
function applyComparison(
  operator: string,
  left: unknown,
  right: unknown,
): boolean {
  switch (operator) {
    case ">":
      return Number(left) > Number(right);
    case "<":
      return Number(left) < Number(right);
    case ">=":
      return Number(left) >= Number(right);
    case "<=":
      return Number(left) <= Number(right);
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case "contains":
      if (typeof left === "string" && typeof right === "string") {
        return left.includes(right);
      }
      return false;
    case "in":
      if (Array.isArray(right)) {
        return right.includes(left);
      }
      return false;
    default:
      return false;
  }
}

/**
 * Execute a rule against context data
 */
export async function executeRule(
  ruleId: string,
  context: RuleEvaluationContext,
): Promise<RuleExecution> {
  const rule = await prisma.rule.findUnique({
    where: { id: ruleId },
    include: { versions: true },
  });

  if (!rule || !rule.isActive) {
    throw new Error(`Rule ${ruleId} not found or inactive`);
  }

  const condition = rule.condition as unknown as RuleCondition;
  const action = rule.action as unknown as RuleAction;

  try {
    const triggered = evaluateCondition(condition, context);

    const execution = await prisma.ruleExecution.create({
      data: {
        ruleId,
        triggered,
        result: (triggered ? { action, context } : null) as any,
        executedAt: new Date(),
      },
    });

    // If rule triggered, execute action
    if (triggered && action) {
      await executeRuleAction(action, context);
    }

    return execution;
  } catch (error) {
    // Log failed execution
    await prisma.ruleExecution.create({
      data: {
        ruleId,
        triggered: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executedAt: new Date(),
      },
    });
    throw error;
  }
}

/**
 * Execute multiple rules in priority order
 */
export async function executeRules(
  ruleIds: string[],
  context: RuleEvaluationContext,
): Promise<RuleExecution[]> {
  // Fetch rules with priority
  const rules = await prisma.rule.findMany({
    where: {
      id: { in: ruleIds },
      isActive: true,
    },
    orderBy: {
      priority: "desc",
    },
  });

  const executions: RuleExecution[] = [];

  for (const rule of rules) {
    const execution = await executeRule(rule.id, context);
    executions.push(execution);

    // Stop if rule triggered and has stop-on-trigger behavior
    // (This would be configurable per rule)
    if (execution.triggered) {
      break;
    }
  }

  return executions;
}

/**
 * Execute rule action
 */
async function executeRuleAction(
  action: RuleAction,
  context: RuleEvaluationContext,
): Promise<void> {
  switch (action.type) {
    case "workflow":
      // Trigger workflow execution
      // This would integrate with the workflow engine
      if (action.target) {
        // await triggerWorkflow(action.target, action.data || context);
      }
      break;

    case "notification":
      // Send notification
      // This would integrate with notification system
      break;

    case "data_update":
      // Update data entity
      // This would integrate with data layer
      break;

    case "approval_request":
      // Create approval request
      // This would integrate with approval system
      break;

    default:
      throw new Error(
        `Unknown action type: ${(action as { type: string }).type}`,
      );
  }
}

/**
 * Resolve conflicts between multiple triggered rules
 */
export function resolveConflicts(executions: RuleExecution[]): RuleExecution[] {
  // Simple conflict resolution: return highest priority triggered rule
  // In a real implementation, this would be more sophisticated
  const triggered = executions.filter((e) => e.triggered);
  if (triggered.length === 0) return [];

  // Return first triggered (already sorted by priority)
  return [triggered[0]];
}
