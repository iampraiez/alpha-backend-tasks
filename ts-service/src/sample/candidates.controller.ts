import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { WorkspaceAccessGuard } from '../auth/workspace-access.guard';
import { CreateCandidateDocumentDto } from './dto/create-candidate-document.dto';
import { SampleService } from './sample.service';

@Controller('candidates')
@UseGuards(FakeAuthGuard, WorkspaceAccessGuard)
export class CandidatesController {
  constructor(private readonly sampleService: SampleService) {}

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
}
