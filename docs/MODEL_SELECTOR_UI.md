# Model Selector UI - Documentation

## Overview

The Model Selector UI allows users to switch between different AI language models directly from the AI Assistant chat interface. This provides flexibility to choose the best model for different tasks.

## Features

### 🎯 Key Capabilities

1. **Visual Model Selection** - Beautiful dropdown with model details
2. **Provider Icons** - Color-coded icons for each provider (Ollama, Groq, OpenAI, etc.)
3. **Model Information** - Shows context window, provider, and description
4. **Default Model** - Automatically selects the default model
5. **Real-time Switching** - Change models mid-conversation
6. **Responsive Design** - Works on desktop and mobile

## Component Structure

### ModelSelector Component

Located at: `/src/components/ai/model-selector.tsx`

**Props:**
```typescript
interface ModelSelectorProps {
  tenantId: string;              // Tenant ID for fetching models
  selectedModelId?: string;      // Currently selected model ID
  onModelChange: (modelId: string) => void;  // Callback when model changes
  compact?: boolean;             // Compact mode for smaller spaces
}
```

**Features:**
- Fetches available models from `/api/ai/models`
- Displays provider icons with color coding
- Shows model details (name, provider, context window)
- Highlights default model with badge
- Refresh button to reload models

### Provider Icons & Colors

Each provider has a unique icon and color scheme:

| Provider | Icon | Color |
|----------|------|-------|
| OLLAMA | Cpu | Blue |
| GROQ | Zap | Purple |
| OPENAI | Brain | Green |
| ANTHROPIC | Sparkles | Orange |
| GOOGLE | Brain | Red |
| AZURE | Brain | Blue |
| AWS_BEDROCK | Brain | Yellow |
| HUGGINGFACE | Brain | Indigo |
| COHERE | Brain | Pink |
| CUSTOM | Cpu | Gray |

## Integration with AI Assistant

### Location

The Model Selector is integrated into the AI Chat Assistant header:

```
┌─────────────────────────────────────┐
│  AI Assistant Header                │
│  ├─ Bot Icon                        │
│  ├─ Status Indicator                │
│  └─ Action Buttons                  │
├─────────────────────────────────────┤
│  Model Selector Dropdown            │ ← New Section
│  └─ Selected Model Display          │
└─────────────────────────────────────┘
```

### State Management

The AI Assistant component manages the selected model:

```typescript
const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined);

// Pass to ModelSelector
<ModelSelector
  tenantId={tenantId}
  selectedModelId={selectedModelId}
  onModelChange={setSelectedModelId}
/>

// Use in API calls
body: JSON.stringify({
  conversationId: currentConversation.id,
  message,
  tenantId,
  modelId: selectedModelId, // ← Sent to backend
})
```

## User Experience

### Model Selection Flow

1. **Open AI Assistant** - Default model is auto-selected
2. **Click Model Selector** - Dropdown shows all available models
3. **View Model Details** - See provider, context window, description
4. **Select Model** - Click to switch models
5. **Continue Chatting** - New messages use selected model

### Visual Feedback

- **Selected Model**: Highlighted with violet background and checkmark
- **Default Model**: Shows "Default" badge
- **Provider**: Color-coded icon and label
- **Context Window**: Displayed in K tokens (e.g., "4K", "32K")
- **Loading State**: Spinner while fetching models

## UI Components

### Dropdown Trigger Button

```tsx
<Button variant="outline">
  <ProviderIcon />
  <div>
    <span>Model Name</span>
    <span>Provider • Context Window</span>
  </div>
  <ChevronDown />
</Button>
```

### Dropdown Menu Items

```tsx
<DropdownMenuItem>
  <ProviderIcon />
  <div>
    <span>Model Name</span>
    <span>Default Badge (if applicable)</span>
    <span>Provider • Context</span>
    <p>Description</p>
  </div>
  <CheckIcon (if selected) />
</DropdownMenuItem>
```

### Footer

```tsx
<div>
  <span>X models available</span>
  <button>Refresh</button>
</div>
```

## Styling

### Design System

