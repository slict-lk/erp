'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronDown, Sparkles, Zap, Brain, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
}

interface ModelSelectorProps {
  tenantId: string;
  selectedModelId?: string;
  onModelChange: (modelId: string) => void;
  compact?: boolean;
}

const providerIcons: Record<string, any> = {
  OLLAMA: Cpu,
  GROQ: Zap,
  OPENAI: Brain,
  ANTHROPIC: Sparkles,
  GOOGLE: Brain,
  AZURE: Brain,
  AWS_BEDROCK: Brain,
  HUGGINGFACE: Brain,
  COHERE: Brain,
  CUSTOM: Cpu,
};

const providerColors: Record<string, string> = {
  OLLAMA: 'text-blue-600 bg-blue-50',
  GROQ: 'text-purple-600 bg-purple-50',
  OPENAI: 'text-green-600 bg-green-50',
  ANTHROPIC: 'text-orange-600 bg-orange-50',
  GOOGLE: 'text-red-600 bg-red-50',
  AZURE: 'text-blue-600 bg-blue-50',
  AWS_BEDROCK: 'text-yellow-600 bg-yellow-50',
  HUGGINGFACE: 'text-indigo-600 bg-indigo-50',
  COHERE: 'text-pink-600 bg-pink-50',
  CUSTOM: 'text-gray-600 bg-gray-50',
};

export default function ModelSelector({
  tenantId,
  selectedModelId,
  onModelChange,
  compact = false,
}: ModelSelectorProps) {
  const [models, setModels] = useState<LanguageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<LanguageModel | null>(null);

  useEffect(() => {
    fetchModels();
  }, [tenantId]);

  useEffect(() => {
    if (selectedModelId && models.length > 0) {
      const model = models.find((m) => m.id === selectedModelId);
      setSelectedModel(model || null);
    } else if (models.length > 0 && !selectedModel) {
      // Auto-select default model
      const defaultModel = models.find((m) => m.isDefault);
      if (defaultModel) {
        setSelectedModel(defaultModel);
        onModelChange(defaultModel.id);
      }
    }
  }, [selectedModelId, models]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/models?tenantId=${tenantId}&isActive=true`);
      if (response.ok) {
        const data = await response.json();
        setModels(data);
        
        // Set default model if none selected
        if (!selectedModelId) {
          const defaultModel = data.find((m: LanguageModel) => m.isDefault);
          if (defaultModel) {
            setSelectedModel(defaultModel);
            onModelChange(defaultModel.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (model: LanguageModel) => {
    setSelectedModel(model);
    onModelChange(model.id);
  };

  const getProviderIcon = (provider: string) => {
    const Icon = providerIcons[provider] || Cpu;
    return Icon;
  };

  const getProviderColor = (provider: string) => {
    return providerColors[provider] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-violet-600" />
        <span>Loading models...</span>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        No models available
      </div>
    );
  }

  const ProviderIcon = selectedModel ? getProviderIcon(selectedModel.provider) : Cpu;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-between font-normal hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-all',
            compact ? 'h-8 text-xs' : 'h-10'
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn(
              'flex items-center justify-center rounded-md flex-shrink-0',
              compact ? 'h-5 w-5' : 'h-6 w-6',
              selectedModel ? getProviderColor(selectedModel.provider) : 'text-gray-600 bg-gray-50'
            )}>
              <ProviderIcon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            </div>
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="truncate font-medium">
                {selectedModel?.name || 'Select Model'}
              </span>
              {!compact && selectedModel && (
                <span className="text-xs text-gray-500 truncate">
                  {selectedModel.provider} • {(selectedModel.contextWindow / 1000).toFixed(0)}K tokens
                </span>
              )}
            </div>
          </div>
          <ChevronDown className={cn('flex-shrink-0 text-gray-400', compact ? 'h-3 w-3 ml-1' : 'h-4 w-4 ml-2')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          Select AI Model
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {models.map((model) => {
          const Icon = getProviderIcon(model.provider);
          const isSelected = selectedModel?.id === model.id;
          
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleModelSelect(model)}
              className={cn(
                'flex items-start gap-3 p-3 cursor-pointer',
                isSelected && 'bg-violet-50'
              )}
            >
              <div className={cn(
                'flex items-center justify-center rounded-lg h-10 w-10 flex-shrink-0 mt-0.5',
                getProviderColor(model.provider)
              )}>
                <Icon className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {model.name}
                  </span>
                  {model.isDefault && (
                    <span className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded font-medium">
                      Default
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="font-medium">{model.provider}</span>
                  <span>•</span>
                  <span>{(model.contextWindow / 1000).toFixed(0)}K context</span>
                </div>
                
                {model.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {model.description}
                  </p>
                )}
              </div>
              
              {isSelected && (
                <Check className="h-5 w-5 text-violet-600 flex-shrink-0 mt-2" />
              )}
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <div className="px-3 py-2 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>{models.length} models available</span>
            <button
              onClick={fetchModels}
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
