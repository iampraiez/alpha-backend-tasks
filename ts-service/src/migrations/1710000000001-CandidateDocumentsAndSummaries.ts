import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CandidateDocumentsAndSummaries1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'candidate_documents',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '64',
            isPrimary: true,
          },
          {
            name: 'workspace_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'candidate_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'document_type',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'storage_key',
            type: 'varchar',
            length: '512',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            isNullable: false,
            default: "'pending'",
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'candidate_summaries',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '64',
            isPrimary: true,
          },
          {
            name: 'document_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'workspace_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'summary',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'llm_model',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'candidate_documents',
      new TableForeignKey({
        name: 'fk_candidate_documents_candidate_id',
        columnNames: ['candidate_id'],
        referencedTableName: 'sample_candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'candidate_documents',
      new TableIndex({
        name: 'idx_candidate_documents_candidate_id',
        columnNames: ['candidate_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'candidate_summaries',
      new TableForeignKey({
        name: 'fk_candidate_summaries_document_id',
        columnNames: ['document_id'],
        referencedTableName: 'candidate_documents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'candidate_documents',
      new TableIndex({
        name: 'idx_candidate_documents_workspace_id',
        columnNames: ['workspace_id'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_documents',
      new TableIndex({
        name: 'idx_candidate_documents_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({
        name: 'idx_candidate_summaries_workspace_id',
        columnNames: ['workspace_id'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({
        name: 'idx_candidate_summaries_document_id',
        isUnique: true,
        columnNames: ['document_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_document_id');
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_workspace_id');
    await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_status');
    await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_workspace_id');
    await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_candidate_id');
    await queryRunner.dropForeignKey('candidate_summaries', 'fk_candidate_summaries_document_id');
    await queryRunner.dropForeignKey('candidate_documents', 'fk_candidate_documents_candidate_id');
    await queryRunner.dropTable('candidate_summaries');
    await queryRunner.dropTable('candidate_documents');
  }
}
