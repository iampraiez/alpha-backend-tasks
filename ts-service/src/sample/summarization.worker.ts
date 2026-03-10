import * as fs from 'fs';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SUMMARIZATION_PROVIDER, SummarizationProvider, SupportedLlmModel } from '../llm/summarization-provider.interface';
import { EnqueuedJob, QueueService } from '../queue/queue.service';

interface GenerateSummaryPayload {
  summaryId: string;
  documentId: string;
  workspaceId: string;
  llmModel: SupportedLlmModel;
}

@Injectable()
export class SummarizationWorker implements OnModuleInit {
  private readonly logger = new Logger(SummarizationWorker.name);

  constructor(
    private readonly queueService: QueueService,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
  ) { }

  onModuleInit() {
    setInterval(() => {
      this.processQueue().catch((err) => {
        this.logger.error('Error processing queue', err);
      });
    }, 5000);
  }

  private async processQueue() {
    const internalQueue = (
      this.queueService as unknown as { jobs: EnqueuedJob<GenerateSummaryPayload>[] }
    ).jobs;
    const jobIndex = internalQueue.findIndex((j) => j.name === 'generate-summary');

    if (jobIndex === -1) {
      return;
    }

    const job = internalQueue.splice(jobIndex, 1)[0];
    const { summaryId, documentId, workspaceId, llmModel } = job.payload;

    const document = await this.documentRepository.findOne({
      where: { id: documentId, workspaceId },
    });

    if (!document) {
      return;
    }

    try {
      const rawText = fs.readFileSync(document.storageKey, 'utf8');

      const result = await this.summarizationProvider.generateCandidateSummary({
        candidateId: document.candidateId,
        documents: [rawText],
        model: llmModel,
      });

      await this.summaryRepository.update(summaryId, {
        summary: JSON.stringify(result),
        llmModel,
      });

      document.status = 'completed';
      await this.documentRepository.save(document);
    } catch (error) {
      this.logger.error(`Failed to generate summary for document ${documentId}`, error);
      document.status = 'failed';
      await this.documentRepository.save(document);
    }
  }
}
