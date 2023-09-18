import {
  JSONFileSetDefinition,
  JSONFileSetStatement,
  JSONFileSetValidationError,
  JSONSetConstraints,
  JSONSetDefinition,
  JSONSETFileConstraints,
  JSONSetStatement,
  JSONSetValidationError,
} from './interfaces';

export class JSONSetValidator {
  validate(
    set: unknown[],
    setSchema: JSONSetDefinition
  ): JSONSetValidationError[] {
    throw new Error('Missing implementation');
  }

  protected __validate(
    target: unknown,
    constraints: JSONSetConstraints,
    path: string
  ): JSONSetValidationError[] {
    return [
      {
        path,
        message: 'Missing implementation of validation.',
      },
    ];
  }
}

export interface IFile {
  name: string;
  size: number;
  type: string;
}

export class FileJSONSetValidator extends JSONSetValidator {
  override validate(
    set: IFile[],
    setSchema: JSONFileSetDefinition
  ): JSONFileSetValidationError[] {

    const results: {
      statement: JSONSetStatement;
      validationResults: {
        filename: string;
        isTaken?: boolean;
        errors: JSONFileSetValidationError[];
      }[];
    }[] = [];

    for (const statement of setSchema.statements) {
      results.push(
        this.getValidFileNamesOfSelection(
          set,
          statement,
          [setSchema.name, statement.name].filter((a) => a).join('.')
        )
      );
    }

    return this.analyzeValidationResults(results);
  }

  override __validate(
    target: IFile,
    constraints: JSONSETFileConstraints,
    path: string
  ): JSONFileSetValidationError[] {
    if (!target) {
      return [
        {
          filename: '',
          path,
          message: 'target is null or undefined.',
        },
      ];
    }

    const errors: JSONFileSetValidationError[] = [];
    if (target) {
      if (constraints.file) {
        if (constraints.file.maxSize) {
          const size = this.convertFileString(constraints.file.maxSize);
          if (size && target.size > size) {
            errors.push({
              filename: target.name,
              path,
              constraint: 'maxSize',
              message: `File size is bigger than ${constraints.file.maxSize}`,
            });
          }
        }
      }

      if (constraints.extension && constraints.extension.length > 0) {
        if (
          !constraints.extension.find(
            (a) => target.name.indexOf(a) === target.name.length - a.length
          )
        ) {
          errors.push({
            filename: target.name,
            path,
            constraint: 'extension',
            message: `Extension does not match [${constraints.extension.join(
              ','
            )}]`,
          });
        }
      }

      if (constraints.mimeType && constraints.mimeType.length > 0) {
        if (!constraints.mimeType.includes(target.type)) {
          errors.push({
            filename: target.name,
            path,
            constraint: 'mimeType',
            message: `MIME-Type ${
              target.type
            } does not match [${constraints.mimeType.join(',')}].`,
          });
        }
      }

      if (constraints.namePattern) {
        const regex = new RegExp(constraints.namePattern);
        if (regex.exec(target.name) === null) {
          errors.push({
            filename: target.name,
            path,
            constraint: 'namePattern',
            message: `Filename ${target.name} does not match pattern ${constraints.namePattern}.`,
          });
        }
      }
    }

    return errors;
  }

