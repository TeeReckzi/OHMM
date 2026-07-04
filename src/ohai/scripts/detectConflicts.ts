import * as path from 'path';
import { createPipelineConfig } from '../src/pipeline/config';
import { detectConflicts } from '../src/pipeline/conflictDetector';
import { safeWrite } from '../src/pipeline/safeWriter';

async function main(): Promise<void> {
  const config = createPipelineConfig();

  console.log(`[detect:conflicts] Starting conflict detection...`);
  console.log(`[detect:conflicts] Decoded dir: ${config.decodedOutputDir}`);

  const report = await detectConflicts(config);

  const output = JSON.stringify(report, null, 2);
  await safeWrite('conflict-report.json', output, config);

  console.log(`[detect:conflicts] Complete.`);
  console.log(`  Verified modules scanned: ${report._meta.verifiedFilesScanned}`);
  console.log(`  Decoded tables scanned:   ${report._meta.decodedTablesScanned}`);
  console.log(`  Total comparisons:        ${report._meta.totalComparisons}`);
  console.log(``);
  console.log(`  Summary:`);
  console.log(`    Exact matches:        ${report.summary.exact_match}`);
  console.log(`    Partial matches:      ${report.summary.partial_match}`);
  console.log(`    Conflicts:            ${report.summary.conflict}`);
  console.log(`    Missing in decoded:   ${report.summary.missing_in_decoded}`);
  console.log(`    Missing in verified:  ${report.summary.missing_in_verified}`);
  console.log(`    Unknown field schema: ${report.summary.unknown_field}`);
  console.log(``);

  // Print candidate matches summary
  console.log(`  Candidate table matches per verified module:`);
  for (const cm of report.candidateMatches) {
    const highCount = cm.matchedDecodedTables.filter(t => t.confidence === 'high').length;
    const medCount = cm.matchedDecodedTables.filter(t => t.confidence === 'medium').length;
    const lowCount = cm.matchedDecodedTables.filter(t => t.confidence === 'low').length;
    console.log(
      `    ${cm.verifiedModule}: ${cm.matchedDecodedTables.length} candidates ` +
      `(${highCount} high, ${medCount} medium, ${lowCount} low)`
    );
  }

  console.log(`\n  Output: ${path.resolve(config.decodedOutputDir, 'conflict-report.json')}`);
}

main().catch((err) => {
  console.error('[detect:conflicts] FATAL:', err.message);
  process.exit(1);
});
