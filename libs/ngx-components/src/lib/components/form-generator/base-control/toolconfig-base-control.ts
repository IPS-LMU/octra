import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';

@Directive()
export abstract class ToolconfigBaseControlComponent<T> implements ControlValueAccessor, Validator, OnChanges {
  @Input() id?: string;
  @Input() name?: string;
  @Input() required?: boolean;

  protected value?: T;
  protected disabled = false;

  private onChange: (value: T | undefined) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['required']) {
      this.onValidatorChange();
    }
  }

  writeValue(value: T | undefined): void {
    this.value = value;
  }

  registerOnChange(fn: (value: T | undefined) => void): void {
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
    if (this.required && this.isEmpty(control.value)) {
      return { required: true };
    }
    return null;
  }

  protected onValueChange(value: T | undefined): void {
    this.value = value;
    this.onChange(this.value);
    this.onTouched();
  }

  protected markAsTouched(): void {
    this.onTouched();
  }

  protected abstract isEmpty(value: T | undefined | null): boolean;
}
