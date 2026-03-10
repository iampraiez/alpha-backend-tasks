import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';

import { SampleCandidate } from '../entities/sample-candidate.entity';

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(SampleCandidate)
    private readonly candidateRepository: Repository<SampleCandidate>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      return false;
    }

    const candidateIdParam = request.params.candidateId;
    if (!candidateIdParam) {
      return true;
    }

    const candidateId = Array.isArray(candidateIdParam) ? candidateIdParam[0] : candidateIdParam;

    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (candidate.workspaceId !== user.workspaceId) {
      throw new ForbiddenException('Access denied to this workspace resource');
    }

    return true;
  }
}
