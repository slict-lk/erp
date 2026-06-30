/**
 * ERP Task Handlers for Groq AI
 * Specialized functions for:
 * - Invoice generation
 * - Sales predictions
 * - Inventory forecasting
 * - Financial reports
 * - HR reports
 * - SQL query generation
 */

import { getGroqEngine } from './groq-engine';
import { ChatMessage } from './groq-client';

export interface InvoiceRequest {
  clientName: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  dueDate?: string;
  notes?: string;
}

export interface SalesPrediction {
  period: string;
  predictedRevenue: number;
  confidence: number;
  recommendations: string[];
}

export interface InventoryForecast {
  productId: string;
  currentStock: number;
  predictedDemand: number;
  recommendedReorder: number;
}

export interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  summary: string;
}

/**
 * Generate invoice from natural language input
 */
export async function generateInvoice(
  description: string,
  tenantId: string
): Promise<{
  invoiceData: InvoiceRequest;
  explanation: string;
}> {
  const engine = getGroqEngine();

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert ERP assistant. When asked to generate an invoice, extract the following information and return it as a JSON object:
{
  "clientName": "string",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number
    }
  ],
  "dueDate": "YYYY-MM-DD",
  "notes": "string"
}

After the JSON, provide a brief explanation of what invoice was created.`,
    },
    {
      role: 'user',
      content: `Generate an invoice from this request: ${description}`,
    },
  ];

  try {
    const result = await engine.generateCompletion(messages, {
      temperature: 0.3, // Lower temperature for structured output
      maxTokens: 1500,
    });

    // Parse the response to extract JSON
    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    let invoiceData: InvoiceRequest = {
      clientName: 'Unknown',
      items: [],
    };

    if (jsonMatch) {
      try {
        invoiceData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Failed to parse invoice JSON:', e);
      }
    }

    return {
      invoiceData,
      explanation: result.response,
    };
  } catch (error: any) {
    throw new Error(`Failed to generate invoice: ${error.message}`);
  }
}

/**
 * Predict sales based on historical data and market trends
 */
export async function predictSales(
  historicalData: string,
  marketContext: string
): Promise<SalesPrediction> {
  const engine = getGroqEngine();

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert business analyst. Based on historical sales data and market context, provide a JSON prediction:
{
  "period": "string (e.g., 'Q1 2024')",
  "predictedRevenue": number,
  "confidence": number (0-1),
  "recommendations": ["string"]
}

Be data-driven and realistic with predictions.`,
    },
    {
      role: 'user',
      content: `Historical data: ${historicalData}\n\nMarket context: ${marketContext}\n\nProvide a sales prediction.`,
    },
  ];

  try {
    const result = await engine.generateCompletion(messages, {
      temperature: 0.4,
      maxTokens: 1000,
    });

    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    let prediction: SalesPrediction = {
      period: 'Unknown',
      predictedRevenue: 0,
      confidence: 0,
      recommendations: [],
    };

    if (jsonMatch) {
      try {
        prediction = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Failed to parse prediction JSON:', e);
      }
    }

    return prediction;
  } catch (error: any) {
    throw new Error(`Failed to predict sales: ${error.message}`);
  }
}

/**
 * Forecast inventory needs
 */
export async function forecastInventory(
  productData: string,
  demandTrends: string
): Promise<InventoryForecast[]> {
  const engine = getGroqEngine();

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an inventory optimization expert. Based on product data and demand trends, provide a JSON array of forecasts:
[
  {
    "productId": "string",
    "currentStock": number,
    "predictedDemand": number,
    "recommendedReorder": number
  }
]

Be conservative with reorder recommendations to avoid stockouts.`,
    },
    {
      role: 'user',
      content: `Product data: ${productData}\n\nDemand trends: ${demandTrends}\n\nProvide inventory forecasts.`,
    },
  ];

  try {
    const result = await engine.generateCompletion(messages, {
      temperature: 0.3,
      maxTokens: 1500,
    });

    const jsonMatch = result.response.match(/\[[\s\S]*\]/);
    let forecasts: InventoryForecast[] = [];

    if (jsonMatch) {
      try {
        forecasts = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Failed to parse inventory JSON:', e);
      }
    }

    return forecasts;
  } catch (error: any) {
    throw new Error(`Failed to forecast inventory: ${error.message}`);
  }
}

/**
 * Generate financial report from transaction data
 */
export async function generateFinancialReport(
  transactionData: string,
  period: string
): Promise<FinancialReport> {
  const engine = getGroqEngine();

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a financial analyst. Based on transaction data, generate a financial report in this JSON format:
{
  "period": "string",
  "totalRevenue": number,
  "totalExpenses": number,
  "netProfit": number,
  "summary": "string (2-3 sentences analysis)"
}

Be accurate and include key financial insights.`,
    },
    {
      role: 'user',
      content: `Transaction data for ${period}:\n${transactionData}\n\nGenerate a financial report.`,
    },
  ];

  try {
    const result = await engine.generateCompletion(messages, {
      temperature: 0.3,
      maxTokens: 1000,
    });

    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    let report: FinancialReport = {
      period,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      summary: '',
    };

    if (jsonMatch) {
      try {
        report = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Failed to parse financial report JSON:', e);
      }
    }

    return report;
  } catch (error: any) {
    throw new Error(`Failed to generate financial report: ${error.message}`);
  }
}

