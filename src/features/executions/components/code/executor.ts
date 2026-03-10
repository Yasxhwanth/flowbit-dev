import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import Handlebars from "handlebars";

type CodeData = {
    code?: string;
    variableName?: string;
};

export const codeExecutor: NodeExecutor<CodeData> = async ({
    data,
    nodeId,
    context,
    step,
    publish,
}) => {
    if (!data.code) {
        throw new NonRetriableError("Code snippet is required for CODE node");
    }

    try {
        const result = await step.run(`code-${nodeId}`, async () => {
            // Very basic evaluation for JS snippets.
            // In a real production system, consider a safer sandbox like isolated-vm.
            const compiledCode = Handlebars.compile(data.code!)(context);

            const fn = new Function('$context', `
        try {
          ${compiledCode}
        } catch(e) {
          throw new Error('Code Evaluation Error: ' + e.message);
        }
      `);

            return fn(context) || null;
        });

        if (data.variableName) {
            return {
                ...context,
                [data.variableName]: result,
            };
        }

        return { ...context };
    } catch (error) {
        throw error;
    }
};
