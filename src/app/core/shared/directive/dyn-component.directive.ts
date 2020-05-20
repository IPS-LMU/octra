import {ComponentFactoryResolver, Directive, EventEmitter, Input, OnInit, Output, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appDynComponent]'
})
export class DynComponentDirective implements OnInit {
  @Input() component: {
    id: number;
    class: any;
    instance: any;
  };

  @Output() initialized = new EventEmitter<{ id: number; instance: any; }>();
  @Output() destroyed = new EventEmitter<{ id: number; }>();

  constructor(public viewContainerRef: ViewContainerRef, private _componentFactoryResolver: ComponentFactoryResolver) {
  }

  ngOnInit(): void {
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory(this.component.class);

    const viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();

    const comp = viewContainerRef.createComponent(componentFactory);
    this.component.instance = comp.instance;
    this.component.instance.initialized.subscribe(() => {
      this.initialized.emit({
        id: this.component.id,
        instance: this.component.instance
      });
    });
    this.component.instance.destroyed.subscribe(() => {
      this.destroyed.emit({
        id: this.component.id
      });
    });
  }
}
