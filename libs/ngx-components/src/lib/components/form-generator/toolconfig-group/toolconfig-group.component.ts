import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfigurationControlGroup } from '../tool-configurator.component';
import { SubscriberComponent } from '@octra/ngx-utilities';

@Component({
  selector: 'octra-toolconfig-group',
  templateUrl: './toolconfig-group.component.html',
  styleUrls: ['./toolconfig-group.component.scss'],
})
export class ToolconfigGroupComponent extends SubscriberComponent {
  @Input() group?: ConfigurationControlGroup;
  @Output() somethingChanged = new EventEmitter<boolean>();

  onArrayItemDelete(control: any, i: number) {
    control.value = [
      ...control.value.slice(0, i),
      ...control.value.slice(i + 1),
    ];
    this.somethingChanged.emit();
  }

  onArrayItemAdd(control: any, values: any[]) {
    control.value = control.value ? [...control.value, ...values] : values;
    this.somethingChanged.emit();
  }
}
