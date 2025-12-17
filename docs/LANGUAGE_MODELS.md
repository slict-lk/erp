# Language Model Integration

This document describes the language model management system integrated with the AI Assistant.

## Overview

The ERP system now includes a comprehensive language model management system that allows you to:

- Configure multiple AI models from different providers (OpenAI, Groq, Ollama, etc.)
- Track model usage and costs
- Create and manage prompt templates
- Fine-tune models for specific use cases
- Evaluate model performance

## Database Schema

### Core Models

#### LanguageModel
Stores configuration for AI language models.

**Key Fields:**
- `provider`: Model provider (OPENAI, GROQ, OLLAMA, etc.)
- `modelId`: Provider-specific model identifier (e.g., "gpt-4", "llama-3.1-70b-versatile")
- `capabilities`: Array of supported features (chat, completion, function_calling)
- `contextWindow`: Maximum context length in tokens
- `temperature`, `topP`, etc.: Model parameters
- `isDefault`: Whether this is the default model for the tenant
- `usageCount`, `totalTokens`, `totalCost`: Usage statistics

#### ConversationModel
Tracks which models are used in conversations.

#### PromptTemplate
Reusable prompt templates with variable substitution.

**Categories:**
- GENERAL
- SALES
- CUSTOMER_SERVICE
- ANALYTICS
- REPORTING
- CODE_GENERATION
- DATA_EXTRACTION
- SUMMARIZATION
- TRANSLATION
- CLASSIFICATION
- SENTIMENT_ANALYSIS
- CUSTOM

#### ModelUsage
Detailed usage tracking for billing and analytics.

#### FineTuningJob
Manage fine-tuning jobs for custom models.

#### ModelEvaluation
Store model evaluation results and benchmarks.

## API Endpoints

### Language Models

#### GET /api/ai/models
Get all language models for a tenant.

**Query Parameters:**
- `tenantId` (required)
- `provider` (optional)
- `isActive` (optional)

**Response:**
```json
[
  {
    "id": "model_123",
    "name": "Qwen 2.5 0.5B (Local)",
    "provider": "OLLAMA",
    "modelId": "qwen2.5:0.5b",
    "description": "Fast and efficient local model",
    "capabilities": ["chat", "completion"],
    "contextWindow": 4096,
    "temperature": 0.7,
    "isDefault": true,
    "isActive": true,
    "usageCount": 150,
    "totalTokens": "45000",
    "totalCost": 0.0
  }
]
```

#### POST /api/ai/models
Create a new language model.

**Request Body:**
```json
{
  "tenantId": "tenant_123",
  "name": "GPT-4 Turbo",
  "provider": "OPENAI",
  "modelId": "gpt-4-turbo-preview",
  "description": "Latest GPT-4 model",
  "capabilities": ["chat", "completion", "function_calling"],
  "contextWindow": 128000,
  "maxTokens": 4096,
  "temperature": 0.7,
  "apiKey": "sk-...",
  "isDefault": false
}
```

#### PATCH /api/ai/models
Update a language model.

#### DELETE /api/ai/models
Delete a language model.

### Model Usage

#### GET /api/ai/models/usage
Get model usage statistics.

**Query Parameters:**
- `tenantId` (required)
- `modelId` (optional)
- `startDate` (optional)
- `endDate` (optional)

**Response:**
```json
{
  "usage": [
    {
      "id": "usage_123",
      "modelId": "model_123",
      "operation": "chat",
      "promptTokens": 150,
      "completionTokens": 300,
      "totalTokens": 450,
      "cost": 0.0045,
      "latencyMs": 1200,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "stats": [
    {
      "modelId": "model_123",
      "_sum": {
        "totalTokens": 45000,
        "cost": 4.5
      },
      "_avg": {
        "latencyMs": 1150
      },
      "_count": {
        "id": 100
      }
    }
  ]
}
```

#### POST /api/ai/models/usage
Record model usage (automatically called by the system).

### Prompt Templates

#### GET /api/ai/prompts
Get all prompt templates.

#### POST /api/ai/prompts
Create a new prompt template.

**Request Body:**
```json
{
  "tenantId": "tenant_123",
  "name": "Sales Summary",
  "description": "Generate sales summary",
  "category": "SALES",
  "template": "Generate a sales summary for {{period}}. Data: {{data}}",
  "variables": ["period", "data"],
  "modelId": "model_123"
}
```

#### PATCH /api/ai/prompts
Update a prompt template.

#### DELETE /api/ai/prompts
Delete a prompt template.

## Usage in Code

