import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai"; // npm install openai
import { google } from "googleapis"; // npm install googleapis
import type { ChatCompletionRequestMessage } from "openai/api";
import type { CreateChatCompletionResponseChoicesInner } from "openai/dist/api";

type CreateApiGatewayArgs = {
  project_id: string;
  gateway_id: string;
  region: string;
  openapi_spec_url: string;
};

/**
 * Hypothetical function to create a new API Gateway resource via Google Cloud.
 * This uses the googleapis library to demonstrate usage. You'll need valid
 * credentials (service account or otherwise) and proper environment variables.
 */
async function createApiGateway({
  project_id,
  gateway_id,
  region,
  openapi_spec_url,
}: CreateApiGatewayArgs): Promise<string> {
  try {
    // 1) Initialize the Google API Gateway client
    // (Requires appropriate authentication, omitted for brevity)
    const apiGateway = google.apigateway("v1"); 
    // or: const service = googleapiclient.discovery.build('apigateway', 'v1');

    // 2) Create an API config (simplified for example)
    const apiConfigBody = {
      apiConfigId: `${gateway_id}-config`,
      openapiDocuments: [
        {
          document: {
            path: openapi_spec_url,
          },
        },
      ],
    };

    // Example: create the parent API if needed (the user is effectively
    // also creating an "API" resource to house the config):
    const apiParent = `projects/${project_id}/locations/global`;
    const createApiRes = await apiGateway.projects.locations.apis.create({
      parent: apiParent,
      apiId: gateway_id, // re-using the same name for the "API" object
      requestBody: {
        name: `${apiParent}/apis/${gateway_id}`,
        displayName: `${gateway_id}-display`,
      },
    });

    // Create the API config:
    const configParent = `${apiParent}/apis/${gateway_id}`;
    const configRes = await apiGateway.projects.locations.apis.configs.create({
      parent: configParent,
      apiConfigId: `${gateway_id}-config`,
      requestBody: apiConfigBody,
    });

    // 3) Create the Gateway resource
    const gatewayBody = {
      apiConfig: configRes.data.name, // typically something like "projects/.../configs/orders-gateway-config"
      displayName: `${gateway_id}-display`,
    };

    const gatewayParent = `projects/${project_id}/locations/${region}`;
    const gatewayRes = await apiGateway.projects.locations.gateways.create({
      parent: gatewayParent,
      gatewayId: gateway_id,
      requestBody: gatewayBody,
    });

    // 4) (Optional) Poll the creation operation until done.
    // For brevity, we skip the wait, though you'd typically do it here.

    // Return success details
    return JSON.stringify({
      status: "success",
      api: createApiRes.data.name,
      api_config: configRes.data.name,
      gateway: gatewayRes.data.name,
    });
  } catch (error: any) {
    return JSON.stringify({
      status: "error",
      message: error?.message || String(error),
    });
  }
}

/**
 * Tools definition array for function calling.
 * We'll define just one function "create_api_gateway".
 */
const tools = [
  {
    type: "function",
    function: {
      name: "create_api_gateway",
      description:
        "Creates a new API Gateway in Google Cloud with an API config (OpenAPI spec).",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
            description: "Google Cloud project ID.",
          },
          gateway_id: {
            type: "string",
            description: "Unique identifier for the API Gateway.",
          },
          region: {
            type: "string",
            description: "Google Cloud region to deploy the gateway in.",
          },
          openapi_spec_url: {
            type: "string",
            description:
              "URL or path to the OpenAPI specification file to attach to the gateway.",
          },
        },
        required: ["project_id", "gateway_id", "region", "openapi_spec_url"],
        additionalProperties: false,
      },
      strict: true,
    },
  },
];

/**
 * Next.js App Router POST endpoint. 
 * Expects JSON requests describing user instructions.
 */
export async function POST(request: NextRequest) {
  try {
    // 1) Parse user input
    const { userMessage } = await request.json<{
      userMessage: string;
    }>();

    // 2) Prepare system & user messages
    //    You can add more context or instructions in the system prompt
    const messages: ChatCompletionRequestMessage[] = [
      {
        role: "system",
        content:
          "You are assisting with Google API Gateway migrations. Use create_api_gateway if the user wants to create or migrate an API.",
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    // 3) Call OpenAI with function definition(s)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // ensure your environment variable is set
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4-0613", // or "gpt-4-32k-0613" or any function-calling-capable model
      messages,
      tools,
    });

    // 4) Check if the model decided to call the function
    const toolCalls = completion.choices[0].message.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      // No function calls, just return the model's response
      const textResponse: string = completion.choices[0].message.content ?? "";
      return NextResponse.json({ assistantResponse: textResponse });
    }

    // 5) We have function calls. Let's handle them:
    //    For simplicity, assume only one function call in this example
    const functionCall = toolCalls[0];
    if (functionCall.type === "function") {
      const { name, arguments: rawArgs } = functionCall.function;
      // Parse the JSON arguments
      const args = JSON.parse(rawArgs) as CreateApiGatewayArgs;

      let result = "";
      if (name === "create_api_gateway") {
        result = await createApiGateway(args);
      } else {
        // If you have more tools, you'd handle them here
        result = JSON.stringify({
          status: "error",
          message: `Unknown function: ${name}`,
        });
      }

      // 6) Append the function call and result to the message array
      messages.push({
        role: "assistant",
        content: "", // The model's "function" message is effectively blank text
        tool_calls: [functionCall],
      });
      messages.push({
        role: "tool",
        tool_call_id: functionCall.id,
        content: result,
      });

      // 7) Call the model again to let it incorporate the results:
      const completion2 = await openai.chat.completions.create({
        model: "gpt-4-0613",
        messages,
        tools,
      });

      // Final answer to the user:
      const finalText = completion2.choices[0].message.content ?? "";
      return NextResponse.json({ assistantResponse: finalText });
    }

    // If some other type of call or unexpected structure
    return NextResponse.json({
      assistantResponse:
        "Unexpected tool call structure. Please try again or contact support.",
    });
  } catch (error: any) {
    console.error("Error in assistant route:", error);
    return NextResponse.json(
      {
        error: true,
        message: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}