import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { ControlContainer, FormsModule, NgForm } from '@angular/forms';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { isNumber } from '@octra/utilities';
import { QuestionMarkComponent } from '../../question-mark/question-mark.component';
import { OctraFormArrayControlComponent } from '../array-control/octra-form-array-control.component';
import { OctraFormNumberControlComponent } from '../number-control/octra-form-number-control.component';
import { ConfigurationControl, ConfigurationControlGroup } from '../objects';
import { OctraFormSelectControlComponent } from '../select-control/octra-form-select-control.component';
import { OctraFormSwitchControlComponent } from '../switch-control/octra-form-switch-control.component';
import { OctraFormTextControlComponent } from '../text-control/octra-form-text-control.component';
import { OctraToolConfiguratorOptions } from '../octra-form-configurator.component';

@Component({
  selector: 'octra-form-group',
  templateUrl: './octra-form-group.component.html',
  styleUrls: ['./octra-form-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
  imports: [
    QuestionMarkComponent,
    NgStyle,
    FormsModule,
    NgClass,
    OctraFormArrayControlComponent,
    OctraFormSelectControlComponent,
    OctraFormSwitchControlComponent,
    OctraFormNumberControlComponent,
    OctraFormTextControlComponent,
    NgTemplateOutlet,
  ],
  // Bridges the ancestor <form>'s NgForm into this component's view: NgModel injects its
  // ControlContainer parent with @Host(), which stops at the component boundary, so without
  // this the inputs here would never register with the outer NgForm and it would stay "valid".
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: NgForm,
    },
  ],
})
export class OctraFormGroupComponent extends SubscriberComponent implements OnChanges {
  @Input() group?: ConfigurationControlGroup;
  @Input() showToggles = false;
  @Input() options!: OctraToolConfiguratorOptions;
  @Output() somethingChanged = new EventEmitter<void>();

  private elRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  firstVisibleControl = -1;

  constructor() {
    super();
    if (this.elRef) {
      this.renderer.addClass(this.elRef.nativeElement, 'ocf-control-group');
    }
  }

  ngOnChanges(changes: SimpleChanges<OctraFormGroupComponent>) {
    const group = changes.group;
    if (group && group.currentValue) {
      this.firstVisibleControl = group.currentValue.controls.findIndex((a) => !a.ignore && a.type !== 'group');
    }
  }

  onSelectChanged(value: string, control: ConfigurationControl) {
    if (control.transformValue) {
      try {
        if (typeof control.transformValue === 'function') {
          control.value = control.transformValue(value);
        } else {
          if (['number', 'integer'].includes(control.transformValue)) {
            control.value = isNumber(value) ? Number(value) : undefined;
          } else {
            control.value = value;
          }
        }
      } catch (e) {
        control.value = value;
        console.error(e);
      }
    }
  }
}
