import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToolconfigBaseControlComponent } from '../base-control/toolconfig-base-control';

@Component({
  selector: 'octra-toolconfig-switch-control',
  templateUrl: './toolconfig-switch-control.component.html',
  styleUrls: ['./toolconfig-switch-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, NgClass],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToolconfigSwitchControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ToolconfigSwitchControlComponent),
      multi: true,
    },
  ],
})
export class ToolconfigSwitchControlComponent extends ToolconfigBaseControlComponent<boolean> {
  @Input() title?: string;
  @Input() showLabel?: boolean;

  protected isEmpty(value: boolean | undefined | null): boolean {
    return !value;
  }
}
