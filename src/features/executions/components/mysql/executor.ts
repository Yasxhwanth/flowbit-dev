import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import prisma from "@/lib/db";
import mysql from "mysql2/promise";

type MySqlData = {
    query?: string;
    parameters?: string; // Expecting a JSON string or comma-separated list
};

export const mysqlExecutor: NodeExecutor<MySqlData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
    credentialId,
}) => {
    if (!credentialId) {
        throw new NonRetriableError("Credential ID required for MySQL node");
    }

    const credential = await prisma.credential.findUnique({
        where: { id: credentialId },
    });

    if (!credential || credential.type !== "MYSQL") {
        throw new NonRetriableError("Invalid or missing MySQL credential");
    }

    // Expecting credential.value to be a valid connection string: "mysql://user:pass@host:port/db"
    const connectionString = credential.value;

    const query = data.query ? Handlebars.compile(data.query)(context) : "";
    const paramsRaw = data.parameters ? Handlebars.compile(data.parameters)(context) : "";

    if (!query) {
        throw new NonRetriableError("Query is required for MySQL node");
    }

    let params: any[] = [];
    if (paramsRaw) {
        try {
            params = JSON.parse(paramsRaw);
            if (!Array.isArray(params)) {
                params = [params];
            }
        } catch (e) {
            // If not JSON array, assume comma separated
            params = paramsRaw.split(",").map((p) => p.trim());
        }
    }

    try {
        const result = await step.run(`mysql-query-${nodeId}`, async () => {
            const connection = await mysql.createConnection(connectionString);

            try {
                const [rows, fields] = await connection.execute(query, params);
                return rows;
            } finally {
                await connection.end();
            }
        });

        return {
            ...context,
            mysql: result,
        };
    } catch (error) {
        throw error;
    }
};
