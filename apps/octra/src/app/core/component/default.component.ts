import { Component, OnDestroy } from '@angular/core';
import { SubscriberComponent } from '@octra/ngx-utilities';

@Component({
  template: '',
  standalone: true,
})
export class DefaultComponent
  extends SubscriberComponent
  implements OnDestroy {}
