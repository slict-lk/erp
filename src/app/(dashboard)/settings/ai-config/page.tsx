'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  Zap,
  Cpu,
  Sparkles,
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  description?: string;
  contextWindow: number;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  totalTokens: string;
  totalCost: number;
}

interface AIConfig {
  defaultModelId: string;
  enableFunctionCalling: boolean;
  enableUsageTracking: boolean;
  maxTokensPerRequest: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  // Provider-specific settings
  groqApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaEndpoint?: string;
}

const providerIcons: Record<string, any> = {
  OLLAMA: Cpu,
  GROQ: Zap,
  OPENAI: Brain,
  ANTHROPIC: Sparkles,
};

const providerColors: Record<string, string> = {
  OLLAMA: 'text-blue-600 bg-blue-50 border-blue-200',
  GROQ: 'text-purple-600 bg-purple-50 border-purple-200',
  OPENAI: 'text-green-600 bg-green-50 border-green-200',
  ANTHROPIC: 'text-orange-600 bg-orange-50 border-orange-200',
};

export default function AIConfigPage() {
  const { data: session } = useSession();
  const [models, setModels] = useState<LanguageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<AIConfig>({
    defaultModelId: '',
    enableFunctionCalling: true,
    enableUsageTracking: true,
    maxTokensPerRequest: 4096,
    temperature: 0.7,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    ollamaEndpoint: 'http://localhost:11434',
  });

  const tenantId = (session?.user as any)?.tenantId || 'cmivuqa8z0000epwfkvvn28mi';

  useEffect(() => {
    if (session) {
      fetchModels();
      loadConfig();
    }
  }, [session]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/models?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched models:', data);
        setModels(data);
        
        // Set default model if not already set
        if (!config.defaultModelId) {
          const defaultModel = data.find((m: LanguageModel) => m.isDefault);
          if (defaultModel) {
            setConfig((prev) => ({ ...prev, defaultModelId: defaultModel.id }));
          }
        }
      } else {
        console.error('Failed to fetch models:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = () => {
    const savedConfig = localStorage.getItem('aiConfig');
    if (savedConfig) {
      setConfig((prev) => ({ ...prev, ...JSON.parse(savedConfig) }));
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('aiConfig', JSON.stringify(config));
      
      // Update default model in database if changed
      if (config.defaultModelId) {
        await fetch('/api/ai/models', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: config.defaultModelId,
            isDefault: true,
            tenantId,
          }),
        });
      }

      // Update API keys for all models of each provider
      const apiKeyUpdates = [];

      if (config.groqApiKey) {
        // Update all Groq models with the API key
        const groqModels = models.filter(m => m.provider === 'GROQ');
        for (const model of groqModels) {
          apiKeyUpdates.push(
            fetch('/api/ai/models', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: model.id,
                apiKey: config.groqApiKey,
                tenantId,
              }),
            })
          );
        }
      }

      if (config.openaiApiKey) {
        // Update all OpenAI models with the API key
        const openaiModels = models.filter(m => m.provider === 'OPENAI');
        for (const model of openaiModels) {
          apiKeyUpdates.push(
            fetch('/api/ai/models', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: model.id,
                apiKey: config.openaiApiKey,
                tenantId,
              }),
            })
          );
        }
      }

      if (config.anthropicApiKey) {
        // Update all Anthropic models with the API key
        const anthropicModels = models.filter(m => m.provider === 'ANTHROPIC');
        for (const model of anthropicModels) {
          apiKeyUpdates.push(
            fetch('/api/ai/models', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: model.id,
                apiKey: config.anthropicApiKey,
                tenantId,
              }),
            })
          );
        }
      }

      // Wait for all API key updates to complete
      if (apiKeyUpdates.length > 0) {
        await Promise.all(apiKeyUpdates);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      // Refresh models to show updated API keys
      await fetchModels();
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      defaultModelId: models.find((m) => m.isDefault)?.id || '',
      enableFunctionCalling: true,
      enableUsageTracking: true,
      maxTokensPerRequest: 4096,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      ollamaEndpoint: 'http://localhost:11434',
    });
  };

  const selectedModel = models.find((m) => m.id === config.defaultModelId);
  const ProviderIcon = selectedModel ? providerIcons[selectedModel.provider] || Brain : Brain;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-violet-600" />
              AI Configuration
            </h1>
            <p className="text-gray-600 mt-1">
              Configure AI models, parameters, and API settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveConfig} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Language Model</CardTitle>
              <CardDescription>
                Select the default AI model for your assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-violet-600" />
                  <span className="ml-2 text-gray-600">Loading models...</span>
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <AlertCircle className="h-12 w-12 text-orange-500 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-lg">No Models Found</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      No language models are configured yet. Run the seed script to create default models.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <p className="text-sm font-medium mb-2">To seed models, run:</p>
                    <code className="text-xs bg-gray-800 text-green-400 px-3 py-2 rounded block">
                      npx tsx prisma/seed-language-models.ts
                    </code>
                  </div>
                  <Button onClick={fetchModels} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Models
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Selected Model</Label>
                  <Select
                    value={config.defaultModelId}
                    onValueChange={(value) =>
                      setConfig({ ...config, defaultModelId: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => {
                        const Icon = providerIcons[model.provider] || Brain;
                        return (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{model.name}</span>
                              {model.isDefault && (
                                <Badge variant="secondary" className="ml-2">
                                  Default
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedModel && (
                <Card className={cn('border-2', providerColors[selectedModel.provider])}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'h-12 w-12 rounded-lg flex items-center justify-center',
                          providerColors[selectedModel.provider]
                        )}
                      >
                        <ProviderIcon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{selectedModel.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedModel.description || 'No description available'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-gray-500">Provider</p>
                            <p className="font-medium">{selectedModel.provider}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Context Window</p>
                            <p className="font-medium">
                              {(selectedModel.contextWindow / 1000).toFixed(0)}K tokens
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Usage Count</p>
                            <p className="font-medium">{selectedModel.usageCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Cost</p>
                            <p className="font-medium">
                              ${selectedModel.totalCost.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Available Models</CardTitle>
              <CardDescription>
                Manage and configure your AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {models.map((model) => {
                  const Icon = providerIcons[model.provider] || Brain;
                  const isSelected = model.id === config.defaultModelId;
                  
                  return (
                    <div
                      key={model.id}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md',
                        isSelected
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => setConfig({ ...config, defaultModelId: model.id })}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-lg flex items-center justify-center',
                            providerColors[model.provider]
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{model.name}</h4>
                            {model.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                            {!model.isActive && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <span>{model.provider}</span>
                            <span>•</span>
                            <span>{(model.contextWindow / 1000).toFixed(0)}K context</span>
                            <span>•</span>
                            <span>{model.usageCount} uses</span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-violet-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parameters Tab */}
        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Parameters</CardTitle>
              <CardDescription>
                Fine-tune AI model behavior and response characteristics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Temperature ({config.temperature})</Label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) =>
                    setConfig({ ...config, temperature: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Controls randomness. Lower = more focused, Higher = more creative
                </p>
              </div>

              <div className="space-y-2">
                <Label>Top P ({config.topP})</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.topP}
                  onChange={(e) =>
                    setConfig({ ...config, topP: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Nucleus sampling. Controls diversity of responses
                </p>
              </div>

              <div className="space-y-2">
                <Label>Frequency Penalty ({config.frequencyPenalty})</Label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.frequencyPenalty}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      frequencyPenalty: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Reduces repetition of frequent tokens
                </p>
              </div>

              <div className="space-y-2">
                <Label>Presence Penalty ({config.presencePenalty})</Label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.presencePenalty}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      presencePenalty: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Encourages talking about new topics
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Tokens Per Request</Label>
                <Input
                  type="number"
                  value={config.maxTokensPerRequest}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxTokensPerRequest: parseInt(e.target.value),
                    })
                  }
                  min="100"
                  max="32000"
                />
                <p className="text-xs text-gray-500">
                  Maximum tokens to generate per response
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>
                Enable or disable AI features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Function Calling</Label>
                  <p className="text-sm text-gray-500">
                    Allow AI to call functions and execute actions
                  </p>
                </div>
                <Switch
                  checked={config.enableFunctionCalling}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableFunctionCalling: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Usage Tracking</Label>
                  <p className="text-sm text-gray-500">
                    Track token usage and costs for analytics
                  </p>
                </div>
                <Switch
                  checked={config.enableUsageTracking}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enableUsageTracking: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ollama Configuration</CardTitle>
              <CardDescription>
                Configure local Ollama instance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ollama Endpoint</Label>
                <Input
                  type="url"
                  value={config.ollamaEndpoint}
                  onChange={(e) =>
                    setConfig({ ...config, ollamaEndpoint: e.target.value })
                  }
                  placeholder="http://localhost:11434"
                />
                <p className="text-xs text-gray-500">
                  URL of your local Ollama server
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Groq API</CardTitle>
              <CardDescription>
                Configure Groq cloud API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={config.groqApiKey || ''}
                  onChange={(e) =>
                    setConfig({ ...config, groqApiKey: e.target.value })
                  }
                  placeholder="gsk_..."
                />
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a
                    href="https://console.groq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:underline"
                  >
                    console.groq.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OpenAI API</CardTitle>
              <CardDescription>
                Configure OpenAI API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={config.openaiApiKey || ''}
                  onChange={(e) =>
                    setConfig({ ...config, openaiApiKey: e.target.value })
                  }
                  placeholder="sk-..."
                />
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:underline"
                  >
                    platform.openai.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anthropic API</CardTitle>
              <CardDescription>
                Configure Anthropic (Claude) API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={config.anthropicApiKey || ''}
                  onChange={(e) =>
                    setConfig({ ...config, anthropicApiKey: e.target.value })
                  }
                  placeholder="sk-ant-..."
                />
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:underline"
                  >
                    console.anthropic.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Brain className="h-8 w-8 text-violet-600" />
                  <span className="text-3xl font-bold">{models.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Activity className="h-8 w-8 text-blue-600" />
                  <span className="text-3xl font-bold">
                    {models.reduce((sum, m) => sum + m.usageCount, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <span className="text-3xl font-bold">
                    {(
                      models.reduce(
                        (sum, m) => sum + parseInt(m.totalTokens || '0'),
                        0
                      ) / 1000
                    ).toFixed(0)}
                    K
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <span className="text-3xl font-bold">
                    ${models.reduce((sum, m) => sum + m.totalCost, 0).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Model Usage Breakdown</CardTitle>
              <CardDescription>
                Usage statistics for each model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => {
                  const Icon = providerIcons[model.provider] || Brain;
                  const usagePercent =
                    (model.usageCount /
                      Math.max(
                        models.reduce((sum, m) => sum + m.usageCount, 0),
                        1
                      )) *
                    100;

                  return (
                    <div key={model.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{model.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{model.usageCount} uses</span>
                          <span>${model.totalCost.toFixed(4)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-violet-600 h-2 rounded-full transition-all"
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
