import { JSONSetValidator } from './json-set-validator';
import {
  JSONSet,
  JSONSetExpression,
  JSONSetValidationError,
} from './interfaces';
import { sum } from '@octra/api-types';
import { JSONSetResult } from './decision-tree';

export interface IFile {
  name: string;
  content?: string;
  size: number;
  type: string;
}

type JSONSetResultGroup = JSONSetResult[] | JSONSetResultGroup[];
type logType = boolean | logType[];

export class FileJSONSetValidator extends JSONSetValidator {
  override validate(
    set: IFile[],
    setSchema: JSONSet
  ): JSONSetValidationError[] {
    return this.__validate(setSchema, set, [], set);
  }

  private __validate(
    setSchema: JSONSet,
    set: IFile[],
    parsedFiles: IFile[] = [],
    remainingFiles: IFile[] = []
  ): JSONSetValidationError[] {
    const result: JSONSetValidationError[] = [];
    const table: JSONSetResultGroup[][] = [];
    console.log(`validate group ${setSchema.group}:`);
    for (const file of remainingFiles) {
      table.push(
        this.validateFile(
          file,
          setSchema.combine.expressions,
          setSchema.combine.type
        )
      );
    }

    const convertFileToLogTableRow = (
      key: string,
      value: any,
      fileResults: JSONSetResultGroup[]
    ) => {
      const result: any = {};
      // foreach column
      for (const tableElementElement of fileResults) {
        // foreach result in column
        for (const tableElementElementElement of tableElementElement) {
          if (!Array.isArray(tableElementElementElement)) {
            const key = `${
              tableElementElementElement.statement?.select
            }x ${tableElementElementElement.statement?.name!}`;
            if (value[key] === undefined) {
              value[key] = 1;
            }

            // logic and for with attributes
            value[key] = value[key] && tableElementElementElement.valid ? 1 : 0;
          } else {
            convertFileToLogTableRow(key, value, [tableElementElementElement]);
          }
        }
      }

      return result;
    };

    const convertToLogTable = (table: JSONSetResultGroup[][]) => {
      const result: any = {};

      for (let i = 0; i < table.length; i++) {
        const tableElement = table[i];
        result[remainingFiles[i].name] = {};
        convertFileToLogTableRow(
          remainingFiles[i].name,
          result[remainingFiles[i].name],
          tableElement
        );
        result[remainingFiles[i].name]['sum'] = sum(
          Object.keys(result[remainingFiles[i].name]).map(
            (a) => result[remainingFiles[i].name][a]
          )
        );
      }

      result['sum'] = {};
      const header = Object.keys(result[Object.keys(result)[0]]).filter(
        (a) => a !== 'sum'
      );

      for (const headerElement of header) {
        result['sum'][headerElement] = sum(
          Object.keys(result)
            .filter((a) => a !== 'sum')
            .map((a) => result[a][headerElement])
        );
      }

      return result;
    };

    console.table(convertToLogTable(table));
    console.log(table);
    return result;
  }

  // validate each row of column
  private validateFile(
    file: IFile,
    statements: JSONSetExpression[],
    combinationType: 'and' | 'or',
    path = ''
  ): JSONSetResultGroup[] {
    const result: JSONSetResultGroup[] = [];

    for (const statement of statements) {
      const validationStatementTable: JSONSetResultGroup[] = [];

      if (statement instanceof JSONSet) {
        return this.validateFile(
          file,
          statement.combine.expressions,
          statement.combine.type,
          (path += `.${statement.group}`)
        );
      } else {
      }

      result.push(validationStatementTable);
    }

    return result;
  }
}
