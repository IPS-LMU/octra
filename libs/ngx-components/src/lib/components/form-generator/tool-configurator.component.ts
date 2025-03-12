import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { ToolconfigGroupComponent } from './toolconfig-group/toolconfig-group.component';

@Component({
  selector: 'octra-form-configurator',
  templateUrl: './tool-configurator.component.html',
  styleUrls: ['./tool-configurator.component.scss'],
  imports: [ToolconfigGroupComponent],
})
export class ToolConfiguratorComponent
  extends SubscriberComponent
  implements OnChanges
{
  @Input() jsonSchema?: any;
  @Input() jsonText?: string;
  form?: ConfigurationControlGroup;
  json?: any;
  private ownChange = false;

  @Output() jsonTextChange = new EventEmitter<string>();

  private parse(
    schema: any,
    json?: any,
    name?: string,
  ): (ConfigurationControl | ConfigurationControlGroup)[] {
    const result: (ConfigurationControl | ConfigurationControlGroup)[] = [];
    const jsonValue = name ? (json ? json[name] : undefined) : undefined;
    const toggleable: boolean = schema['toggleable'] ?? false;
    const dependsOn: string[] = schema['dependsOn'] ?? [];

    if (schema['items']) {
      const items = schema['items'];
      const defaultValue = schema['default'];
      if (typeof items === 'object') {
        if (items['type'] === 'string') {
          const control = new ConfigurationArrayControl(
            name!,
            {
              title: schema['title'] ?? name,
              type: 'text',
              value: jsonValue ?? defaultValue,
              defaultValue,
              description: schema['description'],
              ignore: false,
              context: items['enum'],
              dependsOn: schema['dependsOn'],
              toggleable: schema['toggleable'],
            },
            this.form,
          );

          control.toggled =
            json && name !== undefined && Object.keys(json).includes(name);
          result.push(control);
        } else if (items['type'] === 'number') {
          const control = new ConfigurationArrayControl(
            name!,
            {
              title: schema['title'] ?? name,
              type: 'number',
              value: jsonValue ?? defaultValue,
              defaultValue,
              description: schema['description'],
              ignore: false,
              context: items['enum'],
              dependsOn: schema['dependsOn'],
              toggleable: schema['toggleable'],
            },
            this.form,
          );
          control.toggled =
            json && name !== undefined && Object.keys(json).includes(name);
          result.push(control);
        } else if (items['type'] === 'integer') {
          const control = new ConfigurationArrayControl(
            name!,
            {
              title: schema['title'] ?? name,
              toggleable: schema['toggleable'],
              type: 'integer',
              value: jsonValue ?? defaultValue,
              defaultValue,
              description: schema['description'],
              dependsOn: schema['dependsOn'],
              ignore: false,
              context: items['enum'],
            },
            this.form,
          );
          control.toggled =
            json && name !== undefined && Object.keys(json).includes(name);
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
          const group = new ConfigurationControlGroup(
            value['title'] ?? key,
            key,
          );
          group.controls = this.parse(value, json ? json[key] : undefined, key);
          result.push(group);
        } else {
          result.push(...this.parse(value, json, key));
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
          },
          this.form,
        );
        control.toggled =
          json && name !== undefined && Object.keys(json).includes(name);
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
          },
          this.form,
        );
        control.toggled =
          json && name !== undefined && Object.keys(json).includes(name);
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
          },
          this.form,
        );
        control.toggled =
          json && name !== undefined && Object.keys(json).includes(name);
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
          },
          this.form,
        );
        control.toggled =
          json && name !== undefined && Object.keys(json).includes(name);

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
            },
            this.form,
          );
          control.toggled =
            json && name !== undefined && Object.keys(json).includes(name);
          result.push(control);
        }
      }
    }

    return result;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const schemaChange = changes['jsonSchema'];
    if (schemaChange) {
      const schema = schemaChange.currentValue;

      if (schema) {
        this.form = new ConfigurationControlGroup(
          schema['title'] ?? '',
          schema['name'] ?? '',
        );
        this.form.controls = this.parse(schema, this.json, undefined);
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
        this.form = new ConfigurationControlGroup(
          this.jsonSchema['title'] ?? '',
          this.jsonSchema['name'] ?? '',
        );
        this.form.controls = this.parse(this.jsonSchema, this.json, undefined);
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
    }
  }
}

