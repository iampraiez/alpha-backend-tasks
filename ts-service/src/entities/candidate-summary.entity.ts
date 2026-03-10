import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';

import { CandidateDocument } from './candidate-document.entity';

@Entity({ name: 'candidate_summaries' })
export class CandidateSummary {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'document_id', type: 'varchar', length: 64 })
  documentId!: string;

  @Column({ name: 'workspace_id', type: 'varchar', length: 64 })
  workspaceId!: string;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ name: 'llm_model', type: 'varchar', length: 120 })
  llmModel!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToOne(() => CandidateDocument, (document) => document.summary, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document!: CandidateDocument;
}
