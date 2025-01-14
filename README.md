# DEMO: OpenAI Function Calling with Google API Gateway

A Next.js App Router implementation demonstrating OpenAI's function calling feature to create an AI assistant that helps users manage Google API Gateway resources through natural language.

## Overview

This project showcases how to:
- Use OpenAI's function calling in a TypeScript environment
- Build a Next.js API endpoint for AI-powered API management
- Integrate with Google Cloud API Gateway
- Handle conversational API infrastructure management

## Project Structure

```
my-next-app/
├─ app/
│  └─ api/
│      └─ assistant/
│          └─ route.ts   # Main API endpoint
├─ package.json
├─ tsconfig.json
└─ ...
```

## Implementation Details

### Function Schema

The project defines a TypeScript interface for Google API Gateway management:

```typescript
type CreateApiGatewayArgs = {
  project_id: string;
  gateway_id: string;
  region: string;
  openapi_spec_url: string;
};

const tools = [{
  type: "function",
  function: {
    name: "create_api_gateway",
    description: "Creates a new API Gateway in Google Cloud with an API config (OpenAPI spec).",
    parameters: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "Google Cloud project ID."
        },
        gateway_id: {
          type: "string",
          description: "Unique identifier for the API Gateway."
        },
        region: {
          type: "string",
          description: "Google Cloud region to deploy the gateway in."
        },
        openapi_spec_url: {
          type: "string",
          description: "URL or path to the OpenAPI specification file."
        }
      },
      required: ["project_id", "gateway_id", "region", "openapi_spec_url"],
      additionalProperties: false
    },
    strict: true
  }
}];
```

### API Flow

1. **Request Handling**
   ```typescript
   // POST to /api/assistant
   {
     "userMessage": "Please create a new API gateway named 'orders-gateway' in project 'my-cool-project'"
   }
   ```

2. **OpenAI Integration**
   - System prompt setup
   - Function definitions
   - Model completion request
   - Function call parsing

3. **Google Cloud Integration**
   - API Gateway creation
   - Configuration management
   - Resource deployment
   - Status monitoring

4. **Response Processing**
   - Result parsing
   - Natural language response generation
   - Error handling

## Prerequisites

- Node.js and npm/yarn
- Next.js 13+
- OpenAI API key
- Google Cloud project with API Gateway enabled
- Google Cloud service account credentials

## Setup

1. Install dependencies:
```bash
npm install openai googleapis
```

2. Configure environment variables:
```bash
OPENAI_API_KEY=your_api_key
GOOGLE_APPLICATION_CREDENTIALS=path_to_credentials.json
```

3. Run the development server:
```bash
npm run dev
```

## Usage

Send a POST request to `/api/assistant`:

```bash
curl -X POST http://localhost:3000/api/assistant \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Create an API gateway named orders-gateway in us-central1"}'
```

## Key Features

- **TypeScript Integration**
  - Strong typing for API requests and responses
  - Type-safe function calling implementation
  - Proper error handling with TypeScript

- **OpenAI Function Calling**
  - Natural language processing
  - Structured function execution
  - Response generation

- **Google Cloud Integration**
  - API Gateway management
  - Resource provisioning
  - Configuration handling

## Error Handling

The implementation includes comprehensive error handling for:
- Invalid requests
- OpenAI API issues
- Google Cloud API errors
- Resource creation failures
- Authentication problems

## Dependencies

```json
{
  "dependencies": {
    "next": "^13.0.0",
    "openai": "^4.0.0",
    "googleapis": "^120.0.0"
  }
}
```

## Resources

- [OpenAI Function Calling Documentation](https://platform.openai.com/docs/guides/function-calling)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Google API Gateway Documentation](https://cloud.google.com/api-gateway)
- [googleapis NPM Package](https://www.npmjs.com/package/googleapis)

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on the process for submitting pull requests.
