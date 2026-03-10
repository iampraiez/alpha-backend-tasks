import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { SupportedLlmModel } from '../llm/summarization-provider.interface';
import { QueueService } from '../queue/queue.service';
import { SampleService } from './sample.service';

describe('SampleService', () => {
  let service: SampleService;

  const workspaceRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const candidateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const documentRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const summaryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const queueService = {
    enqueue: jest.fn(),
    getQueuedJobs: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SampleService,
        {
          provide: getRepositoryToken(SampleWorkspace),
          useValue: workspaceRepository,
        },
        {
          provide: getRepositoryToken(SampleCandidate),
          useValue: candidateRepository,
        },
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: documentRepository,
        },
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: summaryRepository,
        },
        {
          provide: QueueService,
          useValue: queueService,
        },
      ],
    }).compile();

    service = module.get<SampleService>(SampleService);
  });

  it('creates candidate within current workspace', async () => {
    workspaceRepository.findOne.mockResolvedValue({ id: 'workspace-1' });
    candidateRepository.create.mockImplementation((value: unknown) => value);
    candidateRepository.save.mockImplementation(async (value: unknown) => value);

    const result = await service.createCandidate(
      { userId: 'user-1', workspaceId: 'workspace-1' },
      { fullName: 'Ada Lovelace', email: 'ada@example.com' },
    );

    expect(workspaceRepository.findOne).toHaveBeenCalledWith({ where: { id: 'workspace-1' } });
    expect(candidateRepository.create).toHaveBeenCalled();
    expect(result.fullName).toBe('Ada Lovelace');
    expect(result.workspaceId).toBe('workspace-1');
  });

  it('createCandidateDocument saves document with pending status', async () => {
    const user = { userId: 'user-1', workspaceId: 'workspace-1' };
    const dto = {
      candidateId: 'candidate-1',
      documentType: 'resume',
      fileName: 'resume.txt',
      rawText: 'Experienced software engineer with 5 years of experience.',
    };

    workspaceRepository.findOne.mockResolvedValue({ id: 'workspace-1' });
    candidateRepository.findOne.mockResolvedValue({ id: 'candidate-1', workspaceId: 'workspace-1' });
    documentRepository.create.mockImplementation((value: unknown) => value);
    documentRepository.save.mockImplementation(async (value: unknown) => value);

    const result = await service.createCandidateDocument(user, dto);

    expect(candidateRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'candidate-1', workspaceId: 'workspace-1' },
    });
    expect(documentRepository.create).toHaveBeenCalled();
    expect(documentRepository.save).toHaveBeenCalled();
    expect(result).toMatchObject({
      candidateId: 'candidate-1',
      workspaceId: 'workspace-1',
      documentType: 'resume',
      fileName: 'resume.txt',
      status: 'pending',
    });
  });

  it('createCandidateDocument throws NotFoundException when candidate not found', async () => {
    const user = { userId: 'user-1', workspaceId: 'workspace-1' };
    const dto = {
      candidateId: 'nonexistent',
      documentType: 'resume',
      fileName: 'resume.txt',
      rawText: 'text',
    };

    workspaceRepository.findOne.mockResolvedValue({ id: 'workspace-1' });
    candidateRepository.findOne.mockResolvedValue(null);

    await expect(service.createCandidateDocument(user, dto)).rejects.toThrow('Candidate not found');
  });

  it('generateCandidateSummary creates summary record, transitions document to processing, and enqueues job', async () => {
    const user = { userId: 'user-1', workspaceId: 'workspace-1' };
    const candidateId = 'candidate-1';
    const dto = { documentId: 'doc-1', llmModel: SupportedLlmModel.GEMINI_2_5_FLASH };

    const mockDocument = { id: 'doc-1', candidateId, workspaceId: 'workspace-1', status: 'pending' };
    const mockSummary = {
      id: 'summary-1',
      documentId: 'doc-1',
      workspaceId: 'workspace-1',
      summary: '',
      llmModel: SupportedLlmModel.GEMINI_2_5_FLASH,
    };

    workspaceRepository.findOne.mockResolvedValue({ id: 'workspace-1' });
    documentRepository.findOne.mockResolvedValue(mockDocument);
    summaryRepository.create.mockReturnValue(mockSummary);
    summaryRepository.save.mockResolvedValue(mockSummary);
    documentRepository.save.mockResolvedValue({ ...mockDocument, status: 'processing' });
    queueService.enqueue.mockReturnValue({
      id: 'job-1',
      name: 'generate-summary',
      payload: {},
      enqueuedAt: new Date().toISOString(),
    });

    const result = await service.generateCandidateSummary(user, candidateId, dto);

    expect(documentRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'doc-1', candidateId, workspaceId: 'workspace-1' },
    });
    expect(summaryRepository.save).toHaveBeenCalled();
    expect(queueService.enqueue).toHaveBeenCalledWith(
      'generate-summary',
      expect.objectContaining({ documentId: 'doc-1', workspaceId: 'workspace-1' }),
    );
    expect(documentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'processing' }),
    );
    expect(result).toMatchObject({ documentId: 'doc-1' });
  });

  it('generateCandidateSummary throws NotFoundException when document not found', async () => {
    const user = { userId: 'user-1', workspaceId: 'workspace-1' };
    const dto = { documentId: 'missing-doc', llmModel: SupportedLlmModel.GEMINI_2_5_FLASH };

    workspaceRepository.findOne.mockResolvedValue({ id: 'workspace-1' });
    documentRepository.findOne.mockResolvedValue(null);

    await expect(service.generateCandidateSummary(user, 'candidate-1', dto)).rejects.toThrow(
      'Candidate document not found',
    );
  });

  it('listCandidateSummaries returns summaries for a known candidate', async () => {
    const user = { userId: 'user-1', workspaceId: 'workspace-1' };
    const mockSummaries = [
      {
        id: 'summary-1',
        documentId: 'doc-1',
        workspaceId: 'workspace-1',
        summary: '{}',
        llmModel: SupportedLlmModel.GEMINI_2_5_FLASH,
      },
    ];

    workspaceRepository.findOne.mockResolvedValue({ id: 'workspace-1' });
    candidateRepository.findOne.mockResolvedValue({ id: 'candidate-1', workspaceId: 'workspace-1' });
    summaryRepository.find.mockResolvedValue(mockSummaries);

    const result = await service.listCandidateSummaries(user, 'candidate-1');

    expect(candidateRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'candidate-1', workspaceId: 'workspace-1' },
    });
    expect(summaryRepository.find).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('summary-1');
  });

  it('listCandidateSummaries throws NotFoundException when candidate not found', async () => {
    const user = { userId: 'user-1', workspaceId: 'workspace-1' };

    workspaceRepository.findOne.mockResolvedValue({ id: 'workspace-1' });
    candidateRepository.findOne.mockResolvedValue(null);

    await expect(service.listCandidateSummaries(user, 'unknown-candidate')).rejects.toThrow(
      'Candidate not found',
    );
  });

  it('getCandidateSummary returns a single summary by id', async () => {
    const user = { userId: 'user-1', workspaceId: 'workspace-1' };
    const mockSummary = {
      id: 'summary-1',
      documentId: 'doc-1',
      workspaceId: 'workspace-1',
      summary: '{}',
      llmModel: SupportedLlmModel.GEMINI_2_5_FLASH,
    };

    workspaceRepository.findOne.mockResolvedValue({ id: 'workspace-1' });
    summaryRepository.findOne.mockResolvedValue(mockSummary);

    const result = await service.getCandidateSummary(user, 'candidate-1', 'summary-1');

    expect(summaryRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'summary-1', workspaceId: 'workspace-1', document: { candidateId: 'candidate-1' } },
      relations: ['document'],
    });
    expect(result.id).toBe('summary-1');
  });

  it('getCandidateSummary throws NotFoundException when summary not found', async () => {
    const user = { userId: 'user-1', workspaceId: 'workspace-1' };

    workspaceRepository.findOne.mockResolvedValue({ id: 'workspace-1' });
    summaryRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getCandidateSummary(user, 'candidate-1', 'missing-summary'),
    ).rejects.toThrow('Summary not found');
  });
});
