export interface FileProgress {
  status: 'progress' | 'valid' | 'invalid';
  file: File;
  checked_converters: number;
  progress: number;
  error?: string;
  warning?: string;
}
