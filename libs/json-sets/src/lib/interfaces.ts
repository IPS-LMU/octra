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
  description?: string;
}

export interface JSONSETFileConstraints extends JSONSetConstraints {
  extension?: string[];
  description?: string;
  contentFormat?: string;
  mimeType?: string[];
  namePattern?: string;
  file?: {
    maxSize?: string;
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
  constraint?: string;
  message: string;
  statement?: JSONSetStatement
}

export interface JSONSetStatement {
  combination: JSONSetCombination;
  name?: string;
  description?: string;
  optional?: boolean;
  take?: number;
  takeMax?: number;
  takeMin?: number;
  constraints: JSONSetConstraints[];
}

export enum JSONSetCombination {
  'union' = 'union',
  'difference' = 'difference',
}