- **Primary Color**: Violet (#7c3aed)
- **Hover States**: Violet-50 background
- **Selected State**: Violet-50 background with checkmark
- **Borders**: Gray-200 with violet on hover
- **Icons**: Provider-specific colors
- **Typography**: Font-medium for names, text-xs for details

### Responsive Behavior

- **Desktop**: Full width dropdown with all details
- **Mobile**: Compact mode with essential info
- **Compact Mode**: Smaller icons and text

## API Integration

### Fetching Models

```typescript
GET /api/ai/models?tenantId=xxx&isActive=true

Response:
[
  {
    id: "model_123",
    name: "Qwen 2.5 0.5B (Local)",
    provider: "OLLAMA",
    modelId: "qwen2.5:0.5b",
    description: "Fast local model",
    contextWindow: 4096,
    isDefault: true,
    isActive: true
  }
]
```

### Sending Messages with Selected Model

```typescript
POST /api/ai/chat/complete

Body:
{
  conversationId: "conv_123",
  message: "Hello",
  tenantId: "tenant_123",
  modelId: "model_123",  // ← Selected model
  aiConfig: {...}
}
```

## Usage Examples

### Basic Usage

```tsx
import ModelSelector from '@/components/ai/model-selector';

function MyComponent() {
  const [modelId, setModelId] = useState<string>();
  
  return (
    <ModelSelector
      tenantId="tenant_123"
      selectedModelId={modelId}
      onModelChange={setModelId}
    />
  );
}
```

### Compact Mode

```tsx
<ModelSelector
  tenantId={tenantId}
  selectedModelId={modelId}
  onModelChange={setModelId}
  compact={true}  // Smaller size
/>
```

### With Callback

```tsx
<ModelSelector
  tenantId={tenantId}
  selectedModelId={modelId}
  onModelChange={(newModelId) => {
    setModelId(newModelId);
    console.log('Model changed to:', newModelId);
    // Optionally save to localStorage
    localStorage.setItem('preferredModel', newModelId);
  }}
/>
```

## Accessibility

- **Keyboard Navigation**: Full keyboard support via Radix UI
- **Screen Readers**: Proper ARIA labels
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG AA compliant

## Performance

- **Lazy Loading**: Models fetched only when dropdown opens
- **Caching**: Models cached in component state
- **Refresh**: Manual refresh button to reload models
- **Optimistic Updates**: Immediate UI feedback

## Customization

### Adding New Providers

1. Add provider to `providerIcons` object:
```typescript
const providerIcons: Record<string, any> = {
  MY_PROVIDER: MyIcon,
};
```

2. Add provider color:
```typescript
const providerColors: Record<string, string> = {
  MY_PROVIDER: 'text-blue-600 bg-blue-50',
};
```

3. Update Prisma enum in `schema.prisma`:
```prisma
enum ModelProvider {
  // ... existing providers
  MY_PROVIDER
}
```

### Styling Customization

Override Tailwind classes:

```tsx
<ModelSelector
  tenantId={tenantId}
  selectedModelId={modelId}
  onModelChange={setModelId}
  className="custom-class"  // Add custom styles
/>
```

## Troubleshooting

### Models Not Loading

1. Check API endpoint: `/api/ai/models`
2. Verify tenant ID is correct
3. Ensure models are seeded in database
4. Check browser console for errors

### Model Not Switching

1. Verify `onModelChange` callback is called
2. Check `selectedModelId` state updates
3. Ensure backend receives `modelId` parameter
4. Verify model ID exists in database

### Styling Issues

1. Check Tailwind CSS is properly configured
2. Verify Radix UI components are installed
3. Clear browser cache
4. Check for CSS conflicts

## Best Practices

### 1. Default Model Selection

Always provide a default model:

```typescript
useEffect(() => {
  if (!selectedModelId && models.length > 0) {
    const defaultModel = models.find(m => m.isDefault);
    if (defaultModel) {
      setSelectedModelId(defaultModel.id);
    }
  }
}, [models]);
```

### 2. Persist User Preference

Save user's model choice:

```typescript
const handleModelChange = (modelId: string) => {
  setSelectedModelId(modelId);
  localStorage.setItem(`preferredModel_${tenantId}`, modelId);
};
```

### 3. Error Handling

Handle API errors gracefully:

```typescript
try {
  const response = await fetch('/api/ai/models');
  if (!response.ok) throw new Error('Failed to fetch');
  const data = await response.json();
  setModels(data);
} catch (error) {
  console.error('Error:', error);
  // Show error message to user
}
```

### 4. Loading States

Show loading indicators:

```typescript
{loading ? (
  <div>Loading models...</div>
) : (
  <ModelSelector {...props} />
)}
```

## Future Enhancements

- [ ] Model search/filter
- [ ] Model favorites
- [ ] Model performance indicators
- [ ] Cost per message display
- [ ] Model comparison view
- [ ] Recent models list
- [ ] Model recommendations
- [ ] A/B testing support

## Related Documentation

- **Language Models**: `/docs/LANGUAGE_MODELS.md`
- **API Documentation**: `/docs/LANGUAGE_MODELS.md#api-endpoints`
- **AI Assistant**: `/src/components/ai/ai-chat-assistant.tsx`
- **Model Manager**: `/src/lib/ai/language-model-manager.ts`

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the component code in `/src/components/ai/model-selector.tsx`
3. Test the API endpoints directly
4. Check browser console for errors
