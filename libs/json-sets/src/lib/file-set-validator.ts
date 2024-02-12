import {
  JSONSetBlueprint,
  JSONSetResult,
  PossibleSolution,
} from './decision-tree';
import { JsonSetValidator } from './json-set-validator';
import { JSONSet, JSONSetStatement } from './interfaces';

export class IFile {
  name!: string;
  type?: string;
  content?: string;
  size?: number;
}

export class JSONSetFileBlueprint extends JSONSetBlueprint<IFile> {
  constructor(
    validationMethods: ((
      item: any,
      statement: JSONSetStatement,
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
    array: PossibleSolution<IFile>[],
    array2: PossibleSolution<IFile>[]
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
    statement: JSONSetStatement,
    combinationType: 'and' | 'or',
    path: string
  ): JSONSetResult {
    if (
      statement.with.fileSize &&
      item.size &&
      item.size > statement.with.fileSize
    ) {
      return {
        valid: false,
        error: `File size must be less than ${statement.with.fileSize}B.`,
        path,
        statement,
        combinationType,
      };
    }
    return {
      valid: true,
      path,
      statement,
      combinationType,
    };
  }

  private validateContent(
    item: IFile,
    statement: JSONSetStatement,
    combinationType: 'and' | 'or',
    path: string
  ): JSONSetResult {
    if (
      statement.with.content &&
      statement.with.content.length > 0 &&
      item.content !== undefined &&
      !statement.with.content.includes(item.content)
    ) {
      return {
        valid: false,
        error: `File content type must be one of ${statement.with.content.join(
          ','
        )}.`,
        path,
        statement,
        combinationType,
      };
    }

    return {
      valid: true,
      path,
      statement,
      combinationType,
    };
  }

  private validateMimeType(
    item: IFile,
    statement: JSONSetStatement,
    combinationType: 'and' | 'or',
    path: string
  ): JSONSetResult {
    if (
      statement.with.mimeType &&
      statement.with.mimeType.length > 0 &&
      item.type !== undefined &&
      !statement.with.mimeType.includes(item.type)
    ) {
      return {
        valid: false,
        error: `File type must be one of ${statement.with.mimeType.join(',')}.`,
        path,
        statement,
        combinationType,
      };
    }
    return {
      valid: true,
      path,
      statement,
      combinationType,
    };
  }

  override cleanUpSolutions(
    a: PossibleSolution<IFile>[],
    index: number,
    solutions: PossibleSolution<IFile>[][]
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

export class FileSetValidator extends JsonSetValidator<IFile> {
  override blueprint: JSONSetFileBlueprint = new JSONSetFileBlueprint();

  constructor(jsonSet: JSONSet) {
    super();
    this.parse(jsonSet)
  }
}
