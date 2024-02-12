import {
  JSONSetBlueprint,
  JSONSetResult,
  PossibleSolution,
} from './decision-tree';
import { JsonSetValidator } from './json-set-validator';
import { JSONSet } from './interfaces';

export class IFile {
  name!: string;
  type?: string;
  content?: string;
  size?: number;
}

export class JSONSetFileConditions {
  fileSize?: number;
  content?: string[];
  mimeType?: string[];

  constructor(partial: JSONSetFileConditions) {
    this.fileSize = partial.fileSize;
    this.content = partial.content;
    this.mimeType = partial.mimeType;
  }
}

export class JSONSetFileBlueprint extends JSONSetBlueprint<
  IFile,
  JSONSetFileConditions
> {
  constructor(
    validationMethods: ((
      item: any,
      conditions: JSONSetFileConditions,
      combinationType: 'and' | 'or',
      path: string
    ) => JSONSetResult)[] = []
  ) {
    super(validationMethods);
    this._validationMethods = [
      this.validateMimeType,
      this.validateContent,
      this.validateFileSize,
    ];
  }

  override areEqualArray(
    array: PossibleSolution<IFile, JSONSetFileConditions>[],
    array2: PossibleSolution<IFile, JSONSetFileConditions>[]
  ): boolean {
    if (array.length === array2.length) {
      for (const solution of array) {
        if (
          !array2.find(
            (a) =>
              a.path === solution.path &&
              a.selection.name === solution.selection.name &&
              a.selection.type === solution.selection.type &&
              a.selection.size === solution.selection.size &&
              a.selection.content === solution.selection.content
          )
        ) {
        }
      }
    }

    return false;
  }

  private validateFileSize(
    item: IFile,
    conditions: JSONSetFileConditions,
    combinationType: 'and' | 'or',
    path: string
  ): JSONSetResult {
    if (conditions.fileSize && item.size && item.size > conditions.fileSize) {
      return {
        valid: false,
        error: `File size condition not met by ${path}.`,
        path,
        combinationType,
      };
    }

    return {
      valid: true,
      path,
      combinationType,
    };
  }

  private validateContent(
    item: IFile,
    conditions: JSONSetFileConditions,
    combinationType: 'and' | 'or',
    path: string
  ): JSONSetResult {
    if (
      conditions.content &&
      conditions.content.length > 0 &&
      (!item.content || !conditions.content.includes(item.content))
    ) {
      return {
        valid: false,
        error: `File content type must be one of ${conditions.content.join(
          ','
        )}.`,
        path,
        combinationType,
      };
    }

    return {
      valid: true,
      path,
      combinationType,
    };
  }

  private validateMimeType(
    item: IFile,
    conditions: JSONSetFileConditions,
    combinationType: 'and' | 'or',
    path: string
  ): JSONSetResult {
    if (
      conditions.mimeType &&
      conditions.mimeType.length > 0 &&
      item.type !== undefined &&
      !conditions.mimeType.includes(item.type)
    ) {
      return {
        valid: false,
        error: `File type must be one of ${conditions.mimeType.join(',')}.`,
        path,
        combinationType,
      };
    }
    return {
      valid: true,
      path,
      combinationType,
    };
  }

  override cleanUpSolutions(
    a: PossibleSolution<IFile, JSONSetFileConditions>[],
    index: number,
    solutions: PossibleSolution<IFile, JSONSetFileConditions>[][]
  ): boolean {
    const anyDuplicate = a.some(
      (b, i, so) =>
        so.findIndex((c) => c.selection.name === b.selection.name) !== i
    );

    return (
      !anyDuplicate &&
      solutions.findIndex((b) => {
        for (const iFile of a) {
          const i = b.findIndex(
            (c) =>
              c.path === iFile.path && c.selection.name === iFile.selection.name
          );
          if (i < 0) {
            return false;
          }
        }
        return true;
      }) === index
    );
  }
}

export class FileSetValidator extends JsonSetValidator<
  IFile,
  JSONSetFileConditions
> {
  override blueprint: JSONSetFileBlueprint = new JSONSetFileBlueprint();

  constructor(jsonSet: JSONSet<JSONSetFileConditions>) {
    super();
    this.parse(jsonSet);
  }
}
