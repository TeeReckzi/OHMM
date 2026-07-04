import * as crypto from 'crypto';
import { ExtractionMethod, MetaBlock, PipelineConfig } from './types';

export function generateMeta(options: {
  sourceFile: string;
  sourceScannedPath: string;
  extractionMethod: ExtractionMethod;
  recordCount: number;
  sourceContent: string;
  config: PipelineConfig;
}): MetaBlock {
  const hash = crypto.createHash('sha256')
    .update(options.sourceContent, 'utf-8')
    .digest('hex');

  return {
    sourceFile: options.sourceFile,
    sourceScannedPath: options.sourceScannedPath,
    extractionMethod: options.extractionMethod,
    decodedAt: new Date().toISOString(),
    recordCount: options.recordCount,
    sourceHash: hash,
    pipelineVersion: options.config.pipelineVersion,
  };
}
