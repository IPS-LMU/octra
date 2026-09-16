import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import Ajv from 'ajv';
import { JSONSchema7 } from 'json-schema';

@Directive()
export abstract class ToolconfigBaseControlComponent<T> implements ControlValueAccessor, Validator, OnChanges {
  @Input() id?: string;
  @Input() name?: string;
  @Input() required?: boolean;
  @Input() schema?: JSONSchema7;

  protected value?: T;
  protected disabled = false;
  protected touched = false;
  protected errors: ValidationErrors | null = null;

  private onChange: (value: T | undefined) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  protected get errorMessages(): string[] {
    if (!this.errors) {
      return [];
    }

    return Object.entries(this.errors).map(([keyword, validation]) => validation.message);
  }

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
    this.touched = this.touched || control.touched;
    this.errors =
      this.required && this.isEmpty(control.value)
        ? {
            required: {
              message: 'This field is required',
            },
          }
        : this.validateJSONSchema();
    this.onValidationStateChange();

    return this.errors;
  }

  protected onValueChange(value: T | undefined): void {
    this.value = value;
    this.onChange(this.value);
    this.onTouched();
  }

  protected markAsTouched(): void {
    this.touched = true;
    this.onTouched();
    this.onValidationStateChange();
  }

  // Hook for subclasses that need to react immediately (e.g. open/close an error popover)
  // whenever touched or errors change, since blur doesn't trigger validate() on its own.
  protected onValidationStateChange(): void {}

  protected abstract isEmpty(value: T | undefined | null): boolean;

  protected validateJSONSchema(): null | ValidationErrors {
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(this.schema);
    validate(this.value);

    if (validate.errors) {
      const result: ValidationErrors = {};
      validate.errors.forEach((a) => {
        result[a.keyword] = {
          message: a.message,
          params: a.params,
        };
      });
      return result;
    }

    return null;
  }
}
