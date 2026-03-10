import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import prisma from "@/lib/db";

type WhatsAppData = {
    phoneNumberId?: string;
    recipient?: string;
    message?: string;
};

export const whatsappExecutor: NodeExecutor<WhatsAppData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
    credentialId,
}) => {
    if (!credentialId) {
        throw new NonRetriableError("Credential ID required for WhatsApp node");
    }

    const credential = await prisma.credential.findUnique({
        where: { id: credentialId },
    });

    if (!credential || credential.type !== "WHATSAPP") {
        throw new NonRetriableError("Invalid or missing WhatsApp credential");
    }

    // Expecting credential.value to hold the WhatsApp Cloud API Token
    const token = credential.value;

    const recipient = data.recipient ? Handlebars.compile(data.recipient)(context) : "";
    const message = data.message ? Handlebars.compile(data.message)(context) : "";
    const phoneId = data.phoneNumberId ? Handlebars.compile(data.phoneNumberId)(context) : "";

    if (!recipient || !message || !phoneId) {
        throw new NonRetriableError("Recipient, message, and Phone Number ID are required.");
    }

    try {
        const response = await step.run(`whatsapp-send-${nodeId}`, async () => {
            const res = await fetch(
                `https://graph.facebook.com/v17.0/${phoneId}/messages`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        to: recipient,
                        type: "text",
                        text: {
                            body: message,
                        },
                    }),
                }
            );

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(`WhatsApp API Error: ${errData.error?.message || res.statusText}`);
            }
            return await res.json();
        });

        return {
            ...context,
            whatsapp: response,
        };
    } catch (error) {
        throw error;
    }
};
