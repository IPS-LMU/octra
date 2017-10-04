import {BugReporter} from './BugReporter';
import {Observable} from 'rxjs/Observable';
import {Headers, Http, RequestOptions, Response, URLSearchParams} from '@angular/http';
import {isArray} from 'rxjs/util/isArray';

export class MantisBugReporter extends BugReporter {
  constructor() {
    super();
    this._name = 'MantisBT';
  }

  public sendBugReport(http: Http, pkg: any, form: any, url: string, auth_token: string, sendbugreport: boolean): Observable<Response> {

    const report = (sendbugreport) ? this.getText(pkg) : '';

    const params = new URLSearchParams();

    let summary = form.description;
    if (summary.length > 100) {
      summary = summary.substr(0, 100) + '...';
    }

    const requestOptions = new RequestOptions();
    requestOptions.params = params;
    requestOptions.headers = new Headers();
    requestOptions.headers.set('Authorization', auth_token);

    const json = pkg;

    const body = {
      project: {
        id: 1
      },
      category: 'General',
      summary: summary,
      description: form.description,
      additional_information: 'Email: ' + form.email,
      os: json.system.os.name,
      os_build: json.system.os.version,
      platform: json.system.browser,
      version: json.octra.version
    };

    if (sendbugreport) {
      body['additional_information'] += '\n\n' + report;
    }

    return http.post(url, JSON.stringify(body), requestOptions);
  }

  public getTest(http: Http, url: string, auth_token: string) {
    const params = new URLSearchParams();
    const requestOptions = new RequestOptions();
    params.set('id', '10');
    requestOptions.params = params;
    requestOptions.headers = new Headers();
    requestOptions.headers.set('Authorization', auth_token);

    const body = {
      project: {
        id: 1
      }
    };

    return http.get(url, requestOptions);
  }

  public getText(pkg: any): string {
    let result = '';

    for (const attr in pkg) {
      if (pkg.hasOwnProperty(attr)) {
        if (!isArray(pkg[attr]) && typeof pkg[attr] === 'object') {
          result += attr + '\n';
          result += '---------\n';

          for (const attr2 in pkg[attr]) {
            if (pkg[attr].hasOwnProperty(attr2) && typeof pkg[attr][attr2] !== 'object' || pkg[attr][attr2] === null) {
              result += '  ' + attr2 + ':  ' + pkg[attr][attr2] + '\n';
            }
          }
        } else if (isArray(pkg[attr])) {
          result += attr + '\n';
          result += '---------\n';

          for (let i = 0; i < pkg[attr].length; i++) {
            if (typeof pkg[attr][i].message === 'string') {
              result += '  ' + pkg[attr][i].type + '  ' + pkg[attr][i].message + '\n';
            } else if (typeof pkg[attr][i].message === 'object') {
              result += '  ' + pkg[attr][i].type + '\n' + JSON.stringify(pkg[attr][i].message, null, 2) + '\n';
            }
          }
        }
        result += '\n';
      }
    }

    return result;
  }
}
