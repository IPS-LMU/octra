import { IFile } from './json-file-set-validator';

export interface AudioFileMetaData {
  bitRate?: number;
  numberOfChannels?: number;
  duration?: { samples: number; seconds: number };
  sampleRate?: number;
  container?: string;
  codec?: string;
  lossless?: boolean;
}

export interface JSONSetConstraints {
  take?: string; // e.g. x => 1
  name: string;
  description?: string;
}

export interface JSONSETFileConstraints extends JSONSetConstraints {
  extension?: string[];
  description?: string;
  mimeType?: string[];
  namePattern?: string;
  file?: {
    size?: string;
  };
}

export interface JSONFileSetStatement extends JSONSetStatement {
  constraints: JSONSETFileConstraints[];
}

export interface JSONFileSetDefinition {
  description?: string;
  name?: string;
  unique?: boolean;
  uniqueSelector?: 'object';

  statements: JSONFileSetStatement[];
}

export interface JSONSetDefinition {
  description?: string;
  name?: string;
  unique?: boolean;
  uniqueSelector?: 'object';

  statements: JSONSetStatement[];
}

export interface JSONSetValidationError {
  path?: string;
  constraint?: string;
  message: string;
}

export interface JSONFileSetValidationError {
  filename: string;
  path?: string;
  message: string;
  statement?: JSONSetStatement;
}

export interface JSONSetStatement {
  name?: string;
  description?: string;
  constraints: JSONSetConstraints[];
}

export interface JSONValidationResult {
  isValid: boolean;
  results: {
    statement: JSONSetStatement;
    validationResults: {
      target?: IFile;
      errors: JSONFileSetValidationError[];
    }[];
  }[];
}

export type ConstraintsChecks = Record<string, JSONFileSetValidationError | true>;
