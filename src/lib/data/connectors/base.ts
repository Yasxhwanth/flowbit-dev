/**
 * Data Connectors - Base Infrastructure
 *
 * Provides base classes and interfaces for data connectors
 */

import { ConnectorType } from "@prisma/client";

export interface ConnectorConfig {
  [key: string]: unknown;
}

export interface ConnectorResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  recordsProcessed?: number;
}

export interface ConnectorMetadata {
  name: string;
  type: ConnectorType;
  description?: string;
  capabilities: string[];
}

/**
 * Base connector interface
 */
export abstract class BaseConnector {
  abstract readonly metadata: ConnectorMetadata;
  abstract readonly config: ConnectorConfig;

  /**
   * Test connection
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Ingest data from source
   */
  abstract ingest(options?: Record<string, unknown>): Promise<ConnectorResult>;

  /**
   * Get schema from source
   */
  abstract getSchema(): Promise<ConnectorResult<{ fields: unknown[] }>>;

  /**
   * Validate configuration
   */
  abstract validateConfig(): { valid: boolean; errors: string[] };
}

/**
 * REST API Connector
 */
export class RestApiConnector extends BaseConnector {
  readonly metadata: ConnectorMetadata = {
    name: "REST API",
    type: ConnectorType.REST_API,
    description: "Connect to REST APIs",
    capabilities: ["read", "write"],
  };

  constructor(public readonly config: ConnectorConfig) {
    super();
  }

  async testConnection(): Promise<boolean> {
    try {
      const baseUrl = this.config.baseUrl as string;
      if (!baseUrl) return false;

      const response = await fetch(baseUrl, {
        method: "GET",
        headers: (this.config.headers as Record<string, string>) || {},
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async ingest(options?: Record<string, unknown>): Promise<ConnectorResult> {
    try {
      const baseUrl = this.config.baseUrl as string;
      const endpoint = (options?.endpoint as string) || "";
      const url = `${baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method: (this.config.method as string) || "GET",
        headers: (this.config.headers as Record<string, string>) || {},
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      const records = Array.isArray(data) ? data : [data];

      return {
        success: true,
        data,
        recordsProcessed: records.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getSchema(): Promise<ConnectorResult<{ fields: unknown[] }>> {
    // For REST APIs, we'd need to introspect or use OpenAPI spec
    // This is a simplified version
    return {
      success: true,
      data: {
        fields: [],
      },
    };
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.baseUrl) {
      errors.push("baseUrl is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Database Connector (PostgreSQL)
 */
export class PostgresConnector extends BaseConnector {
  readonly metadata: ConnectorMetadata = {
    name: "PostgreSQL",
    type: ConnectorType.POSTGRES,
    description: "Connect to PostgreSQL databases",
    capabilities: ["read", "write"],
  };

  constructor(public readonly config: ConnectorConfig) {
    super();
  }

  async testConnection(): Promise<boolean> {
    // In a real implementation, this would test the database connection
    return !!this.config.connectionString;
  }

  async ingest(options?: Record<string, unknown>): Promise<ConnectorResult> {
    // In a real implementation, this would query the database
    return {
      success: false,
      error: "Not implemented",
    };
  }

  async getSchema(): Promise<ConnectorResult<{ fields: unknown[] }>> {
    // In a real implementation, this would introspect the database schema
    return {
      success: false,
      error: "Not implemented",
    };
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.connectionString) {
      errors.push("connectionString is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Webhook Connector
 */
export class WebhookConnector extends BaseConnector {
  readonly metadata: ConnectorMetadata = {
    name: "Webhook",
    type: ConnectorType.WEBHOOK,
    description: "Receive data via webhooks",
    capabilities: ["read"],
  };

  constructor(public readonly config: ConnectorConfig) {
    super();
  }

  async testConnection(): Promise<boolean> {
    // Webhooks don't need connection testing
    return true;
  }

  async ingest(options?: Record<string, unknown>): Promise<ConnectorResult> {
    // Webhooks receive data, not ingest
    const payload = (options?.payload as Record<string, unknown>) || {};

    return {
      success: true,
      data: payload,
      recordsProcessed: 1,
    };
  }

  async getSchema(): Promise<ConnectorResult<{ fields: unknown[] }>> {
    return {
      success: true,
      data: {
        fields: [],
      },
    };
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    // Webhooks don't need much config validation
    return {
      valid: true,
      errors: [],
    };
  }
}

/**
 * Connector factory
 */
export function createConnector(
  type: ConnectorType,
  config: ConnectorConfig,
): BaseConnector {
  switch (type) {
    case ConnectorType.REST_API:
      return new RestApiConnector(config);
    case ConnectorType.POSTGRES:
      return new PostgresConnector(config);
    case ConnectorType.WEBHOOK:
      return new WebhookConnector(config);
    default:
      throw new Error(`Unsupported connector type: ${type}`);
  }
}
