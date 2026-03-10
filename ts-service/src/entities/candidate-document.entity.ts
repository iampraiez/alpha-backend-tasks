import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

import { CandidateSummary } from './candidate-summary.entity';

@Entity({ name: 'candidate_documents' })
export class CandidateDocument {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'workspace_id', type: 'varchar', length: 64 })
  workspaceId!: string;

  @Column({ name: 'candidate_name', type: 'varchar', length: 160 })
  candidateName!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ name: 'file_size_bytes', type: 'integer' })
  fileSizeBytes!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToOne(() => CandidateSummary, (summary: CandidateSummary) => summary.document)
  summary!: CandidateSummary | null;
}
