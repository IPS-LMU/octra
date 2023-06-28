import { Component, OnDestroy } from '@angular/core';
import { SubscriptionManager } from '@octra/utilities';

@Component({
  template: '',
})
export class DefaultComponent implements OnDestroy {
  protected subscrManager = new SubscriptionManager();

  ngOnDestroy() {
    this.subscrManager.destroy();
  }
}
