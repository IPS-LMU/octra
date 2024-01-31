import { Component, OnDestroy } from '@angular/core';
import { SubscriptionManager } from '@octra/utilities';
import { Observable, Subscription } from 'rxjs';

@Component({
  template: '',
})
export class SubscriberComponent implements OnDestroy {
  protected subscriptionManager = new SubscriptionManager<Subscription>();

  ngOnDestroy() {
    this.subscriptionManager.destroy();
  }

  /**
   * subscribes an observable that is internally added to the subscription manager and destroyed automatically on ngDestroy
   * @param observable
   * @param next
   * @param error
   * @param complete
   * @protected
   */
  protected subscribe<R, E>(
    observable: Observable<R>,
    next?: (result: R) => void,
    error?: (error: E) => void,
    complete?: () => void
  ) {
    this.subscriptionManager.add(
      observable.subscribe({
        next,
        error,
        complete,
      })
    );
  }
}
