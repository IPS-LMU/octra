import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {isArray} from 'rxjs/internal-compatibility';
import {BugReporter} from './BugReporter';
import {getProperties} from '@octra/utilities';

export class EmailBugReporter extends BugReporter {
  constructor() {
    super();
    this._name = 'Email';
  }

  public sendBugReport(http: HttpClient, pkg: any, form: any, url: string,
                       authToken: string, sendbugreport: boolean, screenshots: {
      blob: File
    }[]): Observable<HttpResponse<any>> {

    const report = (sendbugreport) ? JSON.parse(JSON.stringify(pkg)) : undefined;

    const json = pkg;

    const body = {
      description: form.description,
      additional_information: {
        email: form.email,
        name: form.name
      },
      os: json.system.os.name,
      os_build: json.system.os.version,
      platform: json.system.browser,
      version: json.octra.version,
      report
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(body));

    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i];
      formData.append('file' + i, screenshot.blob, screenshot.blob.name);
    }

    return http.post(url, formData, {
      headers: {
        Authorization: authToken
      },
      observe: 'response',
      responseType: 'json'
    });
  }

  public getText(pkg: any): string {
    let result = '';

    for (const [name, value] of getProperties(pkg)) {
      if (!isArray(value) && typeof value === 'object') {
        result += name + '\n';
        result += '---------\n';

        for (const [name2, value2] of getProperties(value)) {
          if (typeof value2 !== 'object' || value2 === undefined) {
            result += '  ' + name2 + ':  ' + value2 + '\n';
          }
        }
      } else if (isArray(value)) {
        result += name + '\n';
        result += '---------\n';

        for (const [name2, value2] of getProperties(value)) {
          if (typeof value2.message === 'string') {
            result += '  ' + value2.type + '  ' + value2.message + '\n';
          } else if (typeof value2.message === 'object') {
            result += '  ' + value2.type + '\n' + JSON.stringify(value2.message, undefined, 2) + '\n';
          }
        }
      }
      result += '\n';
    }

    return result;
  }
}
