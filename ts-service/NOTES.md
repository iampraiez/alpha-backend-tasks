# Part B Implementation Notes

## Architecture decisions
- **Document & Summary Entities**: Chosen a 1-to-1 relationship (`candidate_documents` and `candidate_summaries`) to keep metadata separated from the large LLM string output, making indexing and fetching summaries lightweight.
- **Queue Worker Pattern**: The `SummarizationWorker` polls `QueueService.getQueuedJobs()` every 5 seconds. Since this starter uses an in-memory queue that exposes the array directly, the worker modifies the array to dequeue the job, reads the file from local `.storage`, calls the LLM, and updates the DB.
- **LLM Provider Toggle**: In `LlmModule`, a dynamic `useFactory` provider injects either `GeminiSummarizationProvider` (if `GEMINI_API_KEY` is present and not in `test` environment) or `FakeSummarizationProvider`. This keeps the application tests deterministic.
- **Storage Strategy**: Local file system `.storage` folder is used to persist raw text. The DB only holds the path (`storageKey`).
- **Workspace Access Policy**: `WorkspaceAccessGuard` extracts the path param `candidateId`, fetches the candidate, and guards against cross-workspace accesses natively via the NestJS guard pipeline.

## Future improvements
- **Real message queue**: Replace `QueueService` with Redis + BullMQ.
- **Durable Storage**: Move `.storage` to cloudinary Cloud Storage.
- **Rate limiting / Retries / DLQ**: The worker currently catches errors and marks status `failed`, but lacks a Dead Letter Queue or retry exponential backoff for flaky LLM API calls.
- **Validation**: Improve the prompt structure and implement a validator library like `zod` to strictly parse the Gemini JSON response instead of a raw `JSON.parse`.
