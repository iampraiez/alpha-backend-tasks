import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateCandidateSummaryDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  llmModel!: string;
}
