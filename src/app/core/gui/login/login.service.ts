import {Injectable} from '@angular/core';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class LoginService {
  private dbData: any[] = [];

  private subscrmanager: SubscriptionManager;

  constructor(private http: HttpClient) {
    this.subscrmanager = new SubscriptionManager();
  }

  public checkLoginData(userName: string) {
    for (let i = 0; i < this.dbData.length; i++) {
      if (userName === this.dbData[i].name) {
        return true;
      }
    }
    return false;
  }

  public destroy() {
    this.subscrmanager.destroy();
  }
}
