import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { LlmModule } from '../llm/llm.module';
import { QueueModule } from '../queue/queue.module';
import { CandidatesController } from './candidates.controller';
import { SampleController } from './sample.controller';
import { SampleService } from './sample.service';
import { SummarizationWorker } from './summarization.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SampleWorkspace,
      SampleCandidate,
      CandidateDocument,
      CandidateSummary,
    ]),
    QueueModule,
    LlmModule,
  ],
  controllers: [SampleController, CandidatesController],
  providers: [SampleService, SummarizationWorker],
  exports: [SampleService],
})
export class SampleModule {}
