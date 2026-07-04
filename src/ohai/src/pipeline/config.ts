import * as path from 'path';
import { PipelineConfig } from './types';

const OHAI_ROOT = path.resolve(__dirname, '..', '..');

export function createPipelineConfig(
  overrides?: Partial<PipelineConfig>
): PipelineConfig {
  return {
    decodedOutputDir: path.resolve(OHAI_ROOT, 'data', 'generated', 'decoded'),
    defaultSourceScanPath: String.raw`C:\Users\tyr3x\Downloads\makeoh\.codex\neox_probe\script_extract_full\bindict_scan.json`,
    pipelineVersion: '0.1.0',
    ...overrides,
  };
}
