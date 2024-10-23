import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Ajv, { ErrorObject } from 'ajv';

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  constructor(private http: HttpClient) {}

  public validateJSON(
    json: any,
    schema: any
  ): ErrorObject<string, Record<string, any>, unknown>[] {
    if (!(json === undefined) && !(schema === undefined)) {
      const ajv = new Ajv({ allErrors: true, strict: 'log' }); // options can be passed, e.g. {allErrors: true}
      const validate = ajv.compile(schema);
      validate(json);
      return validate.errors ?? [];
    } else {
      throw new Error(`Appconfig or schema undefined!`);
    }
  }
}
