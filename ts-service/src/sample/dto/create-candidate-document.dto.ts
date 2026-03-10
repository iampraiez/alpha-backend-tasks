import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCandidateDocumentDto {
  @IsString()
  @IsNotEmpty()
  candidateId!: string;

  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  rawText!: string;
}
