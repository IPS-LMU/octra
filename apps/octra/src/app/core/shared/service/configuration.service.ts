import { Injectable } from '@angular/core';
import {Functions} from '../../../../../../../libs/utilities/src';
import {AppSettings} from '../../obj/Settings';
import * as Ajv from 'ajv';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  constructor(private http: HttpClient) { }

  private validateJSON(filename: string, json: any, schema: any): boolean {
    if (!(json === null || json === undefined) && !(schema === null || schema === undefined)) {
      const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
      const validate = ajv.compile(schema);
      const valid = validate(json);
      if (!valid) {
        for (const err in validate.errors) {
          if (validate.errors.hasOwnProperty(err)) {
            const errObj: any = (validate.errors['' + err + '']);
            if (errObj.hasOwnProperty('dataPath') && !(errObj.dataPath === null || errObj.dataPath === undefined)) {
              console.error(`JSON Validation Error (${filename}): ${errObj.dataPath} ${errObj.message}`);
            }
          }
        }
      } else {
        return true;
      }
    }
    return false;
  }

  public loadSettings(messages: any, urls: any, filenames: any, onvalidated: (obj: any) => void,
                       onerror: (error: string) => void) {
    if (
      messages.hasOwnProperty('loading') &&
      urls.hasOwnProperty('json') && urls.hasOwnProperty('schema') &&
      filenames.hasOwnProperty('json') && filenames.hasOwnProperty('schema')
    ) {
      Functions.uniqueHTTPRequest(this.http, false, null, urls.json, null).subscribe(
        (settings: any) => {
          Functions.uniqueHTTPRequest(this.http, false, null, urls.schema, null).subscribe(
            (schema) => {
              console.log(filenames.json + ' schema file loaded');

              const validationOK = this.validateJSON(filenames.json, settings, schema);

              if (validationOK) {
                onvalidated(settings);
              }
            },
            () => {
              console.error(filenames.schema + ' could not be loaded!');
            }
          )
        },
        () => {
          onerror('Loading ' + filenames.json + ' failed<br/>');
        }
      )
    } else {
      throw new Error('parameters of loadSettings() are not correct.');
    }
  }
}
