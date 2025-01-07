import { NgClass, NgStyle } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { QuestionMarkComponent } from '../../question-mark/question-mark.component';
import { ToolConfigArrayAdderComponent } from '../array-adder/toolconfig-array-adder.component';
import { ConfigurationControlGroup } from '../tool-configurator.component';

@Component({
  selector: 'octra-toolconfig-group',
  templateUrl: './toolconfig-group.component.html',
  styleUrls: ['./toolconfig-group.component.scss'],
  imports: [
    QuestionMarkComponent,
    NgStyle,
    FormsModule,
    NgClass,
    TranslocoPipe,
    ToolConfigArrayAdderComponent,
  ],
})
export class ToolconfigGroupComponent extends SubscriberComponent {
  @Input() group?: ConfigurationControlGroup;
  @Output() somethingChanged = new EventEmitter<void>();

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