  private convertFileString(fileString: string) {
    const matches =
      /\s*([0-9]+(?:\.?[0-9]+)?)\s?((?:B)|(?:KB)|(?:MB)|(?:TB))$/g.exec(
        fileString
      );
    if (!matches || matches.length < 3) {
      return undefined;
    }
    try {
      const size = Number(matches[1]);
      const label = matches[2];

      switch (label) {
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
  }

  private getValidFileNamesOfSelection(
    pool: IFile[],
    statement: JSONFileSetStatement,
    path: string
  ) {
    const result: {
      statement: JSONSetStatement;
      validationResults: {
        filename: string;
        isTaken?: boolean;
        errors: JSONFileSetValidationError[];
      }[];
    } = {
      statement,
      validationResults: [],
    };

    for (const file of pool) {
      if (statement.constraints) {
        const constraintsCheck: {
          filename: string;
          errors: JSONFileSetValidationError[];
        } = {
          filename: file.name,
          errors: [],
        };

        for (const ofElement of statement.constraints) {
          const errors = this.__validate(
            file,
            ofElement as JSONSETFileConstraints,
            path
          );

          // check if one of the constrains is correct
          if (errors.length === 0) {
            result.validationResults.push({
              filename: file.name,
              errors: [],
            });
            break;
          } else {
            constraintsCheck.errors = [...constraintsCheck.errors, ...errors];
          }
        }

        if (constraintsCheck.errors.length > 0) {
          result.validationResults.push(constraintsCheck);
        }
      }
    }

    return result;
  }

  private analyzeValidationResults(
    validations: {
      statement: JSONSetStatement;
      validationResults: {
        filename: string;
        isTaken?: boolean;
        errors: JSONFileSetValidationError[];
      }[];
    }[]
  ): JSONFileSetValidationError[] {
    let results: JSONFileSetValidationError[] = [];
    let quantity: {
      filename: string;
      score: number;
    }[] = this.calculateQuantityTable(validations);
    const takesTable: number[] = validations.map(
      (a) => a.statement.take ?? a.statement.takeMin ?? a.statement.takeMax ?? 0
    );

    const takeFileFromSet = (filename: string, takeIndex?: number) => {
      if (takeIndex === undefined) {
        const lengths = validations
          .map((a, i) => ({
            index: i,
            hasFileName:
              a.validationResults.find(
                (b) =>
                  b.errors.length === 0 && b.filename === filename && !b.isTaken
              ) !== undefined,
            length: a.validationResults.map(
              (a) => a.errors.length === 0 && !a.isTaken
            ).length,
          }))
          .filter((a, i) => a.hasFileName && takesTable[i] > 0);

        lengths.sort((a, b) => {
          if (a.length > b.length) {
            return 1;
          }
          if (a.length < b.length) {
            return -1;
          }
          return 0;
        });

        if (lengths.length > 0) {
          takeIndex = lengths[0].index;
        } else {
          takeIndex = -1;
        }
      }

      if (takeIndex > -1) {
        validations = validations.map((a) => ({
          ...a,
          validationResults: a.validationResults.map((a) => ({
            ...a,
            isTaken: a.filename === filename ? true : a.isTaken,
          })),
        }));
        takesTable[takeIndex]--;
      } else {
        // TODO check this
        validations = validations.map((a) => ({
          ...a,
          validationResults: a.validationResults.map((b) => ({
            ...b,
            isTaken: b.filename === filename ? true : b.isTaken,
          })),
        }));
      }

      quantity = this.calculateQuantityTable(validations);
    };

    const noRemainingTakesOrSets = () => {
      return (
        takesTable.filter((a) => a > 0).length === 0 ||
        quantity.filter((a) => a.score > 0).length === 0
      );
    };

    while (!noRemainingTakesOrSets()) {
      let setIndexWithExactOneFile = validations.findIndex(
        (a) =>
          a.validationResults.filter((a) => a.errors.length === 0).length === 1
      );

      // clear sets with only one file
      while (setIndexWithExactOneFile > -1) {
        const validFiles = validations[
          setIndexWithExactOneFile
        ].validationResults.filter((a) => a.errors.length === 0);
        const filename = validFiles[0].filename;
        takeFileFromSet(filename, setIndexWithExactOneFile);
        setIndexWithExactOneFile = validations.findIndex(
          (a) =>
            a.validationResults.filter(
              (a) => a.errors.length === 0 && !a.isTaken
            ).length === 1
        );
      }

      quantity.sort((a, b) => {
        if (a.score > b.score) {
          return 1;
        }
        if (a.score < b.score) {
          return -1;
        }
        return 0;
      });

      const lowestQuantity = quantity.find((a) => a.score > 0);
      if (lowestQuantity && lowestQuantity.score > 0) {
        takeFileFromSet(lowestQuantity.filename);
      }
    }

    // there are remaining takes. check type of takes
    for (let i = 0; i < takesTable.length; i++) {
      const numberOfTakes = takesTable[i];
      const statement = validations[i].statement;

      if (numberOfTakes > 0) {
        if (statement.take) {
          results.push({
            filename: '',
            path: statement.name,
            constraint: 'take',
            message: `There are ${numberOfTakes} missing files that meet the constraints.`,
          });
        } else if (statement.takeMin) {
          results.push({
            filename: '',
            path: statement.name,
            constraint: 'take',
            message: `There are ${numberOfTakes} missing files that meet the constraints.`,
          });
        } else if (statement.takeMax) {
          // success
          validations[i].validationResults = validations[
            i
          ].validationResults.map((a) => ({
            ...a,
            isTaken: true,
          }));
        }
      } else if (
        validations[i].validationResults.filter(
          (a) => a.errors.length === 0 && !a.isTaken
        ).length > 0
      ) {
        // no takes for this statement & remaining sets

        if (statement.take) {
          results.push({
            filename: '',
            path: statement.name,
            constraint: 'take',
            message: `Only ${statement.take} files may meet the constraints.`,
          });
        } else if (statement.takeMin) {
          validations[i].validationResults = validations[
            i
          ].validationResults.map((a) => ({
            ...a,
            isTaken: true,
          }));
        } else if (statement.takeMax) {
          // success
          results.push({
            filename: '',
            path: statement.name,
            constraint: 'take',
            message: `Max. ${statement.take} files may meet the constraints.`,
          });
        }
      } else if (
        validations[i].validationResults.filter(
          (a) => a.errors.length > 0 && !a.isTaken
        ).length > 0
      ) {
        validations[i].validationResults = validations[i].validationResults.map(
          (a) => ({
            ...a,
            isTaken: a.errors.length > 0 ? true : a.isTaken,
          })
        );
      }
    }

    const remainingErrors: JSONFileSetValidationError[] = validations.map((a) =>
      a.validationResults
        .filter((a) => a.errors.length > 0 && !a.isTaken)
        .map((b) => b.errors)
    ) as any;

    results = [...results, ...remainingErrors];

    return results;
  }

  private calculateQuantityTable(
    validations: {
      statement: JSONSetStatement;
      validationResults: {
        filename: string;
        isTaken?: boolean;
        errors: JSONFileSetValidationError[];
      }[];
    }[]
  ): {
    filename: string;
    score: number;
  }[] {
    const result: {
      filename: string;
      score: number;
    }[] = [];

    for (const validation of validations) {
      for (const validResult of validation.validationResults) {
        if (validResult.errors.length === 0) {
          const index = result.findIndex(
            (a) => a.filename === validResult.filename
          );
          if (index > -1) {
            if (validResult.isTaken) {
              result[index].score = 0;
            } else {
              result[index].score++;
            }
          } else {
            result.push({
              filename: validResult.filename,
              score: validResult.isTaken ? 0 : 1,
            });
          }
        }
      }
    }

    return result;
  }
}
