import {Observable} from 'rxjs/Observable';
import {HttpClient} from '@angular/common/http';

export abstract class BugReporter {
  protected _name = '';

  get name(): string {
    return this._name;
  }

  public abstract sendBugReport(
    http: HttpClient, form: any, pkg: any, url: string, authToken: string, sendbugreport: boolean
  ): Observable<any>;

  public abstract getText(pkg: any): string;
}
