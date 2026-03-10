import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SampleCandidate } from '../entities/sample-candidate.entity';
import { FakeAuthGuard } from './fake-auth.guard';
import { WorkspaceAccessGuard } from './workspace-access.guard';

@Module({
  imports: [TypeOrmModule.forFeature([SampleCandidate])],
  providers: [FakeAuthGuard, WorkspaceAccessGuard],
  exports: [FakeAuthGuard, WorkspaceAccessGuard],
})
export class AuthModule {}
