import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { WorkspaceAccessGuard } from '../auth/workspace-access.guard';
import { SupportedLlmModel } from '../llm/summarization-provider.interface';
import { CreateCandidateDocumentDto } from './dto/create-candidate-document.dto';
import { GenerateCandidateSummaryDto } from './dto/generate-candidate-summary.dto';
import { SampleService } from './sample.service';

@Controller('candidates')
@UseGuards(FakeAuthGuard, WorkspaceAccessGuard)
export class CandidatesController {
  constructor(private readonly sampleService: SampleService) {}

  @Get('models')
  getAvailableModels() {
    return {
      models: Object.values(SupportedLlmModel),
      default: SupportedLlmModel.GEMINI_2_5_FLASH,
    };
  }

  @Post(':candidateId/documents')
  async createDocument(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Body() dto: CreateCandidateDocumentDto,
  ) {
    if (dto.candidateId !== candidateId) {
      dto.candidateId = candidateId;
    }
    return this.sampleService.createCandidateDocument(user, dto);
  }

  @Post(':candidateId/summaries/generate')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Body() dto: GenerateCandidateSummaryDto,
  ) {
    return this.sampleService.generateCandidateSummary(user, candidateId, dto);
  }

  @Get(':candidateId/summaries')
  async listSummaries(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {
    return this.sampleService.listCandidateSummaries(user, candidateId);
  }

  @Get(':candidateId/summaries/:summaryId')
  async getSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
  ) {
    return this.sampleService.getCandidateSummary(user, candidateId, summaryId);
  }
}