### Get Default Model

```typescript
import { getDefaultModel } from '@/lib/ai/language-model-manager';

const model = await getDefaultModel(tenantId);
console.log(model.name, model.provider, model.modelId);
```

### Record Usage

```typescript
import { recordModelUsage, calculateCost } from '@/lib/ai/language-model-manager';

const metrics = {
  promptTokens: 150,
  completionTokens: 300,
  totalTokens: 450,
  cost: calculateCost('OPENAI', 'gpt-4', 150, 300),
  latencyMs: 1200,
};

await recordModelUsage(tenantId, modelId, metrics, {
  conversationId: 'conv_123',
  userId: 'user_123',
  operation: 'chat',
  success: true,
});
```

### Use Prompt Template

```typescript
import { 
  getPromptTemplate, 
  renderPromptTemplate 
} from '@/lib/ai/language-model-manager';

const template = await getPromptTemplate(tenantId, 'Sales Summary');
if (template) {
  const prompt = renderPromptTemplate(template.template, {
    period: 'this month',
    data: JSON.stringify(salesData),
  });
  // Use prompt with AI model
}
```

## Integration with AI Assistant

The AI Assistant automatically:

1. **Selects the appropriate model** based on tenant configuration
2. **Tracks usage** for every conversation
3. **Records costs** for billing purposes
4. **Links conversations to models** for analytics

### Configuration

Models can be configured via:

1. **Database seeding** (see `prisma/seed-language-models.ts`)
2. **Admin UI** (coming soon)
3. **API calls** (see endpoints above)

### Default Models

The system includes these pre-configured models:

1. **Qwen 2.5 0.5B (Local)** - Default, fast local model via Ollama
2. **Llama 3.1 70B (Groq)** - Powerful cloud model with function calling
3. **Mixtral 8x7B (Groq)** - Large context window for complex tasks

### Prompt Templates

Pre-configured templates:

1. **Sales Summary** - Generate comprehensive sales reports
2. **Customer Service Response** - Professional customer support
3. **Data Analysis** - Analyze business data
4. **Report Generation** - Create formatted reports
5. **Email Draft** - Draft professional emails

## Cost Tracking

The system automatically tracks:

- **Token usage** (prompt + completion)
- **Estimated costs** based on provider pricing
- **Latency** for performance monitoring
- **Success rate** for reliability metrics

### Cost Calculation

Costs are calculated based on provider pricing:

```typescript
// Example: GPT-4
// $30 per 1M prompt tokens
// $60 per 1M completion tokens
const cost = calculateCost('OPENAI', 'gpt-4', promptTokens, completionTokens);
```

## Best Practices

### 1. Model Selection

- Use **local models** (Ollama) for development and testing
- Use **cloud models** (Groq, OpenAI) for production
- Set a **default model** for each tenant
- Enable multiple models for A/B testing

### 2. Prompt Engineering

- Create **reusable templates** for common tasks
- Use **variables** for dynamic content
- Test prompts with different models
- Version your prompts

### 3. Cost Management

- Monitor usage via `/api/ai/models/usage`
- Set up alerts for high usage
- Use cheaper models for simple tasks
- Cache responses when possible

### 4. Performance

- Track latency metrics
- Use streaming for better UX
- Implement fallback models
- Cache model configurations

## Seeding Data

To seed default models and prompts:

```bash
npx tsx prisma/seed-language-models.ts
```

This creates:
- 3 default language models
- 5 prompt templates
- All linked to your first tenant

## Future Enhancements

- [ ] Admin UI for model management
- [ ] Real-time usage dashboards
- [ ] Automatic model selection based on task
- [ ] Model performance comparison
- [ ] Fine-tuning workflow
- [ ] Custom model deployment
- [ ] Rate limiting per model
- [ ] Budget alerts
- [ ] Model versioning
- [ ] A/B testing framework

## Troubleshooting

### Models not appearing

1. Check Prisma client is generated: `npx prisma generate`
2. Verify database migration: `npx prisma db push`
3. Run seed script: `npx tsx prisma/seed-language-models.ts`

### Usage not tracked

1. Ensure `recordModelUsage` is called after AI responses
2. Check model ID is valid
3. Verify tenant ID matches

### Cost calculation incorrect

1. Update pricing in `calculateCost` function
2. Check provider and model ID match
3. Verify token counts are accurate

## Support

For issues or questions:
1. Check the API documentation
2. Review the code in `/src/lib/ai/language-model-manager.ts`
3. Examine the database schema in `/prisma/schema.prisma`
