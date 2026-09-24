import { IAIProvider, OpenAIProvider } from './ai.provider.js';
import { aiAnalysisSchema, AIAnalysisOutput, AIServiceResponse } from './ai.schema.js';
import { PolicyEvaluationResult } from '../policy/policy.types.js';

export class AIService {
  private provider: IAIProvider;
  private timeoutMs: number;

  constructor(provider?: IAIProvider, timeoutMs: number = 5000) {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.provider = provider || new OpenAIProvider(apiKey, model);
    this.timeoutMs = timeoutMs;
  }

  public async evaluateRequest(
    customer: { id: string; name: string; email: string },
    order: { id: string; orderDate: any; totalAmount: number; currency: string; status: string; items: any[] },
    policyResult: PolicyEvaluationResult,
    customerReason: string
  ): Promise<AIServiceResponse> {
    try {
      // Race provider call against timeout promise
      const rawJsonOutput = await Promise.race([
        this.provider.analyzeRefundRequest(customer, order, policyResult, customerReason),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`AI Service request timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
        ),
      ]);

      // Parse JSON output
      let parsedObj: any;
      try {
        parsedObj = JSON.parse(rawJsonOutput);
      } catch (parseErr) {
        return this.createFallbackResponse(policyResult, 'Malformed JSON output from AI provider.');
      }

      // Validate JSON structure against Zod Schema
      const validationResult = aiAnalysisSchema.safeParse(parsedObj);
      if (!validationResult.success) {
        const errorDetails = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        return this.createFallbackResponse(
          policyResult,
          `AI output validation failed against schema: ${errorDetails}`
        );
      }

      const analysis = validationResult.data;

      // CRITICAL GUARDIAN CHECK: Ensure AI response never attempts to approve a hard-blocked policy
      if (!policyResult.eligible && (analysis.intent === 'refund_request' && analysis.risk === 'low' && !analysis.needsEscalation)) {
        // Enforce safety alignment
        analysis.needsEscalation = true;
        analysis.risk = 'high';
        analysis.reasoning += ' [System Guard: Enforced escalation due to hard policy denial.]';
      }

      return {
        analysis,
        aiFailed: false,
      };
    } catch (err: any) {
      console.warn(`[AIService]: Fallback triggered due to error: ${err.message}`);
      return this.createFallbackResponse(policyResult, err.message || 'AI service failure');
    }
  }

  /**
   * Generates a safe, deterministic fallback AI response matching schema structure
   */
  public createFallbackResponse(
    policyResult: PolicyEvaluationResult,
    reason: string
  ): AIServiceResponse {
    let customerResponse = '';
    let fallbackReasoning = `[Deterministic Fallback Mode - AI unavailable (${reason})]. `;

    if (policyResult.recommendedDecision === 'APPROVED') {
      customerResponse = 'Your refund request has been automatically approved based on our standard refund policy.';
      fallbackReasoning += 'Request meets all standard policy rules for automated approval.';
    } else if (policyResult.recommendedDecision === 'DENIED') {
      customerResponse = `Your refund request could not be approved. Reason: ${
        policyResult.hardDenialReason || 'Does not meet standard eligibility window or policy criteria.'
      }`;
      fallbackReasoning += `Request rejected due to hard policy violation: ${policyResult.hardDenialReason}`;
    } else {
      customerResponse =
        'Your refund request has been received and routed to our customer support team for manual review.';
      fallbackReasoning += 'Request flagged for human support review.';
    }

    const fallbackAnalysis: AIAnalysisOutput = {
      intent: 'refund_request',
      confidence: 1.0,
      risk: policyResult.requiresHumanReview ? 'medium' : policyResult.eligible ? 'low' : 'high',
      needsEscalation: policyResult.requiresHumanReview,
      isAmbiguous: false,
      suspiciousFlags: [],
      extractedDetails: {},
      reasoning: fallbackReasoning,
      customerResponse,
    };

    return {
      analysis: fallbackAnalysis,
      aiFailed: true,
      failureReason: reason,
    };
  }
}

export const aiService = new AIService();
