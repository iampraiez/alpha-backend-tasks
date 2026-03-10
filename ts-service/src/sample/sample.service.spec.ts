import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
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

    expect(workspaceRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'workspace-1' },
    });
    expect(candidateRepository.create).toHaveBeenCalled();
    expect(result.fullName).toBe('Ada Lovelace');
    expect(result.workspaceId).toBe('workspace-1');
  });
});