export class ConfigurationControlOptions<R, S = any> {
  type?:
    | 'switch'
    | 'select'
    | 'number'
    | 'integer'
    | 'multiple-choice'
    | 'text'
    | 'textarea'
    | 'array';
  title?: string;
  description?: string;
  value?: R;
  defaultValue?: R;
  ignore = false;
  toggleable = false;
  dependsOn: string[] = [];
  context?: S;
}

export class FixedConfigurationControlOptions<
  R,
  S = any,
> extends ConfigurationControlOptions<R, S> {
  declare type:
    | 'switch'
    | 'select'
    | 'number'
    | 'integer'
    | 'multiple-choice'
    | 'text'
    | 'textarea'
    | 'array';

  constructor() {
    super();
  }
}

export class ConfigurationControl<R = any, S = any> {
  public get type() {
    return this._options.type;
  }

  get name(): string {
    return this._name;
  }

  get title(): string | undefined {
    return this._options.title;
  }

  get description(): string | undefined {
    return this._options.description;
  }

  get context(): any {
    return this._options.context;
  }

  get toggleable(): boolean {
    return this._options.toggleable;
  }

  get dependsOn(): string[] {
    return this._options.dependsOn;
  }

  get value(): R | undefined {
    return this._options.value;
  }

  set value(value: R | undefined) {
    this._options.value = value;
  }

  get ignore(): boolean {
    return this._options.ignore;
  }

  get id(): any {
    return this._id;
  }

  private static idCounter = 1;
  private _id: number;
  public itemsType: any = undefined;
  public focused = false;
  public toggled = false;
  protected _options: FixedConfigurationControlOptions<R, S>;

  constructor(
    protected _name: string,
    _options: ConfigurationControlOptions<any>,
    protected _root?: ConfigurationControlGroup,
  ) {
    this._id = ConfigurationControl.idCounter++;
    this._options = _options as FixedConfigurationControlOptions<R, S>;
  }

  toObj(): any {
    const result: any = {};
    result[this._name] = !this.checkToggleStateOfControl()
      ? undefined
      : this._options.value;
    return result;
  }

  checkToggleStateOfControl() {
    if (this.toggleable && !this.toggled) {
      return false;
    } else if (this.dependsOn.length > 0) {
      for (const dependsOnAttributePath of this.dependsOn) {
        const found = this.findControlOfAttributeName(dependsOnAttributePath);
        if (!found?.toggled || !found?.value) {
          return false;
        }
      }
      return true;
    }

    return this.toggled;
  }

  private findControlOfAttributeName(
    path: string,
  ): ConfigurationControl | ConfigurationControlGroup | undefined {
    const splitted = path.split('.').filter((a) => a !== '');
    let pointer: ConfigurationControlGroup = this._root as any;
    for (let i = 0; i < splitted.length; i++) {
      const searchPart = splitted[i];
      const index = (pointer?.controls ?? []).findIndex(
        (a) => a.name === searchPart,
      );

      if (index > -1) {
        if (i === splitted.length - 1) {
          return pointer.controls[index];
        } else {
          pointer = pointer.controls[index] as ConfigurationControlGroup;
        }
      }
    }
    return undefined;
  }
}

export class ConfigurationSwitchControl extends ConfigurationControl<boolean> {
  constructor(
    protected override _name: string,
    options: ConfigurationControlOptions<boolean>,
    protected override _root?: ConfigurationControlGroup,
  ) {
    super(
      _name,
      {
        ...options,
        type: 'switch',
      },
      _root,
    );
  }
}

export class ConfigurationSelectControl extends ConfigurationControl<
  string,
  {
    label: string;
    value: string;
  }
> {
  constructor(
    protected override _name: string,
    options: ConfigurationControlOptions<
      string,
      {
        label: string;
        value: string;
      }[]
    >,
    protected override _root?: ConfigurationControlGroup,
  ) {
    super(
      _name,
      {
        ...options,
        type: 'select',
      },
      _root,
    );
  }
}

