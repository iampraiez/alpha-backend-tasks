import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

import { CandidateSummary } from './candidate-summary.entity';
import { SampleCandidate } from './sample-candidate.entity';

@Entity({ name: 'candidate_documents' })
export class CandidateDocument {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'workspace_id', type: 'varchar', length: 64 })
  workspaceId!: string;

  @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
  candidateId!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 120 })
  documentType!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 512 })
  storageKey!: string;

  @Column({ type: 'varchar', length: 32, default: "'pending'" })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => SampleCandidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: SampleCandidate;

  @OneToOne(() => CandidateSummary, (summary: CandidateSummary) => summary.document)
  summary!: CandidateSummary | null;
}
