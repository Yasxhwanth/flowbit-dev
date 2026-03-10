/**
 * Unified Data Model - Entity Management
 *
 * Provides canonical object model for entities, relationships, and events
 * following Palantir AIP architecture.
 */

import prisma from "@/lib/db";
import {
  DataEntity,
  DataRelationship,
  DataEvent,
  DataSchema,
} from "@prisma/client";

export interface EntityProperties {
  [key: string]: unknown;
}

export interface CreateEntityInput {
  type: string;
  schemaId: string;
  properties: EntityProperties;
  metadata?: Record<string, unknown>;
  userId: string;
}

export interface CreateRelationshipInput {
  type: string;
  fromEntityId: string;
  toEntityId: string;
  properties?: Record<string, unknown>;
}

export interface CreateEventInput {
  type: string;
  entityId: string;
  payload: Record<string, unknown>;
  source?: string;
}

/**
 * Create a new entity in the unified data model
 */
export async function createEntity(
  input: CreateEntityInput,
): Promise<DataEntity> {
  return prisma.dataEntity.create({
    data: {
      type: input.type,
      schemaId: input.schemaId,
      properties: input.properties as any,
      metadata: (input.metadata as any) || {},
      userId: input.userId,
      version: 1,
    },
  });
}

/**
 * Get entity by ID
 */
export async function getEntity(id: string): Promise<DataEntity | null> {
  return prisma.dataEntity.findUnique({
    where: { id },
    include: {
      schema: true,
    },
  });
}

/**
 * Query entities by type
 */
export async function getEntitiesByType(
  type: string,
  userId: string,
  limit = 100,
): Promise<DataEntity[]> {
  return prisma.dataEntity.findMany({
    where: {
      type,
      userId,
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Update entity properties
 */
export async function updateEntity(
  id: string,
  properties: Partial<EntityProperties>,
): Promise<DataEntity> {
  const entity = await prisma.dataEntity.findUnique({ where: { id } });
  if (!entity) {
    throw new Error(`Entity ${id} not found`);
  }

  const updatedProperties = {
    ...(entity.properties as EntityProperties),
    ...properties,
  };

  return prisma.dataEntity.update({
    where: { id },
    data: {
      properties: updatedProperties as any,
      version: entity.version + 1,
    },
  });
}

/**
 * Create a relationship between entities
 */
export async function createRelationship(
  input: CreateRelationshipInput,
): Promise<DataRelationship> {
  return prisma.dataRelationship.create({
    data: {
      type: input.type,
      fromEntityId: input.fromEntityId,
      toEntityId: input.toEntityId,
      properties: (input.properties as any) || {},
    },
  });
}

/**
 * Get relationships for an entity
 */
export async function getEntityRelationships(
  entityId: string,
): Promise<DataRelationship[]> {
  return prisma.dataRelationship.findMany({
    where: {
      OR: [{ fromEntityId: entityId }, { toEntityId: entityId }],
    },
  });
}

/**
 * Create an event for an entity
 */
export async function createEvent(input: CreateEventInput): Promise<DataEvent> {
  return prisma.dataEvent.create({
    data: {
      type: input.type,
      entityId: input.entityId,
      payload: input.payload as any,
      source: input.source,
    },
  });
}

/**
 * Get events for an entity
 */
export async function getEntityEvents(
  entityId: string,
  limit = 100,
): Promise<DataEvent[]> {
  return prisma.dataEvent.findMany({
    where: { entityId },
    take: limit,
    orderBy: {
      timestamp: "desc",
    },
  });
}

/**
 * Create entity snapshot for historical tracking
 */
export async function createEntitySnapshot(entityId: string): Promise<void> {
  const entity = await prisma.dataEntity.findUnique({
    where: { id: entityId },
  });
  if (!entity) {
    throw new Error(`Entity ${entityId} not found`);
  }

  await prisma.entitySnapshot.create({
    data: {
      entityId,
      properties: entity.properties as any,
      timestamp: new Date(),
    },
  });
}

/**
 * Get entity history (snapshots)
 */
export async function getEntityHistory(
  entityId: string,
  limit = 50,
): Promise<Array<{ properties: unknown; timestamp: Date }>> {
  return prisma.entitySnapshot.findMany({
    where: { entityId },
    take: limit,
    orderBy: {
      timestamp: "desc",
    },
    select: {
      properties: true,
      timestamp: true,
    },
  });
}
