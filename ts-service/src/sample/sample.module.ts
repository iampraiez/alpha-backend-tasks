import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { CandidatesController } from './candidates.controller';
import { SampleController } from './sample.controller';
import { SampleService } from './sample.service';

@Module({
  imports: [TypeOrmModule.forFeature([SampleWorkspace, SampleCandidate, CandidateDocument])],
  controllers: [SampleController, CandidatesController],
  providers: [SampleService],
  exports: [SampleService],
})
export class SampleModule {}
