import { Converter } from '@octra/annotation';
import { FileInfo } from '@octra/web-media';

export interface FileProgress {
  id: number;
  status: 'progress' | 'valid' | 'invalid' | 'waiting';
  file: FileInfo;
  needsOptions?: any;
  options?: any;
  converter?: Converter;
  content?: string | ArrayBuffer;
  checked_converters: number;
  progress: number;
  error?: string;
  warning?: string;
}
