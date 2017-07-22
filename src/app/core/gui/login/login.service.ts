import {Injectable} from '@angular/core';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {Http} from '@angular/http';
import {ModalService} from '../../shared/service/modal.service';

@Injectable()
export class LoginService {
  private db_data: any[] = [];

  private subscrmanager: SubscriptionManager;

  constructor(private http: Http) {
    this.subscrmanager = new SubscriptionManager();
    this.subscrmanager.add(this.http.request('./config/allowed_users.json').subscribe(
      (result) => {
        this.db_data = result.json();
      },
      () => {
        console.error('allowed_users.json not found. Please create this file in a folder named \'config\'');
      }
    ));
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
