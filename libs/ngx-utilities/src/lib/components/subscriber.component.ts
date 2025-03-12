import { Component, OnDestroy } from '@angular/core';
import { SubscriptionManager } from '@octra/utilities';
import { Observable, Observer, Subscription } from 'rxjs';

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
   * @param observerOrNext
   * @param tag
   * @protected
   */
  protected subscribe<R, E>(
    observable: Observable<R>,
    observerOrNext?: Partial<Observer<R>> | ((value: R) => void),
    tag?: string,
  ): number {
    return this.subscriptionManager.add(
      observable.subscribe(observerOrNext),
      tag,
    );
  }
}
