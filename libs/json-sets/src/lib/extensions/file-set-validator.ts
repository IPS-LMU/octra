import {
  DecisionTreeNode,
  JSONSet,
  JSONSetBlueprint,
  JSONSetResult,
  JsonSetValidator,
  PossibleSolution,
} from '../core';

export interface AudioFileMetaData {
  bitRate?: number;
  numberOfChannels?: number;
  duration?: { samples: number; seconds: number };
  sampleRate?: number;
  container?: string;
  codec?: string;
  lossless?: boolean;
}

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
  override validateItem(
    item: IFile,
    conditions: JSONSetFileConditions,
    combinationType: 'and' | 'or',
    path: string
  ): JSONSetResult[] {
    const args: [IFile, JSONSetFileConditions, 'and' | 'or', string] = [
      item,
      conditions,
      combinationType,
      path,
    ];

    return [
      this.validateFileSize(...args),
      this.validateContent(...args),
      this.validateNamePattern(...args),
      this.validateMimeType(...args),
      this.validateExtension(...args),
    ];
  }

  override areSolutionsEqual(
    solutionA: PossibleSolution<IFile, JSONSetFileConditions>,
    solutionB: PossibleSolution<IFile, JSONSetFileConditions>
  ): boolean {
    return (
      solutionA.selection.content === solutionB.selection.content &&
      solutionA.selection.type === solutionB.selection.type &&
      solutionA.selection.name === solutionB.selection.name
    );
  }

  override outputSolutions(
    possibleSolutions: PossibleSolution<IFile, JSONSetFileConditions>[][]
  ): string {
    return `${possibleSolutions.length} solutions: [${possibleSolutions
      .map((a) => `(${a.map((b) => b.selection.name).join(', ')})`)
      .join(', ')}]`;
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
        /^((?:>=?)|(?:<=?)|(?:=))?\s*([0-9]+\.?[0-9]*\s*(?:(?:B)|(?:KB)|(?:MB)|(?:GB)|(?:TB)))$/g.exec(
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
            return new JSONSetResult({
              valid: false,
              error: `File size condition not met by ${path}.`,
              path,
              combinationType,
            });
          }
        }

        if (matches[1] === '>=') {
          // min
          if (item.size < size) {
            return new JSONSetResult({
              valid: false,
              error: `File size condition not met by ${path}.`,
              path,
              combinationType,
            });
          }
        }

        if (matches[1] === '<=') {
          // max
          if (item.size > size) {
            return new JSONSetResult({
              valid: false,
              error: `File size condition not met by ${path}.`,
              path,
              combinationType,
            });
          }
        }

        if (matches[1] === '<') {
          // max
          if (item.size >= size) {
            return new JSONSetResult({
              valid: false,
              error: `File size condition not met by ${path}.`,
              path,
              combinationType,
            });
          }
        }

        if (matches[1] === '>') {
          // min
          if (item.size <= size) {
            return new JSONSetResult({
              valid: false,
              error: `File size condition not met by ${path}.`,
              path,
              combinationType,
            });
          }
        }
      }
    }

    return new JSONSetResult({
      valid: true,
      path,
      combinationType,
    });
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
          return new JSONSetResult({
            valid: true,
            path,
            combinationType,
          });
        }
      }

      return new JSONSetResult({
        valid: false,
        error: `File content type must be one of ${conditions.extension.join(
          ','
        )}.`,
        path,
        combinationType,
      });
    }
    return new JSONSetResult({
      valid: true,
      path,
      combinationType,
    });
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
      return new JSONSetResult({
        valid: false,
        error: `File content type must be one of ${conditions.content.join(
          ','
        )}.`,
        path,
        combinationType,
      });
    }

    return new JSONSetResult({
      valid: true,
      path,
      combinationType,
    });
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
      return new JSONSetResult({
        valid: false,
        error: `File name does not match pattern "${conditions.namePattern}".`,
        path,
        combinationType,
      });
    }

    return new JSONSetResult({
      valid: true,
      path,
      combinationType,
    });
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
      return new JSONSetResult({
        valid: false,
        error: `File type must be one of ${conditions.mimeType.join(',')}.`,
        path,
        combinationType,
      });
    }
    return new JSONSetResult({
      valid: true,
      path,
      combinationType,
    });
  }
}

export class FileSetValidator extends JsonSetValidator<
  IFile,
  JSONSetFileConditions
> {
  constructor(jsonSet: JSONSet<JSONSetFileConditions>) {
    super(jsonSet, new JSONSetFileBlueprint());
  }

  protected override parse(jsonSet: JSONSet<JSONSetFileConditions>) {
    this._decisionTree = DecisionTreeNode.json2tree<
      IFile,
      JSONSetFileConditions
    >(this._blueprint, jsonSet);
  }
}
