export interface FileProgress {
  status: 'progress' | 'valid' | 'invalid';
  name: string;
  type: string;
  size: number;
  file: File;
  content?: string | ArrayBuffer;
  checked_converters: number;
  progress: number;
  error?: string;
  warning?: string;
}
