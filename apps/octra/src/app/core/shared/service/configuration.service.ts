import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {hasProperty, uniqueHTTPRequest} from '@octra/utilities';
import Ajv from 'ajv';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  constructor(private http: HttpClient) {
  }

  private validateJSON(filename: string, json: any, schema: any): boolean {
    if (!(json === undefined) && !(schema === undefined)) {
      const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
      const validate = ajv.compile(schema);
      const valid = validate(json);
      if (!valid) {
        for (const errObj of validate.errors) {
          console.error(`JSON Validation Error (${filename}): ${errObj.message}`);
        }
      } else {
        console.log(`${filename} is valid`);
        return true;
      }
    }
    return false;
  }

  public loadSettings(messages: any, urls: any, filenames: any, onvalidated: (obj: any) => void,
                      onerror: (error: string) => void) {
    if (
      hasProperty(messages, 'loading') &&
      hasProperty(urls, 'json') && hasProperty(urls, 'schema') &&
      hasProperty(filenames, 'json') && hasProperty(filenames, 'schema')
    ) {
      uniqueHTTPRequest(this.http, false, undefined, urls.json, undefined).subscribe(
        (settings: any) => {
          uniqueHTTPRequest(this.http, false, undefined, urls.schema, undefined).subscribe(
            (schema) => {
              console.log(filenames.json + ' schema file loaded');

              const validationOK = this.validateJSON(filenames.json, settings, schema);

              if (validationOK) {
                onvalidated(settings);
              } else {
                onerror(filenames.json + ' not valid');
              }
            },
            () => {
              onerror(filenames.schema + ' could not be loaded!');
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
