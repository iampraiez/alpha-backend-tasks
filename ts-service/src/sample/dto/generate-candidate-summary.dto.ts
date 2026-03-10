import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { SupportedLlmModel } from '../../llm/summarization-provider.interface';

export class GenerateCandidateSummaryDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsOptional()
  @IsEnum(SupportedLlmModel, {
    message: `llmModel must be one of: ${Object.values(SupportedLlmModel).join(', ')}`,
  })
  llmModel: SupportedLlmModel = SupportedLlmModel.GEMINI_2_5_FLASH;
}
