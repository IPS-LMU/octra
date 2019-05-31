import {Subscription} from 'rxjs';

/*
If you are using subscriptions in a component these should always be unsubscribed when the component is destroyed.
In order to make it easier to handle subscriptions this class can be used.

How to use it:

1.) Create an private attribute "private subscrManager = new SubscriptionManager();" in your component
2.) Wrap your subscription calls in:
    this.subscrManager.add(someObservable.subscribe(()=>{
      // some code
    }));
3.) Implement OnDestroy and ngOnDestroy function like that:
    ngOnDestroy(){
      this.subscrManager.destroy();
    }
4.) That's all! This is a easy and secure way to handle Subscriptions :)
 */
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

  /**
   * add subscription to the manager. Returns the id of the subscriptions
   * @returns number
   */
  public add(subscription: Subscription): number {
    this.subscriptions.push(
      {
        id: ++this.counter,
        subscription
      }
    );
    return this.counter;
  }

  /**
   * unsubscribes all subscriptions
   */
  public destroy() {
    if (!(this.subscriptions === null || this.subscriptions === undefined)) {
      for (let i = 0; i < this.subscriptions.length; i++) {
        this.subscriptions[i].subscription.unsubscribe();
      }
      this.subscriptions = [];
    }
  }

  /**
   * unsubscribes specific Subscription with specific id.
   */
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
