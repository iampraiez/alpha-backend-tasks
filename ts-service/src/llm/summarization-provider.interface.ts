export type RecommendedDecision = 'advance' | 'hold' | 'reject';

export enum SupportedLlmModel {
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
}

export interface CandidateSummaryResult {
  score: number;
  strengths: string[];
  concerns: string[];
  summary: string;
  recommendedDecision: RecommendedDecision;
}

export interface CandidateSummaryInput {
  candidateId: string;
  documents: string[];
  model: SupportedLlmModel;
}

export interface SummarizationProvider {
  generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult>;
}

export const SUMMARIZATION_PROVIDER = Symbol('SUMMARIZATION_PROVIDER');
