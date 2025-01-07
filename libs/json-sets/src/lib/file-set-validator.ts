import {
  JSONSetBlueprint,
  JSONSetResult,
  PossibleSolution,
} from './decision-tree';
import { JSONSet } from './interfaces';
import { JsonSetValidator } from './json-set-validator';

export class IFile {
  name!: string;
  type?: string;
  content?: string;
  size?: number;
}

export class JSONSetFileConditions {
  size?: string;
  content?: string[];
  mimeType?: string[];
  extension?: string[];
  namePattern?: string;

  constructor(partial: JSONSetFileConditions) {
    this.size = partial.size;
    this.content = partial.content;
    this.mimeType = partial.mimeType;
    this.extension = partial.extension;
    this.namePattern = partial.namePattern;
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
      this.validateExtension,
      this.validateNamePattern,
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

  private convertFileString = (fileString: string) => {
    const matches =
      /\s*([0-9]+(?:\.?[0-9]+)?)\s*((?:B)|(?:KB)|(?:MB)|(?:GB)|(?:TB))$/g.exec(
        fileString
      );
    if (!matches || matches.length < 3) {
      return undefined;
    }
    try {
      const size = Number(matches[1]);
      const label = matches[2];

      switch (label) {
        case 'B':
          return size;
        case 'KB':
          return 1000 * size;
        case 'MB':
          return 1000000 * size;
        case 'GB':
          return 1000000000 * size;
        case 'TB':
          return 1000000000000 * size;
      }
    } catch (e) {
      return undefined;
    }

    return undefined;
  };

  private validateFileSize = (
    item: IFile,
    conditions: JSONSetFileConditions,
    combinationType: 'and' | 'or',
    path: string
  ) => {
    if (conditions.size && item.size) {
      const matches =
        /^((?:>=)|(?:<=)|(?:=))?\s*([0-9]+\.?[0-9]*\s*(?:(?:B)|(?:KB)|(?:MB)|(?:GB)|(?:TB)))$/g.exec(
          conditions.size
        );

      if (!matches) {
        throw new Error(
          `JSONFileSetValidationError: Invalid file size statement.`
        );
      }

      if (matches) {
        const size = this.convertFileString(matches[2])!;

        if (matches[1] === undefined || matches[1] === '=') {
          // exact
          if (item.size !== size) {
            return {
              valid: false,
              error: `File size condition not met by ${path}.`,
              path,
              combinationType,
            };
          }
        }

        if (matches[1] === '>=') {
          // min
          if (item.size < size) {
            return {
              valid: false,
              error: `File size condition not met by ${path}.`,
              path,
              combinationType,
            };
          }
        }

        if (matches[1] === '<=') {
          // max
          if (item.size > size) {
            return {
              valid: false,
              error: `File size condition not met by ${path}.`,
              path,
              combinationType,
            };
          }
        }
      }
    }

    return {
      valid: true,
      path,
      combinationType,
    };
  };

  private validateExtension(
    item: IFile,
    conditions: JSONSetFileConditions,
    combinationType: 'and' | 'or',
    path: string
  ): JSONSetResult {
    if (conditions.extension && conditions.extension.length > 0 && item.name) {
      for (const ext of conditions.extension) {
        if (new RegExp(`${ext.replace(/\./g, '\\.')}$`).exec(item.name)) {
          return {
            valid: true,
            path,
            combinationType,
          };
        }
      }

      return {
        valid: false,
        error: `File content type must be one of ${conditions.extension.join(
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

  private validateNamePattern(
    item: IFile,
    conditions: JSONSetFileConditions,
    combinationType: 'and' | 'or',
    path: string
  ): JSONSetResult {
    if (
      conditions.namePattern &&
      new RegExp(conditions.namePattern).exec(item.name) === null
    ) {
      return {
        valid: false,
        error: `File name does not match pattern "${conditions.namePattern}".`,
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
