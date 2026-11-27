import { PdfAuditPreflightError, readPrivatePdfAuditConfig, readScopedPdfInventory, runPdfAudit } from './lib/pdf-audit';

export async function runPdfAuditCli(argv: string[]): Promise<void> {
  try {
    if (argv.length !== 6 || argv[0] !== '--config' || argv[2] !== '--project-ref' || argv[4] !== '--course-id') {
      throw new PdfAuditPreflightError('EXPECTED_CONFIG_PROJECT_AND_COURSE');
    }
    const config = readPrivatePdfAuditConfig(argv[1], { projectRef: argv[3], courseId: argv[5] });
    const report = await runPdfAudit(config, { readInventory: readScopedPdfInventory, fetch });
    console.log(JSON.stringify(report));
    if (report.outcome !== 'complete') process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ outcome: 'incomplete', status: error instanceof PdfAuditPreflightError ? error.code : 'AUDIT_FAILURE' }));
    process.exitCode = 1;
  }
}

// No environment fallback or provider/database client is created during import.
if (process.argv[1]?.endsWith('/audit-pdf-attachments.ts')) void runPdfAuditCli(process.argv.slice(2));
