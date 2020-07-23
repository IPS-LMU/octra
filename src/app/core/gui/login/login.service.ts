import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {SubscriptionManager} from '@octra/components';

@Injectable()
export class LoginService {
  private dbData: any[] = [];

  private subscrmanager: SubscriptionManager;

  constructor(private http: HttpClient) {
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
