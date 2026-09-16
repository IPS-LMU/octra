import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToolconfigBaseControlComponent } from '../base-control/toolconfig-base-control';

@Component({
  selector: 'octra-toolconfig-number-control',
  templateUrl: './toolconfig-number-control.component.html',
  styleUrls: ['./toolconfig-number-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToolconfigNumberControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ToolconfigNumberControlComponent),
      multi: true,
    },
  ],
})
export class ToolconfigNumberControlComponent extends ToolconfigBaseControlComponent<number> {
  @Input() type: 'number' | 'integer' = 'number';

  protected isEmpty(value: number | undefined | null): boolean {
    return value === undefined || value === null || (value as any) === '';
  }
}
