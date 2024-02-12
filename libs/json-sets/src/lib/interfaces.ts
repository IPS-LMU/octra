export interface AudioFileMetaData {
  bitRate?: number;
  numberOfChannels?: number;
  duration?: { samples: number; seconds: number };
  sampleRate?: number;
  container?: string;
  codec?: string;
  lossless?: boolean;
}

export class JSONSetValidationError {
  path?: string;
  message!: string;
  statement?: JSONSetStatement;
  combinationType?: 'and' | 'or';

  constructor(message: string, path?: string) {
    this.message = message;
    this.path = path;
  }
}

export class JSONSetConditions {
  fileSize?: number;
  content?: string[];
  mimeType?: string[];

  constructor(partial: JSONSetConditions) {
    this.fileSize = partial.fileSize;
    this.content = partial.content;
    this.mimeType = partial.mimeType;
  }
}

export class JSONSetStatement {
  select: string;
  with: JSONSetConditions;
  name?: string;
  description?: string;

  constructor(partial: JSONSetStatement) {
    this.select = partial.select;
    this.with = partial.with;
    this.name = partial.name;
    this.description = partial.description;
  }
}

export class JSONSetCombination {
  type: 'and' | 'or';
  expressions: JSONSetExpression[];

  constructor(partial: JSONSetCombination) {
    this.type = partial.type;
    this.expressions = partial.expressions;
  }
}

export class JSONSet {
  name?: string;
  description?: string;
  combine!: JSONSetCombination;
}

export type JSONSetExpression = JSONSetStatement | JSONSet;
