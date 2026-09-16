import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToolConfigArrayAdderComponent } from '../array-adder/toolconfig-array-adder.component';
import { ToolconfigBaseControlComponent } from '../base-control/toolconfig-base-control';

@Component({
  selector: 'octra-toolconfig-array-control',
  templateUrl: './toolconfig-array-control.component.html',
  styleUrls: ['./toolconfig-array-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgClass, ToolConfigArrayAdderComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToolconfigArrayControlComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ToolconfigArrayControlComponent),
      multi: true,
    },
  ],
})
export class ToolconfigArrayControlComponent extends ToolconfigBaseControlComponent<any[]> {
  @Input() itemsType?: 'text' | 'number' | 'integer';
  @Input() items?: any[];

  protected isEmpty(value: any[] | undefined | null): boolean {
    return value === undefined || value === null || value.length === 0;
  }

  onItemDelete(index: number): void {
    const updated = [...(this.value ?? []).slice(0, index), ...(this.value ?? []).slice(index + 1)];
    this.onValueChange(updated.length > 0 ? updated : undefined);
  }

  onItemsAdd(values: any[]): void {
    this.onValueChange(Array.from(new Set(this.value ? [...this.value, ...values] : values)));
  }
}
