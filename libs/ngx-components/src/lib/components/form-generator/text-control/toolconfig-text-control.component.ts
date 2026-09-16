import { ChangeDetectionStrategy, Component, forwardRef, ViewChild } from '@angular/core';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToolconfigBaseControlComponent } from '../base-control/toolconfig-base-control';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'octra-toolconfig-text-control',
  templateUrl: './toolconfig-text-control.component.html',
  styleUrls: ['./toolconfig-text-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, NgbPopover],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToolconfigTextControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ToolconfigTextControlComponent),
      multi: true,
    },
  ],
})
export class ToolconfigTextControlComponent extends ToolconfigBaseControlComponent<string> {
  @ViewChild(NgbPopover) private popover?: NgbPopover;

  protected isEmpty(value: string | undefined | null): boolean {
    return value === undefined || value === null || value === '';
  }
}
