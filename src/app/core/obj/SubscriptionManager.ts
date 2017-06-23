import {Subscription} from 'rxjs/Subscription';
import {isNullOrUndefined} from 'util';

export class SubscriptionManager {
  private subscriptions: {
    id: number,
    subscription: Subscription
  }[];

  private counter: number;

  constructor() {
    this.subscriptions = [];
    this.counter = 0;
  }

  public add(subscription: Subscription): number {
    this.subscriptions.push(
      {
        id: ++this.counter,
        subscription: subscription
      }
    );
    return this.counter;
  }

  public destroy() {
    if (!isNullOrUndefined(this.subscriptions)) {
      for (let i = 0; i < this.subscriptions.length; i++) {
        this.subscriptions[i].subscription.unsubscribe();
      }
      this.subscriptions = [];
    }
  }


  public remove(id: number): boolean {
    for (let i = 0; i < this.subscriptions.length; i++) {
      const element = this.subscriptions[i];

      if (element.id === id) {
        element.subscription.unsubscribe();
        this.subscriptions.splice(i, 1);
        return true;
      }
    }
    return false;
  }
}
