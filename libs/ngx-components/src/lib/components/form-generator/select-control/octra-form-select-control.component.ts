import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core';
import { FormsModule, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToolconfigBaseControlComponent } from '../base-control/octra-form-base-control';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'octra-form-select-control',
  templateUrl: './octra-form-select-control.component.html',
  styleUrls: ['./octra-form-select-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, NgbPopover, NgStyle],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OctraFormSelectControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OctraFormSelectControlComponent),
      multi: true,
    },
  ],
})
export class OctraFormSelectControlComponent extends ToolconfigBaseControlComponent<string> {
  @Input() items?: { label: string; value: string }[];

  protected isEmpty(value: string | undefined | null): boolean {
    return value === undefined || value === null || value === '';
  }
}
