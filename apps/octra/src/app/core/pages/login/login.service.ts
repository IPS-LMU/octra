import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {SubscriptionManager} from '@octra/utilities';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';

@Injectable()
export class LoginService {
  private dbData: any[] = [];

  private subscrmanager: SubscriptionManager<Subscription>;

  constructor(private http: HttpClient, private store: Store) {
    this.subscrmanager = new SubscriptionManager<Subscription>();
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
