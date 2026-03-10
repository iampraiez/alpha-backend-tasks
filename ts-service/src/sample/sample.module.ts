import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { QueueModule } from '../queue/queue.module';
import { CandidatesController } from './candidates.controller';
import { SampleController } from './sample.controller';
import { SampleService } from './sample.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SampleWorkspace,
      SampleCandidate,
      CandidateDocument,
      CandidateSummary,
    ]),
    QueueModule,
  ],
  controllers: [SampleController, CandidatesController],
  providers: [SampleService],
  exports: [SampleService],
})
export class SampleModule {}
