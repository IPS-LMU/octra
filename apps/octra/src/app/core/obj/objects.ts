import { Converter } from '@octra/annotation';
import { FileInfo } from '@octra/web-media';
import { BugReportTool } from '@octra/ngx-components';

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

export interface OctraBugReportTool extends BugReportTool {
  customAttributes: {
    "Language": string;
    "Signed in": boolean;
    "Use Mode": string;
    "Last Updated": string;
    "Project"?: string;
    "User"?: string;
    "Task ID"?: string;
    "Audio File Size"?: string;
    "Audio File Duration"?: number;
    "Audio Sampling Rate"?: number;
    "Audio Bitrate"?: number;
    "Audio Channels"?: number;
    "Audio Type": string;
    "Annotation Levels"?: number;
    "Annotation Current Level"?: number;
    "Annotation Number Of Segments"?: number;
  };
}