export class ConfigurationMultipleChoiceControl extends ConfigurationControl<
  string[],
  {
    label: string;
    value: string;
  }
> {
  constructor(
    protected override _name: string,
    options: ConfigurationControlOptions<
      string[],
      {
        label: string;
        value: string;
      }
    >,
    protected override _root?: ConfigurationControlGroup,
  ) {
    super(
      _name,
      {
        ...options,
        type: 'multiple-choice',
      },
      _root,
    );
  }
}

export class ConfigurationTextControl extends ConfigurationControl<string> {
  constructor(
    protected override _name: string,
    options: ConfigurationControlOptions<string>,
    protected override _root?: ConfigurationControlGroup,
  ) {
    super(
      _name,
      {
        ...options,
        type: 'text',
      },
      _root,
    );
  }
}

export class ConfigurationNumberControl extends ConfigurationControl<number> {
  constructor(
    protected override _name: string,
    options: ConfigurationControlOptions<number>,
    protected override _root?: ConfigurationControlGroup,
  ) {
    super(
      _name,
      {
        ...options,
        type: options.type ?? 'number',
      },
      _root,
    );
  }
}

export class ConfigurationArrayControl extends ConfigurationControl<any[]> {
  constructor(
    protected override _name: string,
    options: ConfigurationControlOptions<any[]>,
    protected override _root?: ConfigurationControlGroup,
  ) {
    super(_name, options, _root);
  }
}

export class ConfigurationTextareaControl extends ConfigurationControl<string> {
  constructor(
    protected override _name: string,
    options: ConfigurationControlOptions<string>,
    protected override _root?: ConfigurationControlGroup,
  ) {
    super(
      _name,
      {
        ...options,
        type: 'textarea',
      },
      _root,
    );
  }
}

export class ConfigurationControlGroup {
  private _type = 'group';

  get type(): string {
    return this._type;
  }

  get title(): string {
    return this._title;
  }

  get name(): string {
    return this._name;
  }

  get toggleable(): boolean {
    return this._toggleable;
  }

  get dependsOn(): string[] {
    return this._dependsOn;
  }

  // ignore
  public value = undefined;
  public context: any;
  public description = '';
  public id = 1;
  public focused = false;
  public toggled = false;
  public ignore = false;
  public itemsType: any = undefined;

  constructor(
    protected _title: string,
    protected _name: string,
    public controls: (ConfigurationControl | ConfigurationControlGroup)[] = [],
    protected _toggleable = false,
    protected _dependsOn: string[] = [],
    public readonly root?: ConfigurationControlGroup,
  ) {}

  toObj(): any {
    let result: any = {};

    for (const control of this.controls) {
      result = {
        ...result,
        ...control.toObj(),
      };
    }

    if (this._name) {
      const returnValue: any = {};
      returnValue[this._name] = result;
      return returnValue;
    }
    return result;
  }

  checkToggleStateOfControl() {
    if (this.toggleable && !this.toggled) {
      return false;
    } else if (this.dependsOn.length > 0) {
      for (const dependsOnAttributePath of this.dependsOn) {
        const found = this.findControlOfAttributeName(dependsOnAttributePath);
        if (!found?.toggled || !found?.value) {
          return false;
        }
      }
      return true;
    }

    return this.toggled;
  }

  private findControlOfAttributeName(
    path: string,
  ): ConfigurationControl | ConfigurationControlGroup | undefined {
    const splitted = path.split('.').filter((a) => a !== '');
    let pointer: ConfigurationControlGroup = this.root as any;
    for (let i = 0; i < splitted.length; i++) {
      const searchPart = splitted[i];
      const index = (pointer?.controls ?? []).findIndex(
        (a) => a.name === searchPart,
      );

      if (index > -1) {
        if (i === splitted.length - 1) {
          return pointer.controls[index];
        } else {
          pointer = pointer.controls[index] as ConfigurationControlGroup;
        }
      }
    }
    return undefined;
  }
}
