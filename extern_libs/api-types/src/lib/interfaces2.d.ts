import {
  JSONFileSetDefinition,
  JSONFileSetStatement,
  JSONSETFileConstraints,
} from '@octra/json-sets';

export interface FileMetaData {}
export interface AudioFileMetaData extends FileMetaData {
    bitRate?: number;
    numberOfChannels?: number;
    duration?: {
        samples: number;
        seconds: number;
    };
    sampleRate?: number;
    container?: string;
    codec?: string;
    lossless?: boolean;
}
export interface TaskTypeSetDefinition extends JSONFileSetDefinition {
    statements: TaskTypeStatement[];
}
export interface TaskTypeStatement extends JSONFileSetStatement {
    name: string;
    constraints: TaskTypesConstraints[];
}
export interface TaskTypesConstraints extends JSONSETFileConstraints {
    defaultFile?: string;
    schemaFile?: string;
    defaultName: string;
}
export interface IOValidation {
    inputs: JSONFileSetDefinition;
    outputs: JSONFileSetDefinition;
}
export interface I18nMultiTranslationDto {
    singular: string;
    plural: string;
}
export declare class RoleBadgeSettings {
    backgroundColor: string;
    color: string;
    border?: string;
}
