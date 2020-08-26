import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {SubscriptionManager} from '@octra/utilities';
import {Store} from '@ngrx/store';
import {URLParameters} from '../../store';
import * as LoginActions from '../../store/login/login.actions';

@Injectable()
export class LoginService {
  private dbData: any[] = [];

  private subscrmanager: SubscriptionManager;

  constructor(private http: HttpClient, private store: Store) {
    this.subscrmanager = new SubscriptionManager();
  }

  public checkLoginData(userName: string) {
    for (const dbelement of this.dbData) {
      if (userName === dbelement.name) {
        return true;
      }
    }
    return false;
  }

  public destroy() {
    this.subscrmanager.destroy();
  }
}
