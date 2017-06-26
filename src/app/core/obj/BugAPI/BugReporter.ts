import {Observable} from 'rxjs/Observable';
import {Http, Response} from '@angular/http';

export abstract class BugReporter {
  get name(): string {
    return this._name;
  }

  protected _name = '';

  public abstract sendBugReport(http: Http, form: any, pkg: any, url: string, auth_token: string, sendbugreport: boolean): Observable<Response>;

  public abstract getText(pkg: any): string;
}
