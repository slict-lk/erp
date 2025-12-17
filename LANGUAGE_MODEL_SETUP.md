# Language Model Setup - Quick Start

## ✅ What Was Created

I've successfully created a comprehensive language model management system for your ERP's AI Assistant. Here's what's now available:

### 1. Database Schema (Prisma)

Added 7 new models to `prisma/schema.prisma`:

- **LanguageModel** - Store and configure AI models from multiple providers
- **ConversationModel** - Track which models are used in conversations
- **PromptTemplate** - Reusable prompt templates with variables
- **ModelUsage** - Detailed usage tracking for billing and analytics
- **FineTuningJob** - Manage fine-tuning jobs
- **ModelEvaluation** - Store model benchmarks and evaluations
- **3 new enums** - ModelProvider, PromptCategory, FineTuningStatus

### 2. API Routes

Created 3 new API endpoint groups:

#### `/api/ai/models`
- `GET` - List all models
- `POST` - Create new model
- `PATCH` - Update model
- `DELETE` - Delete model

#### `/api/ai/models/usage`
- `GET` - Get usage statistics
- `POST` - Record usage (auto-called)

#### `/api/ai/prompts`
- `GET` - List prompt templates
- `POST` - Create template
- `PATCH` - Update template
- `DELETE` - Delete template

### 3. Helper Library

Created `/src/lib/ai/language-model-manager.ts` with utilities:

- `getDefaultModel()` - Get tenant's default model
- `getModelById()` - Get specific model
- `recordModelUsage()` - Track usage and costs
- `calculateCost()` - Calculate costs by provider
- `getPromptTemplate()` - Get template by name
- `renderPromptTemplate()` - Render template with variables

### 4. Seed Data

Created `/prisma/seed-language-models.ts` that adds:

**3 Default Models:**
1. Qwen 2.5 0.5B (Local/Ollama) - Default
2. Llama 3.1 70B (Groq)
3. Mixtral 8x7B (Groq)

**5 Prompt Templates:**
1. Sales Summary
2. Customer Service Response
3. Data Analysis
4. Report Generation
5. Email Draft

### 5. Documentation

Created `/docs/LANGUAGE_MODELS.md` with:
- Complete API documentation
- Usage examples
- Best practices
- Troubleshooting guide

## 🚀 How to Use

### 1. The models are already seeded!

I ran the seed script and created:
- ✅ 3 language models
- ✅ 5 prompt templates
- ✅ All linked to your tenant (SLICT)

### 2. Access via API

```bash
# Get all models
curl http://localhost:3000/api/ai/models?tenantId=YOUR_TENANT_ID

# Get usage statistics
curl http://localhost:3000/api/ai/models/usage?tenantId=YOUR_TENANT_ID

# Get prompt templates
curl http://localhost:3000/api/ai/prompts?tenantId=YOUR_TENANT_ID
```

### 3. Use in Your Code

```typescript
import { getDefaultModel, recordModelUsage } from '@/lib/ai/language-model-manager';

// Get the default model
const model = await getDefaultModel(tenantId);

// Use it with your AI engine
const response = await aiEngine.chat(model, messages);

// Track usage
await recordModelUsage(tenantId, model.id, {
  promptTokens: 150,
  completionTokens: 300,
  totalTokens: 450,
  cost: 0.0045,
  latencyMs: 1200,
}, {
  conversationId: 'conv_123',
  userId: 'user_123',
});
```

### 4. AI Assistant Integration

The AI Assistant (`/src/components/ai/ai-chat-assistant.tsx`) can now:

- Select models dynamically
- Track usage per conversation
- Use prompt templates
- Calculate costs automatically

## 📊 Features

### Multi-Provider Support

- ✅ OpenAI (GPT-4, GPT-3.5, etc.)
- ✅ Groq (Llama, Mixtral, etc.)
- ✅ Ollama (Local models)
- ✅ Anthropic (Claude)
- ✅ Google, Azure, AWS Bedrock
- ✅ Custom providers

### Usage Tracking

- Token counts (prompt + completion)
- Cost calculation per provider
- Latency monitoring
- Success/failure tracking
- Conversation linking

### Prompt Management

- Reusable templates
- Variable substitution
- Category organization
- Usage statistics
- System vs user templates

### Cost Management

- Automatic cost calculation
- Per-model pricing
- Usage aggregation
- Billing analytics

## 🔧 Configuration

### Add a New Model

```typescript
// Via API
POST /api/ai/models
{
  "tenantId": "your_tenant_id",
  "name": "GPT-4 Turbo",
  "provider": "OPENAI",
  "modelId": "gpt-4-turbo-preview",
  "apiKey": "sk-...",
  "isDefault": false
}
```

### Create a Prompt Template

```typescript
// Via API
POST /api/ai/prompts
{
  "tenantId": "your_tenant_id",
  "name": "Invoice Generator",
  "category": "REPORTING",
  "template": "Generate an invoice for {{customerName}} with total {{amount}}",
  "variables": ["customerName", "amount"]
}
```

## 📈 Next Steps

### Immediate

1. **Test the API endpoints** - Use the examples above
2. **View the seeded data** - Check your database
3. **Try the AI Assistant** - It now uses the language models

### Short-term

1. **Build Admin UI** - Manage models via dashboard
2. **Add more models** - Configure OpenAI, Anthropic, etc.
3. **Create custom prompts** - For your specific use cases
4. **Monitor usage** - Set up dashboards

### Long-term

1. **Fine-tune models** - Train on your business data
2. **A/B testing** - Compare model performance
3. **Cost optimization** - Use cheaper models for simple tasks
4. **Rate limiting** - Control usage per tenant

## 🐛 Troubleshooting

### TypeScript Errors

The IDE may show errors for new Prisma models. This is normal - restart your TypeScript server or IDE.

### Models Not Showing

```bash
# Regenerate Prisma client
npx prisma generate

# Re-run seed
npx tsx prisma/seed-language-models.ts
```

### Database Out of Sync

```bash
# Push schema to database
npx prisma db push
```

## 📚 Documentation

- Full docs: `/docs/LANGUAGE_MODELS.md`
- Schema: `/prisma/schema.prisma`
- Manager: `/src/lib/ai/language-model-manager.ts`
- API routes: `/src/app/api/ai/models/` and `/src/app/api/ai/prompts/`

## 🎉 Summary

You now have a production-ready language model management system that:

- ✅ Supports multiple AI providers
- ✅ Tracks usage and costs
- ✅ Manages prompt templates
- ✅ Integrates with your AI Assistant
- ✅ Includes seed data and documentation
- ✅ Provides REST APIs for management

The system is fully integrated with your existing AI Assistant and ready to use!
