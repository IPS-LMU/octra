import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { SubscriberComponent } from '@octra/ngx-utilities';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class DefaultComponent
  extends SubscriberComponent
  implements OnDestroy {}
