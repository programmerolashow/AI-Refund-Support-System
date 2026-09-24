import { z } from 'zod';

export const aiAnalysisSchema = z.object({
  intent: z.enum([
    'refund_request',
    'cancellation_request',
    'status_inquiry',
    'general_question',
    'other',
  ]),
  confidence: z.number().min(0).max(1),
  risk: z.enum(['low', 'medium', 'high']),
  needsEscalation: z.boolean(),
  isAmbiguous: z.boolean(),
  suspiciousFlags: z.array(z.string()).default([]),
  extractedDetails: z
    .object({
      productMentioned: z.string().optional(),
      claimedCondition: z.string().optional(),
    })
    .default({}),
  reasoning: z.string().min(1, 'Reasoning is required'),
  customerResponse: z.string().min(1, 'Customer response is required'),
});

export type AIAnalysisOutput = z.infer<typeof aiAnalysisSchema>;

export interface AIServiceResponse {
  analysis: AIAnalysisOutput;
  aiFailed: boolean;
  failureReason?: string;
}
