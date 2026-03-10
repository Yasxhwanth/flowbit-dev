/**
 * Unified Data Model - Schema Management
 *
 * Handles schema versioning and definitions for the canonical data model
 */

import prisma from "@/lib/db";
import { DataSchema, SchemaVersion } from "@prisma/client";

export interface SchemaDefinition {
  fields: Array<{
    name: string;
    type: string;
    required?: boolean;
    constraints?: Record<string, unknown>;
  }>;
  indexes?: Array<{
    fields: string[];
    unique?: boolean;
  }>;
}

export interface CreateSchemaInput {
  name: string;
  definition: SchemaDefinition;
  userId: string;
}

export interface UpdateSchemaInput {
  definition: SchemaDefinition;
  changelog?: string;
}

/**
 * Create a new schema
 */
export async function createSchema(
  input: CreateSchemaInput,
): Promise<DataSchema> {
  return prisma.dataSchema.create({
    data: {
      name: input.name,
      version: 1,
      definition: input.definition as any,
      userId: input.userId,
      isActive: true,
    },
  });
}

/**
 * Get schema by ID
 */
export async function getSchema(id: string): Promise<DataSchema | null> {
  return prisma.dataSchema.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: {
          version: "desc",
        },
      },
    },
  });
}

/**
 * Get schema by name and version
 */
export async function getSchemaByName(
  name: string,
  version?: number,
): Promise<DataSchema | null> {
  if (version) {
    return prisma.dataSchema.findFirst({
      where: {
        name,
        version,
      },
    });
  }

  // Get latest active version
  return prisma.dataSchema.findFirst({
    where: {
      name,
      isActive: true,
    },
    orderBy: {
      version: "desc",
    },
  });
}

/**
 * Create a new version of a schema
 */
export async function createSchemaVersion(
  schemaId: string,
  input: UpdateSchemaInput,
): Promise<{ schema: DataSchema; version: SchemaVersion }> {
  const schema = await prisma.dataSchema.findUnique({
    where: { id: schemaId },
  });
  if (!schema) {
    throw new Error(`Schema ${schemaId} not found`);
  }

  const newVersion = schema.version + 1;

  // Create version record
  const version = await prisma.schemaVersion.create({
    data: {
      schemaId,
      version: newVersion,
      definition: input.definition as any,
      changelog: input.changelog,
    },
  });

  // Update schema
  const updatedSchema = await prisma.dataSchema.update({
    where: { id: schemaId },
    data: {
      version: newVersion,
      definition: input.definition as any,
    },
  });

  return { schema: updatedSchema, version };
}

/**
 * Validate entity properties against schema
 */
export function validateEntityAgainstSchema(
  properties: Record<string, unknown>,
  schema: DataSchema,
): { valid: boolean; errors: string[] } {
  const definition = schema.definition as unknown as SchemaDefinition;
  const errors: string[] = [];

  // Check required fields
  for (const field of definition.fields) {
    if (field.required && !(field.name in properties)) {
      errors.push(`Required field '${field.name}' is missing`);
    }

    // Type validation (basic)
    if (field.name in properties) {
      const value = properties[field.name];
      const expectedType = field.type.toLowerCase();

      if (expectedType === "string" && typeof value !== "string") {
        errors.push(`Field '${field.name}' must be a string`);
      } else if (expectedType === "number" && typeof value !== "number") {
        errors.push(`Field '${field.name}' must be a number`);
      } else if (expectedType === "boolean" && typeof value !== "boolean") {
        errors.push(`Field '${field.name}' must be a boolean`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * List all schemas for a user
 */
export async function listSchemas(userId: string): Promise<DataSchema[]> {
  return prisma.dataSchema.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
  });
}
