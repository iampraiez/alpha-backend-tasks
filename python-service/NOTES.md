# Part A Implementation Notes

## Architecture decisions
- **Stored HTML Edge Design**: Utilizing the `html_content` field directly within the `briefings` repository ensures O(1) reads for retrieving predefined structured HTML via the GET Endpoint. This reduces CPU server overhead required for Jinja templating, offloading processing purely to the explicitly invoked `POST /generate` rendering route.
- **Relational Integrity**: Used manual cascading deletion references combined with natively nested database indexes, minimizing ORM overheads while ensuring orphaned metric rows aren't inadvertently stalled. Pure mapping ensures standard Python dictionary manipulation yields safe transactional persistence.
- **ReportFormatter Isolation**: Templating execution is kept decoupled directly inside the service layer via Jinja `Environment` instantiation without tightly coupling to FastAPI web requests.
- **Pure SQL Migrations**: Ignored automatic Alembic logic to stay perfectly nested within the starter's raw dependency parsing scripts format for `run_migrations.py`.

## Future improvements
- **Queue/Async Processing**: The `POST /generate` endpoint currently maps templates synchronously under a web scope constraint. Integrating Celery or an SQS layer to push rendering payloads would protect server boundaries during burst generation contexts.
- **Durable Storage**: Storing giant HTML blobs dynamically into standard relational databases bloats disk schemas rapidly in production architectures. External object caches like Redis or AWS S3 should receive these buffered strings.
- **Pagination Validation**: Enhancing the database getters and adding parameterized DTOs to parse limit+offset bounds ensures scalability whenever briefing volumes spike.
