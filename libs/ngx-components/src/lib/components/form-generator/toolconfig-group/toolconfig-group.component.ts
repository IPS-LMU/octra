import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { QuestionMarkComponent } from '../../question-mark/question-mark.component';
import { ToolConfigArrayAdderComponent } from '../array-adder/toolconfig-array-adder.component';
import { ConfigurationControlGroup, OctraToolConfiguratorOptions } from '../tool-configurator.component';

@Component({
  selector: 'octra-toolconfig-group',
  templateUrl: './toolconfig-group.component.html',
  styleUrls: ['./toolconfig-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
  imports: [QuestionMarkComponent, NgStyle, FormsModule, NgClass, ToolConfigArrayAdderComponent, NgTemplateOutlet],
})
export class ToolconfigGroupComponent extends SubscriberComponent {
  @Input() group?: ConfigurationControlGroup;
  @Input() options!: OctraToolConfiguratorOptions;
  @Output() somethingChanged = new EventEmitter<void>();

  onArrayItemDelete(control: any, i: number) {
    control.value = [...control.value.slice(0, i), ...control.value.slice(i + 1)];
    control.value = control.value.length > 0 ? control.value : undefined;
    this.somethingChanged.emit();
  }

  onArrayItemAdd(control: any, values: any[]) {
    control.value = control.value ? [...control.value, ...values] : values;
    this.somethingChanged.emit();
  }
}
