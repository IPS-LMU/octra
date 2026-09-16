import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, FormsModule, NgForm } from '@angular/forms';
import { SubscriberComponent } from '@octra/ngx-utilities';
import Ajv from 'ajv';
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
import { ToolconfigGroupComponent } from './toolconfig-group/toolconfig-group.component';

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
  templateUrl: './tool-configurator.component.html',
  styleUrls: ['./tool-configurator.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ToolconfigGroupComponent, FormsModule],
})
export class ToolConfiguratorComponent extends SubscriberComponent implements OnChanges, AfterViewInit {
  @Input() jsonSchema?: any;
  @Input() jsonText?: string;
  @Input() options = new OctraToolConfiguratorOptions();

  @Output() jsonTextChange = new EventEmitter<string>();
  @Output() validationChange = new EventEmitter<{
    valid: boolean;
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

  private parse(schema: any, name: string, parent?: any, json?: any): (ConfigurationControl | ConfigurationControlGroup)[] {
    const result: (ConfigurationControl | ConfigurationControlGroup)[] = [];
    const jsonValue = name ? (json ? json[name] : undefined) : undefined;
    const toggleable: boolean = schema['toggleable'] ?? false;
    const dependsOn: string[] = schema['dependsOn'] ?? [];
    this.showToggles = this.showToggles || toggleable;

    if (schema['items']) {
      const items = schema['items'];
      const defaultValue = schema['default'];
      if (typeof items === 'object') {
        if (items['type'] === 'string') {
          const control = new ConfigurationArrayControl(
            name,
            {
              title: schema['title'] ?? name,
              type: 'array',
              value: jsonValue ?? defaultValue,
              defaultValue,
              description: schema['description'],
              ignore: false,
              context: items['enum'],
              dependsOn: schema['dependsOn'],
              toggleable: schema['toggleable'],
              required: this.checkIfRequired(name, parent['required']),
            },
            this.form,
          );
          control.itemsType = 'text';

          control.toggled =
            this.options.showToggles === 'hide' || !control.toggleable || (json && name !== undefined && Object.keys(json).includes(name));
          result.push(control);
        } else if (items['type'] === 'number') {
          const control = new ConfigurationArrayControl(
            name,
            {
              title: schema['title'] ?? name,
              type: 'array',
              value: jsonValue ?? defaultValue,
              defaultValue,
              description: schema['description'],
              ignore: false,
              context: items['enum'],
              dependsOn: schema['dependsOn'],
              toggleable: schema['toggleable'],
              required: this.checkIfRequired(name, parent['required']),
            },
            this.form,
          );
          control.itemsType = 'number';
          control.toggled =
            this.options.showToggles === 'hide' || !control.toggleable || (json && name !== undefined && Object.keys(json).includes(name));
          result.push(control);
        } else if (items['type'] === 'integer') {
          const control = new ConfigurationArrayControl(
            name,
            {
              title: schema['title'] ?? name,
              toggleable: schema['toggleable'],
              type: 'array',
              value: jsonValue ?? defaultValue,
              defaultValue,
              description: schema['description'],
              dependsOn: schema['dependsOn'],
              ignore: false,
              context: items['enum'],
              required: this.checkIfRequired(name, parent['required']),
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
    } else if (schema['properties']) {
      // type = "object"
      const properties = schema['properties'];
      const keys = Object.keys(properties);
      for (const key of keys) {
        const value = properties[key];

        if (value['properties']) {
          const group = new ConfigurationControlGroup(value['title'], key, this.parse(value, key, schema, json ? json[key] : undefined));
          group.description = value['description'];
          result.push(group);
        } else {
          result.push(...this.parse(value, key, schema, json));
        }
      }
    } else if (schema['type'] && name) {
      const defaultValue = schema['default'];
      const enumValues: string[] = schema['enum'];
      const title: string = schema['title'];
      const description: string = schema['description'];
      const ignore = ['version', '$schema'].includes(name);

      if (schema['type'] === 'boolean') {
        const control = new ConfigurationSwitchControl(
          name,
          {
            title: title ?? name,
            value: jsonValue ?? defaultValue,
            defaultValue,
            description,
            ignore,
            dependsOn,
            toggleable,
            required: this.checkIfRequired(name, parent['required']),
          },
          this.form,
        );
        control.toggled = this.options.showToggles === 'hide' || !control.toggleable || (json && Object.keys(json).includes(name));
        result.push(control);
      } else if (schema['type'] === 'number') {
        const control = new ConfigurationNumberControl(
          name,
          {
            title: title ?? name,
            type: 'number',
            value: jsonValue ?? defaultValue,
            defaultValue,
            description,
            dependsOn,
            toggleable,
            ignore,
            required: this.checkIfRequired(name, parent['required']),
          },
          this.form,
        );
        control.toggled = this.options.showToggles === 'hide' || !control.toggleable || (json && Object.keys(json).includes(name));
        result.push(control);
      } else if (schema['type'] === 'integer') {
        const control = new ConfigurationNumberControl(
          name,
          {
            title: title ?? name,
            type: 'integer',
            value: jsonValue ?? defaultValue,
            defaultValue,
            description,
            ignore,
            toggleable,
            dependsOn,
            required: this.checkIfRequired(name, parent['required']),
          },
          this.form,
        );
        control.toggled = this.options.showToggles === 'hide' || !control.toggleable || (json && Object.keys(json).includes(name));
        result.push(control);
      } else if (schema['type'] === 'string') {
        let control: ConfigurationControl = new ConfigurationSelectControl(
          name,
          {
            title: title ?? name,
            value: jsonValue ?? defaultValue,
            defaultValue,
            description,
            ignore,
            toggleable,
            dependsOn,
            context: enumValues?.map((a) => ({
              label: a,
              value: a,
            })),
            required: this.checkIfRequired(name, parent['required']),
          },
          this.form,
        );
        control.toggled = this.options.showToggles === 'hide' || !control.toggleable || (json && Object.keys(json).includes(name));

        if (enumValues) {
          // select
          result.push(control);
        } else {
          control = new ConfigurationTextControl(
            name,
            {
              title: title ?? name,
              value: jsonValue ?? defaultValue,
              defaultValue,
              description,
              ignore,
              toggleable,
              dependsOn,
              required: this.checkIfRequired(name, parent['required']),
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

  ngOnChanges(changes: SimpleChanges): void {
    const schemaChange = changes['jsonSchema'];
    if (schemaChange) {
      const schema = schemaChange.currentValue;

      if (schema) {
        const name = schema['name'] ?? '';
        const group = new ConfigurationControlGroup(schema['title'] ?? '', name, []);
        group.description = schema['description'];
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
        const name = this.jsonSchema['name'] ?? '';
        const group = new ConfigurationControlGroup(this.jsonSchema['title'] ?? '', name, []);
        group.description = this.jsonSchema['description'];
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
          this.validationChange.next({
            valid: this.ngForm.valid && jsonValid,
          });
        },
      });
    }
  }

  private validateJSON(json: any, schema: any) {
    const ajv = new Ajv({ allErrors: true, strict: false }); // options can be passed, e.g. {allErrors: true}
    const validate = ajv.compile(schema);
    validate(json);
    return !validate.errors || validate.errors.length === 0;
  }
}
