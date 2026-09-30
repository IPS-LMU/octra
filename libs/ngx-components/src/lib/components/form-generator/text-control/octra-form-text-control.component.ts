import { ChangeDetectionStrategy, Component, forwardRef, ViewChild } from '@angular/core';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToolconfigBaseControlComponent } from '../base-control/octra-form-base-control';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'octra-form-text-control',
  templateUrl: './octra-form-text-control.component.html',
  styleUrls: ['./octra-form-text-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, NgbPopover],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OctraFormTextControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OctraFormTextControlComponent),
      multi: true,
    },
  ],
})
export class OctraFormTextControlComponent extends ToolconfigBaseControlComponent<string> {
  @ViewChild(NgbPopover) private popover?: NgbPopover;

  protected isEmpty(value: string | undefined | null): boolean {
    return value === undefined || value === null || value === '';
  }
}
