import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';

import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
} from './summarization-provider.interface';

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
  private readonly ai: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenerativeAI(apiKey || 'fake_key_for_tests');
  }

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    const summarySchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        score: { type: SchemaType.NUMBER },
        strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        concerns: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        summary: { type: SchemaType.STRING },
        recommendedDecision: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['advance', 'hold', 'reject'],
        },
      },
      required: ['score', 'strengths', 'concerns', 'summary', 'recommendedDecision'],
    };

    const model = this.ai.getGenerativeModel({
      model: input.model,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: summarySchema,
      },
    });

    const prompt = `
      Analyze the provided candidate documents and generate a summary JSON.
      Candidate ID: ${input.candidateId}

      Documents Content:
      ${input.documents.join('\n\n')}
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);

      if (
        typeof parsed?.score !== 'number' ||
        !Array.isArray(parsed?.strengths) ||
        !Array.isArray(parsed?.concerns) ||
        typeof parsed?.summary !== 'string' ||
        !['advance', 'hold', 'reject'].includes(parsed?.recommendedDecision)
      ) {
        throw new Error('LLM output does not match the required CandidateSummaryResult schema.');
      }

      return parsed as CandidateSummaryResult;
    } catch (error) {
      throw new Error(`LLM generation or validation failed: ${(error as Error).message}`);
    }
  }
}
