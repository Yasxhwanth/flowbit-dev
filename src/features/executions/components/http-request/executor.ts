import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";
import Handlebars from "handlebars";
import { httpRequestChannel } from "@/inngest/channels/http-request";

type HttpRequestData = {
  variableName?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: string;
};

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  return new Handlebars.SafeString(jsonString);
});

export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    httpRequestChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.endpoint) {await publish(
    httpRequestChannel().status({
      nodeId,
      status: "error",
    })
  );

    throw new NonRetriableError("Endpoint is required");
  }

  if (!data.variableName) {
    await publish(
      httpRequestChannel().status({
        nodeId,
        status: "loading",
      })
    );
    throw new NonRetriableError("Variable name is not configured");
  }

  if (!data.method) {
    await publish(
      httpRequestChannel().status({
        nodeId,
        status: "loading",
      })
    );
    throw new NonRetriableError("Method is not configured");
  }
  try{
  const result = await step.run("http-request", async () => {
    const method = data.method || "GET";
    const endpoint = Handlebars.compile(data.endpoint!)(context);

    const options: KyOptions = { method };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      const resolved = Handlebars.compile(data.body || "{}")(context);
      JSON.parse(resolved);
      options.body = resolved;
      options.headers = { "Content-Type": "application/json" };
    }

    const response = await ky(endpoint, options);
    const contentType = response.headers.get("content-type");
    const responseData = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    return {
      ...context,
      [data.variableName!]: {
        httpResponse: {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        },
      },
    };
  });

  await publish(
    httpRequestChannel().status({
      nodeId,
      status: "success",
    })
  );

  return { result };
}catch(error){
  await publish(
    httpRequestChannel().status({
      nodeId,
      status: "error",
    }),
  );
  throw error;
}
};