/**
 * Generate HR report (headcount, turnover, salary analysis)
 */
export async function generateHRReport(
  employeeData: string,
  period: string
): Promise<{
  totalHeadcount: number;
  turnoverRate: number;
  averageSalary: number;
  highlights: string[];
}> {
  const engine = getGroqEngine();

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an HR analytics expert. Based on employee data, generate a report in this JSON format:
{
  "totalHeadcount": number,
  "turnoverRate": number (0-1),
  "averageSalary": number,
  "highlights": ["string"]
}

Provide actionable HR insights.`,
    },
    {
      role: 'user',
      content: `Employee data for ${period}:\n${employeeData}\n\nGenerate an HR report.`,
    },
  ];

  try {
    const result = await engine.generateCompletion(messages, {
      temperature: 0.3,
      maxTokens: 1000,
    });

    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    let report = {
      totalHeadcount: 0,
      turnoverRate: 0,
      averageSalary: 0,
      highlights: [],
    };

    if (jsonMatch) {
      try {
        report = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Failed to parse HR report JSON:', e);
      }
    }

    return report;
  } catch (error: any) {
    throw new Error(`Failed to generate HR report: ${error.message}`);
  }
}

/**
 * Generate SQL queries from natural language prompts
 * SECURITY NOTE: Use with extreme caution - always validate in production
 */
export async function generateSQLQuery(
  naturalLanguagePrompt: string,
  schemaDescription: string
): Promise<{
  query: string;
  explanation: string;
  warning?: string;
}> {
  const engine = getGroqEngine();
await engine.initialize();

const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a PostgreSQL expert. Based on a schema description, generate a safe SQL query.

IMPORTANT: Follow these security rules:
1. Only SELECT queries (never DELETE, DROP, UPDATE)
2. Always use parameterized queries with $1, $2, etc.
3. Include LIMIT to prevent large data transfers
4. Return query and explanation separately

Format your response as:
{
  "query": "string (SQL query)",
  "explanation": "string (what the query does)",
  "warning": "string (any security or performance concerns)"
}`,
    },
    {
      role: 'user',
      content: `Schema:\n${schemaDescription}\n\nGenerate SQL for: ${naturalLanguagePrompt}`,
    },
  ];

  try {
    const result = await engine.generateCompletion(messages, {
      temperature: 0.2, // Very low temperature for code generation
      maxTokens: 1500,
    });

    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    let queryInfo = {
      query: '',
      explanation: result.response,
      warning: '⚠️ Always validate SQL queries before execution!',
    };

    if (jsonMatch) {
      try {
        queryInfo = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Failed to parse SQL JSON:', e);
      }
    }

    return queryInfo;
  } catch (error: any) {
    throw new Error(`Failed to generate SQL query: ${error.message}`);
  }
}

/**
 * Generate sales report with insights
 */
export async function generateSalesReport(
  salesData: string,
  period: string
): Promise<{
  totalSales: number;
  topProducts: string[];
  topCustomers: string[];
  insights: string[];
}> {
  const engine = getGroqEngine();

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a sales analyst. Based on sales data, generate a report in this JSON format:
{
  "totalSales": number,
  "topProducts": ["string"],
  "topCustomers": ["string"],
  "insights": ["string"]
}

Provide actionable sales insights and trends.`,
    },
    {
      role: 'user',
      content: `Sales data for ${period}:\n${salesData}\n\nGenerate a sales report.`,
    },
  ];

  try {
    const result = await engine.generateCompletion(messages, {
      temperature: 0.4,
      maxTokens: 1200,
    });

    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    let report = {
      totalSales: 0,
      topProducts: [],
      topCustomers: [],
      insights: [],
    };

    if (jsonMatch) {
      try {
        report = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Failed to parse sales report JSON:', e);
      }
    }

    return report;
  } catch (error: any) {
    throw new Error(`Failed to generate sales report: ${error.message}`);
  }
}
