import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, FormsModule, NgForm } from '@angular/forms';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { FormGeneratorJSONSchema } from '@octra/utilities';
import Ajv from 'ajv';
import { ErrorObject } from 'ajv/dist/types';
import { timer } from 'rxjs';
import {
  ConfigurationArrayControl,
  ConfigurationControl,
  ConfigurationControlGroup,
  ConfigurationNumberControl,
  ConfigurationSelectControl,
  ConfigurationSwitchControl,
  ConfigurationTextControl,
} from './objects';
import { OctraFormGroupComponent } from './toolconfig-group/octra-form-group.component';

export class OctraToolConfiguratorOptions {
  labelPlacement: 'top' | 'left' = 'top';
  questionMarkVisibility: 'static' | 'onhover' = 'onhover';
  showToggles: 'static' | 'auto' | 'hide' = 'auto';

  constructor(partial?: Partial<OctraToolConfiguratorOptions>) {
    Object.assign(this, partial);
  }
}

@Component({
  selector: 'octra-form-configurator',
  templateUrl: './octra-form-configurator.component.html',
  styleUrls: ['./octra-form-configurator.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [OctraFormGroupComponent, FormsModule],
})
export class OctraFormConfiguratorComponent extends SubscriberComponent implements OnChanges, AfterViewInit {
  @Input() jsonSchema?: FormGeneratorJSONSchema;
  @Input() jsonText?: string;
  @Input() options = new OctraToolConfiguratorOptions();

  @Output() jsonTextChange = new EventEmitter<string>();
  @Output() validationChange = new EventEmitter<{
    valid: boolean;
    errors?: null | ErrorObject[];
  }>();
  @Output() ngSubmit = new EventEmitter<any>();

  @ViewChild('ngForm') ngForm!: NgForm;

  form?: ConfigurationControlGroup;
  json?: any;
  protected showToggles = false;
  private ownChange = false;

  get formTouched() {
    return this.ngForm?.touched ?? false;
  }

  private parse(
    schema: FormGeneratorJSONSchema,
    name: string,
    parent?: FormGeneratorJSONSchema,
    json?: any,
  ): (ConfigurationControl | ConfigurationControlGroup)[] {
    const result: (ConfigurationControl | ConfigurationControlGroup)[] = [];
    const jsonValue = name ? (json ? json[name] : undefined) : undefined;
    const toggleable: boolean = schema.toggleable ?? false;
    const dependsOn: string[] = schema.dependsOn ?? [];
    this.showToggles = this.showToggles || toggleable;

    if (schema.items) {
      const items = schema.items;
      const defaultValue = schema.default;
      if (typeof items === 'object') {
        const itemsDefinition = items as FormGeneratorJSONSchema;
        if (itemsDefinition.type === 'string') {
          const control = new ConfigurationArrayControl(
            name,
            {
              title: schema.title ?? name,
              type: 'array',
              value: jsonValue ?? defaultValue,
              defaultValue: defaultValue as string[],
              description: schema.description,
              ignore: false,
              context: itemsDefinition.enum,
              examples: itemsDefinition.examples,
              textAbove: itemsDefinition.textAbove,
              textBottom: itemsDefinition.textBottom,
              dependsOn: schema.dependsOn,
              toggleable: schema.toggleable,
              required: this.checkIfRequired(name, parent.required),
              schema,
            },
            this.form,
          );
          control.itemsType = 'text';

          control.toggled =
            this.options.showToggles === 'hide' || !control.toggleable || (json && name !== undefined && Object.keys(json).includes(name));
          result.push(control);
        } else if (itemsDefinition.type === 'number') {
          const control = new ConfigurationArrayControl(
            name,
            {
              title: schema.title ?? name,
              type: 'array',
              value: jsonValue ?? defaultValue,
              defaultValue: defaultValue as string[],
              description: schema.description,
              placeholder: schema.placeholder,
              examples: schema.examples,
              textAbove: schema.textAbove,
              textBottom: schema.textBottom,
              ignore: false,
              context: itemsDefinition.enum,
              dependsOn: schema.dependsOn,
              toggleable: schema.toggleable,
              required: this.checkIfRequired(name, parent.required),
              schema,
            },
            this.form,
          );
          control.itemsType = 'number';
          control.toggled =
            this.options.showToggles === 'hide' || !control.toggleable || (json && name !== undefined && Object.keys(json).includes(name));
          result.push(control);
        } else if (itemsDefinition.type === 'integer') {
          const control = new ConfigurationArrayControl(
            name,
            {
              title: schema.title ?? name,
              toggleable: schema.toggleable,
              type: 'array',
              value: jsonValue ?? defaultValue,
              examples: schema.examples,
              textAbove: schema.textAbove,
              textBottom: schema.textBottom,
              defaultValue: defaultValue as string[],
              description: schema.description,
              dependsOn: schema.dependsOn,
              ignore: false,
              context: itemsDefinition.enum,
              required: this.checkIfRequired(name, parent.required),
              schema,
            },
            this.form,
          );
          control.itemsType = 'integer';
          control.toggled = this.options.showToggles === 'hide' || !control.toggleable || (json && Object.keys(json).includes(name));
          result.push(control);
        }
      } else {
        // TODO add
        const t = '';
      }
    } else if (schema.properties) {
      // type = "object"
      const properties = schema.properties;
      const keys = Object.keys(properties);
      for (const key of keys) {
        const value = properties[key];

        if (value.properties) {
          const group = new ConfigurationControlGroup(
            key,
            {
              title: value.title,
              description: value.description,
              textAbove: schema.textAbove,
              textBottom: schema.textBottom,
            },
            this.parse(value, key, schema, json ? json[key] : undefined),
          );
          group.description = value.description;
          result.push(group);
        } else {
          result.push(...this.parse(value, key, schema, json));
        }
      }
    } else if (schema.type && name) {
      const defaultValue = schema.default;
      const enumValues: string[] = schema.enum as string[];
      const title: string = schema.title;
      const description: string = schema.description;
      const ignore = ['version', '$schema'].includes(name);

      if (schema.type === 'boolean') {
        const control = new ConfigurationSwitchControl(
          name,
          {
            title: title ?? name,
            value: jsonValue ?? defaultValue,
            defaultValue: defaultValue as boolean,
            examples: schema.examples,
            textAbove: schema.textAbove,
            textBottom: schema.textBottom,
            description,
            ignore,
            dependsOn,
            toggleable,
            required: this.checkIfRequired(name, parent.required),
            schema,
          },
          this.form,
        );
        control.toggled = this.options.showToggles === 'hide' || !control.toggleable || (json && Object.keys(json).includes(name));
        result.push(control);
      } else {
        if (enumValues && enumValues.length > 0) {
          const control: ConfigurationControl = new ConfigurationSelectControl(
            name,
            {
              title: title ?? name,
              value: jsonValue ?? defaultValue,
              defaultValue: defaultValue as string,
              examples: schema.examples,
              textAbove: schema.textAbove,
              textBottom: schema.textBottom,
              transformValue: schema.type as any,
              description,
              ignore,
              toggleable,
              dependsOn,
              context: enumValues?.map((a) => ({
                label: a,
                value: a,
              })),
              required: this.checkIfRequired(name, parent.required),
              schema,
            },
            this.form,
          );
          control.toggled = this.options.showToggles === 'hide' || !control.toggleable || (json && Object.keys(json).includes(name));
          result.push(control);
        } else if (schema.type === 'number') {
          const control = new ConfigurationNumberControl(
            name,
            {
              title: title ?? name,
              type: 'number',
              value: jsonValue ?? defaultValue,
              defaultValue: defaultValue as number,
              examples: schema.examples,
              textAbove: schema.textAbove,
              textBottom: schema.textBottom,
              description,
              dependsOn,
              toggleable,
              ignore,
              required: this.checkIfRequired(name, parent.required),
              schema,
            },
            this.form,
          );
          control.toggled = this.options.showToggles === 'hide' || !control.toggleable || (json && Object.keys(json).includes(name));
          result.push(control);
        } else if (schema.type === 'integer') {
          const control = new ConfigurationNumberControl(
            name,
            {
              title: title ?? name,
              type: 'integer',
              value: jsonValue ?? defaultValue,
              defaultValue: defaultValue as number,
              examples: schema.examples,
              textAbove: schema.textAbove,
              textBottom: schema.textBottom,
              description,
              ignore,
              toggleable,
              dependsOn,
              required: this.checkIfRequired(name, parent.required),
              schema,
            },
            this.form,
          );
          control.toggled = this.options.showToggles === 'hide' || !control.toggleable || (json && Object.keys(json).includes(name));
          result.push(control);
        } else if (schema.type === 'string') {
          const control = new ConfigurationTextControl(
            name,
            {
              title: title ?? name,
              value: jsonValue ?? defaultValue,
              defaultValue: defaultValue as string,
              examples: schema.examples,
              textAbove: schema.textAbove,
              textBottom: schema.textBottom,
              description,
              ignore,
              toggleable,
              dependsOn,
              placeholder: schema.placeholder,
              required: this.checkIfRequired(name, parent.required),
              schema,
            },
            this.form,
          );
          control.toggled = this.options.showToggles === 'hide' || !control.toggleable || (json && Object.keys(json).includes(name));
          result.push(control);
        }
      }
    }

    return result;
  }

  touchForm() {
    this.markControlsAsTouched(this.ngForm.form);
  }

  private markControlsAsTouched(control: AbstractControl): void {
    control.markAsTouched({ onlySelf: true });
    control.updateValueAndValidity({ onlySelf: true });

    if (control instanceof FormGroup || control instanceof FormArray) {
      Object.values(control.controls).forEach((child) => this.markControlsAsTouched(child));
    }
  }

  checkIfRequired(search: string, requiredArray: string[] | undefined) {
    return requiredArray !== undefined && requiredArray !== null && requiredArray.length > 0 && requiredArray.includes(search);
  }

  ngAfterViewInit() {
    this.onSomethingChanged();
  }

  ngOnChanges(changes: SimpleChanges<OctraFormConfiguratorComponent>): void {
    const schemaChange = changes['jsonSchema'];
    if (schemaChange) {
      const schema = schemaChange.currentValue;

      if (schema) {
        const name = schema.name ?? 'group';
        const group = new ConfigurationControlGroup(
          name,
          {
            title: schema.title ?? '',
            textBottom: schema.textBottom,
            textAbove: schema.textAbove,
          },
          [],
        );
        group.description = schema.description;
        this.form = group;
        group.controls = this.parse(schema, name, undefined, this.json);
      }
    }

    const jsonChange = changes['jsonText'];
    if (jsonChange && !this.ownChange) {
      const value = jsonChange.currentValue;

      if (!value) {
        this.json = undefined;
      } else {
        try {
          this.json = JSON.parse(value);
        } catch (e) {
          // ignore
        }
      }
      if (this.jsonSchema) {
        const name = this.jsonSchema.name ?? '';
        const group = new ConfigurationControlGroup(
          name,
          {
            title: this.jsonSchema.title ?? '',
            textBottom: this.jsonSchema.textBottom,
            textAbove: this.jsonSchema.textAbove,
          },
          [],
        );
        group.description = this.jsonSchema.description;
        this.form = group;
        group.controls = this.parse(this.jsonSchema, name, undefined, this.json);
      }
    } else if (this.ownChange) {
      this.ownChange = false;
    }
  }

  onSomethingChanged() {
    if (this.form) {
      const json = this.form.toObj();
      this.ownChange = true;
      this.jsonTextChange.emit(JSON.stringify(json, null, 2));

      this.subscribe(timer(0), {
        next: () => {
          const jsonValid = this.validateJSON(json, this.jsonSchema);
          this.validationChange.next(jsonValid);
        },
      });
    }
  }

  private validateJSON(
    json: any,
    schema: any,
  ): {
    valid: boolean;
    errors?: null | ErrorObject[];
  } {
    const ajv = new Ajv({ allErrors: true, strict: false }); // options can be passed, e.g. {allErrors: true}
    const validate = ajv.compile(schema);
    validate(json);

    return {
      valid: !validate.errors || validate.errors.length === 0,
      errors: validate.errors,
    };
  }
}
