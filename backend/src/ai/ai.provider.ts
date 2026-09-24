import OpenAI from 'openai';
import { buildSystemInstruction, buildUserPrompt } from './prompt.guard.js';
import { PolicyEvaluationResult } from '../policy/policy.types.js';

export interface IAIProvider {
  analyzeRefundRequest(
    customer: { id: string; name: string; email: string },
    order: { id: string; orderDate: any; totalAmount: number; currency: string; status: string; items: any[] },
    policyResult: PolicyEvaluationResult,
    customerReason: string
  ): Promise<string>;
}

export class OpenAIProvider implements IAIProvider {
  private client: OpenAI | null = null;
  private model: string;

  constructor(apiKey?: string, model: string = 'gpt-4o-mini') {
    this.model = model;
    if (apiKey && apiKey !== 'mock-key' && apiKey.length > 5) {
      this.client = new OpenAI({ apiKey });
    }
  }

  public isConfigured(): boolean {
    return this.client !== null;
  }

  async analyzeRefundRequest(
    customer: { id: string; name: string; email: string },
    order: { id: string; orderDate: any; totalAmount: number; currency: string; status: string; items: any[] },
    policyResult: PolicyEvaluationResult,
    customerReason: string
  ): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client is not configured (missing or invalid API key).');
    }

    const systemInstruction = buildSystemInstruction();
    const userPrompt = buildUserPrompt(customer, order, policyResult, customerReason);

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for consistent JSON adherence
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response.');
    }

    return content;
  }
}
