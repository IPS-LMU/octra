import { Converter } from '@octra/annotation';

export interface FileProgress {
  status: 'progress' | 'valid' | 'invalid' | "waiting";
  name: string;
  type: string;
  size: number;
  file: File;
  needsOptions?: any;
  options?: any;
  converter?: Converter;
  content?: string | ArrayBuffer;
  checked_converters: number;
  progress: number;
  error?: string;
  warning?: string;
}
