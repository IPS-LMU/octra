import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToolconfigBaseControlComponent } from '../base-control/toolconfig-base-control';

@Component({
  selector: 'octra-toolconfig-select-control',
  templateUrl: './toolconfig-select-control.component.html',
  styleUrls: ['./toolconfig-select-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToolconfigSelectControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ToolconfigSelectControlComponent),
      multi: true,
    },
  ],
})
export class ToolconfigSelectControlComponent extends ToolconfigBaseControlComponent<string> {
  @Input() items?: { label: string; value: string }[];

  protected isEmpty(value: string | undefined | null): boolean {
    return value === undefined || value === null || value === '';
  }
}
