import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import prisma from "@/lib/db";
import { MongoClient } from "mongodb";

type MongoDbData = {
    collection?: string;
    operation?: "find" | "insertOne" | "updateOne" | "deleteOne";
    query?: string; // JSON string
    update?: string; // JSON string
};

export const mongodbExecutor: NodeExecutor<MongoDbData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
    credentialId,
}) => {
    if (!credentialId) {
        throw new NonRetriableError("Credential ID required for MongoDB node");
    }

    const credential = await prisma.credential.findUnique({
        where: { id: credentialId },
    });

    if (!credential || credential.type !== "MONGODB") {
        throw new NonRetriableError("Invalid or missing MongoDB credential");
    }

    // Expecting credential.value to be a valid mongodb connection string
    const connectionString = credential.value;

    const collectionName = data.collection ? Handlebars.compile(data.collection)(context) : "";
    const operation = data.operation || "find";
    const rawQuery = data.query ? Handlebars.compile(data.query)(context) : "{}";
    const rawUpdate = data.update ? Handlebars.compile(data.update)(context) : "{}";

    if (!collectionName) {
        throw new NonRetriableError("Collection name is required for MongoDB node");
    }

    let parsedQuery = {};
    let parsedUpdate = {};

    try { parsedQuery = JSON.parse(rawQuery); } catch (e) { throw new NonRetriableError("Query must be valid JSON"); }
    try { parsedUpdate = JSON.parse(rawUpdate); } catch (e) { throw new NonRetriableError("Update payload must be valid JSON"); }

    try {
        const result = await step.run(`mongodb-${operation}-${nodeId}`, async () => {
            const client = new MongoClient(connectionString);
            try {
                await client.connect();
                const db = client.db();
                const collection = db.collection(collectionName);

                switch (operation) {
                    case "find":
                        return await collection.find(parsedQuery).toArray();
                    case "insertOne":
                        return await collection.insertOne(parsedQuery); // In insertOne, 'query' is used as the document
                    case "updateOne":
                        return await collection.updateOne(parsedQuery, parsedUpdate);
                    case "deleteOne":
                        return await collection.deleteOne(parsedQuery);
                    default:
                        throw new Error(`Unsupported MongoDB operation: ${operation}`);
                }
            } finally {
                await client.close();
            }
        });

        return {
            ...context,
            mongodb: result,
        };
    } catch (error) {
        throw error;
    }
};
