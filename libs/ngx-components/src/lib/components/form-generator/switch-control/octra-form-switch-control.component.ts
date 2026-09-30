import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToolconfigBaseControlComponent } from '../base-control/octra-form-base-control';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'octra-form-switch-control',
  templateUrl: './octra-form-switch-control.component.html',
  styleUrls: ['./octra-form-switch-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, NgClass, NgbPopover],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OctraFormSwitchControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OctraFormSwitchControlComponent),
      multi: true,
    },
  ],
})
export class OctraFormSwitchControlComponent extends ToolconfigBaseControlComponent<boolean> {
  @Input() title?: string;
  @Input() showLabel?: boolean;

  protected isEmpty(value: boolean | undefined | null): boolean {
    return !value;
  }
}
