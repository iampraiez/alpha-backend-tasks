import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const model = this.ai.getGenerativeModel({
      model: input.model,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `
      Analyze the provided candidate documents and generate a summary JSON.
      Candidate ID: ${input.candidateId}

      Documents Content:
      ${input.documents.join('\n\n')}

      Return ONLY a JSON matching this exact structure, nothing else:
      {
        "score": (number between 0 and 100),
        "strengths": ["list", "of", "strings"],
        "concerns": ["list", "of", "strings"],
        "summary": "a brief text summary",
        "recommendedDecision": "advance" | "hold" | "reject"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return JSON.parse(text) as CandidateSummaryResult;
  }
}
