import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { CreateCandidateDocumentDto } from './dto/create-candidate-document.dto';
import { CreateSampleCandidateDto } from './dto/create-sample-candidate.dto';

@Injectable()
export class SampleService {
  constructor(
    @InjectRepository(SampleWorkspace)
    private readonly workspaceRepository: Repository<SampleWorkspace>,
    @InjectRepository(SampleCandidate)
    private readonly candidateRepository: Repository<SampleCandidate>,
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
  ) {}

  async createCandidate(user: AuthUser, dto: CreateSampleCandidateDto): Promise<SampleCandidate> {
    await this.ensureWorkspace(user.workspaceId);

    const candidate = this.candidateRepository.create({
      id: randomUUID(),
      workspaceId: user.workspaceId,
      fullName: dto.fullName.trim(),
      email: dto.email?.trim() ?? null,
    });

    return this.candidateRepository.save(candidate);
  }

  async listCandidates(user: AuthUser): Promise<SampleCandidate[]> {
    return this.candidateRepository.find({
      where: { workspaceId: user.workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async createCandidateDocument(
    user: AuthUser,
    dto: CreateCandidateDocumentDto,
  ): Promise<CandidateDocument> {
    console.log('User', user, dto)
    await this.ensureWorkspace(user.workspaceId);

    const candidate = await this.candidateRepository.findOne({
      where: { id: dto.candidateId, workspaceId: user.workspaceId },
    });

    console.log('Candidate', candidate)
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const documentId = randomUUID();
    const storageDir = path.join(process.cwd(), '.storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const storageKey = path.join(storageDir, `${documentId}.txt`);
    fs.writeFileSync(storageKey, dto.rawText, 'utf8');

    const document = this.documentRepository.create({
      id: documentId,
      workspaceId: user.workspaceId,
      candidateId: candidate.id,
      documentType: dto.documentType,
      fileName: dto.fileName,
      storageKey,
      status: 'pending',
    });

    return this.documentRepository.save(document);
  }

  private async ensureWorkspace(workspaceId: string): Promise<void> {
    const existing = await this.workspaceRepository.findOne({ where: { id: workspaceId } });

    if (existing) {
      return;
    }

    const workspace = this.workspaceRepository.create({
      id: workspaceId,
      name: `Workspace ${workspaceId}`,
    });

    await this.workspaceRepository.save(workspace);
  }
}
