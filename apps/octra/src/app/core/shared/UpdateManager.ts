import {isUnset, SubscriptionManager} from '@octra/utilities';
import {AppInfo} from '../../app.info';
import {IndexedDBManager} from '../obj/IndexedDBManager';

export class UpdateManager {
  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  constructor(private dbVersion: string) {
    this.dbVersion = dbVersion;
  }

  public destroy() {
    this.subscrmanager.destroy();
  }
}
