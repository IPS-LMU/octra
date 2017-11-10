import {Observable} from 'rxjs/Observable';
import {HttpClient} from '@angular/common/http';

export abstract class BugReporter {
  get name(): string {
    return this._name;
  }

  protected _name = '';

  public abstract sendBugReport(http: HttpClient, form: any, pkg: any, url: string, auth_token: string, sendbugreport: boolean): Observable<any>;

  public abstract getText(pkg: any): string;
}
