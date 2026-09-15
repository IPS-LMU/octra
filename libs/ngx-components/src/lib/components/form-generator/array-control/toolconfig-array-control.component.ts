import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { ToolConfigArrayAdderComponent } from '../array-adder/toolconfig-array-adder.component';

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
export class ToolconfigArrayControlComponent implements ControlValueAccessor, Validator, OnChanges {
  @Input() itemsType?: 'text' | 'number' | 'integer';
  @Input() items?: any[];
  @Input() required?: boolean;

  protected value?: any[];
  protected disabled = false;

  private onChange: (value: any[] | undefined) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['required']) {
      this.onValidatorChange();
    }
  }

  writeValue(value: any[] | undefined): void {
    this.value = value;
  }

  registerOnChange(fn: (value: any[] | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const value: any[] | undefined | null = control.value;
    if (this.required && (value === undefined || value === null || value.length === 0)) {
      return { required: true };
    }
    return null;
  }

  onItemDelete(index: number): void {
    const updated = [...(this.value ?? []).slice(0, index), ...(this.value ?? []).slice(index + 1)];
    this.value = updated.length > 0 ? updated : undefined;
    this.onChange(this.value);
    this.onTouched();
  }

  onItemsAdd(values: any[]): void {
    this.value = Array.from(new Set(this.value ? [...this.value, ...values] : values));
    this.onChange(this.value);
    this.onTouched();
  }
}
