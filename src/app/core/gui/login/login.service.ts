import {Injectable} from '@angular/core';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class LoginService {
  private db_data: any[] = [];

  private subscrmanager: SubscriptionManager;

  constructor(private http: HttpClient) {
    this.subscrmanager = new SubscriptionManager();
  }

  public checkLoginData(user_name: string) {
    for (let i = 0; i < this.db_data.length; i++) {
      if (user_name === this.db_data[i].name) {
        return true;
      }
    }
    return false;
  }

  public destroy() {
    this.subscrmanager.destroy();
  }
}
