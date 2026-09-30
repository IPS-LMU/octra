import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToolconfigBaseControlComponent } from '../base-control/octra-form-base-control';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'octra-form-number-control',
  templateUrl: './octra-form-number-control.component.html',
  styleUrls: ['./octra-form-number-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, NgbPopover],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OctraFormNumberControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OctraFormNumberControlComponent),
      multi: true,
    },
  ],
})
export class OctraFormNumberControlComponent extends ToolconfigBaseControlComponent<number> {
  @Input() type: 'number' | 'integer' = 'number';

  protected isEmpty(value: number | undefined | null): boolean {
    return value === undefined || value === null || (value as any) === '';
  }
}
