import {
  ComponentFactoryResolver,
  Directive,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewContainerRef,
} from '@angular/core';

import { SubscriptionManager } from '@octra/utilities';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[octraDynComponent]',
})
export class DynComponentDirective implements OnInit, OnDestroy {
  @Input() component: {
    id: number;
    class: any;
    instance: any;
  };

  @Output() initialized = new EventEmitter<{ id: number; instance: any }>();
  @Output() destroyed = new EventEmitter<{ id: number }>();

  private subscrManager = new SubscriptionManager<Subscription>();

  constructor(
    public viewContainerRef: ViewContainerRef,
    private _componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnInit(): void {
    const componentFactory =
      this._componentFactoryResolver.resolveComponentFactory(
        this.component.class
      );

    const viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();

    const comp = viewContainerRef.createComponent(componentFactory);

    if (
      comp !== undefined &&
      comp.instance !== undefined &&
      (comp.instance as any).initialized !== undefined
    ) {
      this.component.instance = comp.instance;
      this.subscrManager.add(
        this.component.instance.initialized.subscribe(() => {
          this.initialized.emit({
            id: this.component.id,
            instance: this.component.instance,
          });
        })
      );
      this.subscrManager.add(
        this.component.instance.destroyed.subscribe(() => {
          this.destroyed.emit({
            id: this.component.id,
          });
        })
      );
    } else {
      console.error(
        `can't resolve component of alert: comp ${this.component.class}`
      );
    }
  }

  ngOnDestroy() {
    this.subscrManager.destroy();
  }
}
