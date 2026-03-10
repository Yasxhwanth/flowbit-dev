import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";
import prisma from "@/lib/db";
import nodemailer from "nodemailer";

type GmailData = {
    to?: string;
    subject?: string;
    body?: string;
};

export const gmailExecutor: NodeExecutor<GmailData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
    credentialId,
}) => {
    if (!credentialId) {
        throw new NonRetriableError("Credential ID required for Gmail node");
    }

    const credential = await prisma.credential.findUnique({
        where: { id: credentialId },
    });

    if (!credential || credential.type !== "GMAIL") {
        throw new NonRetriableError("Invalid or missing Gmail credential");
    }

    // Expecting credential.value to be a JSON string like: { "user": "test@gmail.com", "pass": "apppassword" }
    let auth;
    try {
        auth = JSON.parse(credential.value);
    } catch (e) {
        throw new NonRetriableError("Gmail credential must be a valid JSON with user and pass");
    }

    const to = data.to ? Handlebars.compile(data.to)(context) : "";
    const subject = data.subject ? Handlebars.compile(data.subject)(context) : "";
    const body = data.body ? Handlebars.compile(data.body)(context) : "";

    if (!to || !subject || !body) {
        throw new NonRetriableError("To, subject, and body are required for Gmail node");
    }

    try {
        const result = await step.run(`gmail-send-${nodeId}`, async () => {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: auth.user,
                    pass: auth.pass,
                },
            });

            const info = await transporter.sendMail({
                from: auth.user,
                to,
                subject,
                text: body,
            });

            return info.messageId;
        });

        return {
            ...context,
            gmail: { messageId: result },
        };
    } catch (error) {
        throw error;
    }
};
