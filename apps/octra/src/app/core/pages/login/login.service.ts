import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { SubscriptionManager } from '@octra/utilities';
import { Subscription } from 'rxjs';

@Injectable()
export class LoginService {
  private http = inject(HttpClient);
  private store = inject(Store);

  private dbData: any[] = [];

  private subscrmanager: SubscriptionManager<Subscription>;

  constructor() {
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
