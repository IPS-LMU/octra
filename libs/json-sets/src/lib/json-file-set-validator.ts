import {
  ConstraintsChecks,
  JSONFileSetDefinition,
  JSONFileSetStatement,
  JSONSETFileConstraints,
  JSONValidationResult,
} from './interfaces';
import { JSONSetValidator } from './json-set-validator';

export interface IFile {
  name: string;
  size: number;
  type: string;
}

export interface ValidationTable {
  validations: {
    statement: JSONFileSetStatement;
    constraints: JSONSETFileConstraints;
    validations: {
      target: IFile;
      checks: ConstraintsChecks;
    }[];
    elementCapabilities: number;
  }[];
  constraintCapabilities: number[];
}

export class FileJSONSetValidator extends JSONSetValidator<
  IFile,
  JSONSETFileConstraints
> {
  override validate(
    set: IFile[],
    setSchema: JSONFileSetDefinition
  ): JSONValidationResult {
    const results: JSONValidationResult = {
      isValid: true,
      results: [],
    };

    for (const statement of setSchema.statements) {
      const table = this.createValidationTable(
        statement,
        set,
        statement.name ?? ''
      );

      let tableCopy = { ...table };

      const filesWithoutValidConstraints = tableCopy.constraintCapabilities
        .map((a, index) => ({
          index,
          value: a,
        }))
        .filter((a) => a.value < 1)
        .map((a) => a.index);

      if (filesWithoutValidConstraints.length > 0) {
        results.isValid = false;
        results.results.push({
          statement,
          validationResults: set
            .filter((a, index) => filesWithoutValidConstraints.includes(index))
            .map((a) => ({
              target: a,
              errors: [
                {
                  statement,
                  filename: a.name,
                  message: `No contraints match for file "${a.name}"`,
                  path: '',
                },
              ],
            })),
        });
        return results;
      }

      for (let i = 0; i < tableCopy.validations.length; i++) {
        const validation = tableCopy.validations[i];
        const capability = validation.elementCapabilities ?? 0;

        if (validation.constraints.take) {
          if (
            !this.compareNumber(
              validation.constraints.take,
              capability,
              statement.name ?? ''
            )
          ) {
            results.isValid = false;
            results.results.push({
              statement,
              validationResults: [
                {
                  errors: [
                    {
                      statement,
                      path: '',
                      filename: '',
                      message: `Can't take "${validation.constraints.take}” for constraint "${validation.constraints.name}": ${capability} options.`,
                    },
                  ],
                },
              ],
            });
          }
        }
      }
    }

    return results;
  }

  protected override _validate(
    statement: JSONFileSetStatement,
    target: IFile,
    constr: JSONSETFileConstraints,
    path: string
  ): ConstraintsChecks {
    const checks: ConstraintsChecks = {};

    if (constr?.extension) {
      if (
        !constr.extension.map((a) => target.name.indexOf(a) > -1).includes(true)
      ) {
        checks[constr.name + '.extension'] = {
          statement,
          filename: target.name,
          message: `Invalid extension. Extension must be one of ${constr.extension.join(
            ','
          )}.`,
          path,
        };
      } else {
        checks[constr.name + '.extension'] = true;
      }
    }

    if (constr?.mimeType) {
      if (
        !constr.mimeType.map((a) => target.type.indexOf(a) > -1).includes(true)
      ) {
        checks[constr.name + '.mimeType'] = {
          statement,
          filename: target.name,
          message: `Invalid MIME type. MIME type must be one of ${constr.mimeType.join(
            ','
          )}.`,
          path,
        };
      } else {
        checks[constr.name + '.mimeType'] = true;
      }
    }

    if (constr?.namePattern) {
      const regex = new RegExp(constr?.namePattern);
      const matches = regex.exec(target.name);
      if (!matches) {
        checks[constr.name + '.namePattern'] = {
          statement,
          filename: target.name,
          message: `Invalid filename. Filename must have the pattern ${constr.namePattern}.`,
          path,
        };
      } else {
        checks[constr.name + '.namePattern'] = true;
      }
    }

    if (constr?.file?.size) {
      const compareString = constr.file.size.replace(
        /([0-9]+\s*(?:B|KB|MB|GB|TB))/g,
        (g0, g1) => {
          if (g1) {
            return this.convertFileString(g1)?.toString() ?? 'undefined';
          }

          return g0;
        }
      );
      if (compareString.includes('undefined')) {
        checks[constr.name + '.file.size'] = {
          statement,
          filename: target.name,
          message: `Invalid file comparison string: ${compareString}`,
          path,
        };
      } else {
        if (!this.compareNumber(compareString, target.size, path)) {
          checks[constr.name + '.file.size'] = {
            statement,
            filename: target.name,
            message: `Invalid file size: ${compareString}`,
            path,
          };
        } else {
          checks[constr.name + '.file.size'] = true;
        }
      }
    }
    return checks;
  }

  public createValidationTable(
    statement: JSONFileSetStatement,
    elements: IFile[],
    path: string
  ): ValidationTable {
    const result: {
      validations: any[];
      constraintCapabilities: number[];
    } = {
      validations: [],
      constraintCapabilities: elements.map((a) => 0),
    };

    for (const constr of statement.constraints) {
      const row = [];
      let elementCapabilities = 0;

      for (let i = 0; i < elements.length; i++) {
        const target = elements[i];
        const checks = this._validate(statement, target, constr, path);
        row.push({
          target,
          checks,
        });
        elementCapabilities += this.areAllConstraintsValid(checks) ? 1 : 0;
        result.constraintCapabilities[i] += this.areAllConstraintsValid(checks)
          ? 1
          : 0;
      }

      result.validations.push({
        statement,
        constraints: constr,
        validations: row,
        elementCapabilities,
      });
    }

    return result;
  }

  private areAllConstraintsValid(checks: ConstraintsChecks) {
    return !Object.keys(checks).find((key) => checks[key] !== true);
  }

  public logTextValidationTable(
    table: ValidationTable,
    type: 'console' | 'csv'
  ): void {
    if (type === 'csv') {
      const header = `Constraints;${table.validations[0].validations
        .map((a) => a.target.name)
        .join(';')};ElementCapabilities;take`;

      const body: string[] = table.validations.map(
        (row, i) =>
          `${row.constraints.name ?? `constraints[${0}]`};${row.validations
            .map(
              (validation) =>
                `'${Object.keys(validation.checks)
                  .map((key) => (validation.checks[key] === true ? 1 : 0))
                  .join('')}'`
            )
            .join(';')};${row.elementCapabilities};${row.constraints.take}`
      );
      const lastRow = `__ConstrainttCapabilities__;${table.constraintCapabilities.join(
        ';'
      )}`;

      console.log(`${header}\n${body.join('\n')}\n${lastRow}`);
    } else {
      const lastItem: Record<string, string> = {
        Constraints: '__ConstraintCapabilities__',
      };

      for (let i = 0; i < table.validations[0].validations.length; i++) {
        const validation = table.validations[0].validations[i];
        lastItem[validation.target.name] =
          table.constraintCapabilities[i].toString();
      }
      lastItem['take'] = '';

      console.table([
        ...table.validations.map((a) => {
          const result: Record<string, string> = {};

          result['Constraints'] = a.constraints.name;

          for (const validation of a.validations) {
            result[validation.target.name] = `${Object.keys(validation.checks)
              .map((key) => (validation.checks[key] === true ? 1 : 0))
              .join('')}`;
          }

          result['ElementCapabilities'] = a.elementCapabilities.toString();
          result['take'] = a.constraints.take ?? '';

          return result;
        }),
        lastItem,
      ]);
    }
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

  compareNumber(comparison: string, num: number, path: string) {
    if (/[^0-9x<>=\s&|]/g.exec(comparison)) {
      throw new Error(
        `JSONSetValidator [path:${path}]: Invalid comparison string. String may only contain [0-9x<>= &|])`
      );
    }

    const matches = /((x\s*([<>]?=?))\s*[0-9]+\s*(&&|\|\|)?)+/g.exec(
      comparison
    );

    if (matches) {
      const script = `let x = ${num};
        ${comparison}`;

      try {
        return eval(script);
      } catch (e) {
        console.error(
          `FileSetValidator [path:${path}]: Invalid comparison: ${script}`
        );
        return false;
      }
    }

    return false;
  }
}
