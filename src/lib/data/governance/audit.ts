/**
 * Data Governance - Audit Logging
 *
 * Immutable audit logs for all data changes and operations
 */

import prisma from "@/lib/db";
import { AuditAction } from "@prisma/client";

export interface AuditLogInput {
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      details: (input.details as any) || {},
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      timestamp: new Date(),
    },
  });
}

/**
 * Get audit logs for a resource
 */
export async function getResourceAuditLogs(
  resourceType: string,
  resourceId: string,
  limit = 100,
) {
  return prisma.auditLog.findMany({
    where: {
      resourceType,
      resourceId,
    },
    take: limit,
    orderBy: {
      timestamp: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { userId },
    take: limit,
    orderBy: {
      timestamp: "desc",
    },
  });
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(action: AuditAction, limit = 100) {
  return prisma.auditLog.findMany({
    where: { action },
    take: limit,
    orderBy: {
      timestamp: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Export audit logs as report
 */
export async function exportAuditReport(
  startDate?: Date,
  endDate?: Date,
  resourceType?: string,
) {
  const where: {
    timestamp?: { gte?: Date; lte?: Date };
    resourceType?: string;
  } = {};

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  if (resourceType) {
    where.resourceType = resourceType;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: {
      timestamp: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}
