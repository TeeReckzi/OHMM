import * as path from 'path';
import * as fs from 'fs/promises';
import { PipelineConfig } from './types';

export async function safeWrite(
  relativePath: string,
  content: string,
  config: PipelineConfig
): Promise<void> {
  // Reject obvious absolute path attempts early
  if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
    throw new Error(`safeWrite: relativePath must not be absolute: "${relativePath}"`);
  }

  const resolved = path.resolve(config.decodedOutputDir, relativePath);
  const boundary = path.resolve(config.decodedOutputDir);

  // On Windows, normalize to consistent casing for startsWith check
  const normalizedResolved = resolved.toLowerCase();
  const normalizedBoundary = boundary.toLowerCase();

  if (
    normalizedResolved !== normalizedBoundary &&
    !normalizedResolved.startsWith(normalizedBoundary + path.sep)
  ) {
    throw new Error(
      `safeWrite: path escapes boundary.\n` +
      `  Resolved: ${resolved}\n` +
      `  Boundary: ${boundary}`
    );
  }

  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, 'utf-8');
}
