/**
 * Groq API Client with Llama 3 Support
 * Handles streaming and non-streaming requests to Groq's inference API
 * Free tier with open-weight models (Llama 3, Mixtral)
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  functions?: any[];
  functionCall?: 'auto' | 'none' | 'specific';
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

class GroqClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.groq.com/openai/v1';
  private defaultModel: string = 'llama-3.3-70b-versatile';
  private timeout: number = 60000;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ GROQ_API_KEY not found. Please set the environment variable.');
    }

    // Override defaults from env
    this.defaultModel = process.env.GROQ_MODEL || this.defaultModel;
    this.timeout = parseInt(process.env.GROQ_TIMEOUT || '60000');
  }

  /**
   * Validate API key and connectivity
   */
  async validateConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        console.error('❌ GROQ_API_KEY is not configured');
        return false;
      }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
        const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
          signal: controller.signal,
      });
      
        clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Groq API connection validated');
        return true;
      } else if (response.status === 401) {
        console.error('❌ Invalid GROQ_API_KEY');
        return false;
      } else {
        console.error(`❌ Groq API error: ${response.status}`);
        return false;
      }
    } catch (error) {
        console.error('❌ Groq validation error (may be timeout or network):', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Get list of available models from Groq
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((model: any) => model.id);
    } catch (error) {
      console.error('Error fetching models:', error);
      return [this.defaultModel];
    }
  }

  /**
   * Generate non-streaming completion
   */
  async generateCompletion(
    messages: ChatMessage[],
    options: CompletionOptions = {}
  ): Promise<{
    response: string;
    tokens: number;
    model: string;
    functionCall?: any;
  }> {
    try {
      const model = options.model || this.defaultModel;
      const payload = this.buildRequestPayload(messages, {
        ...options,
        stream: false,
      });

      const response = await this.makeRequest(payload);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Groq API error: ${data.error?.message || response.statusText}`
        );
      }

      const content = data.choices[0]?.message?.content || '';
      const tokens = data.usage?.total_tokens || 0;

      const functionCall = data.choices[0]?.message?.function_call || null;
return {
    response: content,
    tokens,
    model,
    functionCall,
};
    } catch (error: any) {
      console.error('Error in generateCompletion:', error);
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }

  /**
   * Generate streaming completion with AsyncGenerator
   */
  async *generateStreamingCompletion(
    messages: ChatMessage[],
    options: CompletionOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    try {
      const model = options.model || this.defaultModel;
      const payload = this.buildRequestPayload(messages, {
        ...options,
        stream: true,
      });

      const response = await this.makeRequest(payload);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Groq API error: ${error.error?.message || response.statusText}`
        );
      }

      // Transform the response into an AsyncGenerator
      if (!response.body) {
        throw new Error('No response body from Groq API');
      }

      yield* this.transformStreamResponse(response.body);
    } catch (error: any) {
      console.error('Error in generateStreamingCompletion:', error);
      throw new Error(`Failed to stream completion: ${error.message}`);
    }
  }

  /**
   * Transform Groq streaming response to AsyncGenerator<string>
   */
  private async *transformStreamResponse(
    body: ReadableStream<Uint8Array>
  ): AsyncGenerator<string, void, unknown> {
    const reader = body.getReader();
    const decoder = new TextDecoder();

    try {
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            yield buffer;
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Build request payload for Groq API
   */
  private buildRequestPayload(
    messages: ChatMessage[],
    options: CompletionOptions
  ): Record<string, any> {
    return {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      top_p: options.topP ?? 1.0,
      stream: options.stream ?? false,
      // Groq may support function calling in future - prepare for it
      ...(options.functions && {
        functions: options.functions,
        function_call: options.functionCall || 'auto',
      }),
    };
  }

  /**
   * Make HTTP request to Groq API with proper headers and error handling
   */
  private async makeRequest(
    payload: Record<string, any>
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      model: this.defaultModel,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      hasApiKey: !!this.apiKey,
    };
  }
}

// Singleton instance
let groqInstance: GroqClient;

export function getGroqClient(): GroqClient {
  if (!groqInstance) {
    groqInstance = new GroqClient();
  }
  return groqInstance;
}

export { GroqClient };
