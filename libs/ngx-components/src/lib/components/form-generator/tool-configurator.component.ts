import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { SubscriberComponent } from '@octra/ngx-utilities';

@Component({
  selector: 'octra-form-configurator',
  templateUrl: './tool-configurator.component.html',
  styleUrls: ['./tool-configurator.component.scss'],
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
    name?: string
  ): (ConfigurationControl | ConfigurationControlGroup)[] {
    const result: (ConfigurationControl | ConfigurationControlGroup)[] = [];
    const jsonValue = name ? (json ? json[name] : undefined) : undefined;

    if (schema['items']) {
      const items = schema['items'];
      const defaultValue = schema['default'];
      if (typeof items === 'object') {
        if (items['type'] === 'string') {
          result.push(
            new ConfigurationArrayControl(
              name!,
              schema['title'] ?? name,
              'text',
              jsonValue ?? defaultValue,
              defaultValue,
              schema['description'],
              false,
              items['enum']
            )
          );
        } else if (items['type'] === 'number') {
          result.push(
            new ConfigurationArrayControl(
              name!,
              schema['title'] ?? name,
              'number',
              jsonValue ?? defaultValue,
              defaultValue,
              schema['description'],
              false,
              items['enum']
            )
          );
        } else if (items['type'] === 'integer') {
          result.push(
            new ConfigurationArrayControl(
              name!,
              schema['title'] ?? name,
              'integer',
              jsonValue ?? defaultValue,
              defaultValue,
              schema['description'],
              false,
              items['enum']
            )
          );
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
            this.parse(value, json ? json[key] : undefined, key)
          );
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
        result.push(
          new ConfigurationSwitchControl(
            name,
            title ?? name,
            jsonValue ?? defaultValue,
            defaultValue,
            description,
            ignore
          )
        );
      } else if (schema['type'] === 'number') {
        result.push(
          new ConfigurationNumberControl(
            name,
            title ?? name,
            'number',
            jsonValue ?? defaultValue,
            defaultValue,
            description,
            ignore
          )
        );
      } else if (schema['type'] === 'integer') {
        result.push(
          new ConfigurationNumberControl(
            name,
            title ?? name,
            'integer',
            jsonValue ?? defaultValue,
            defaultValue,
            description,
            ignore
          )
        );
      } else if (schema['type'] === 'string') {
        if (enumValues) {
          // select
          result.push(
            new ConfigurationSelectControl(
              name,
              title ?? name,
              jsonValue ?? defaultValue,
              defaultValue,
              description,
              ignore,
              enumValues.map((a) => ({
                label: a,
                value: a,
              }))
            )
          );
        } else {
          result.push(
            new ConfigurationTextControl(
              name,
              title ?? name,
              jsonValue ?? defaultValue,
              defaultValue,
              description,
              ignore
            )
          );
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
          this.parse(schema, this.json)
        );
        const t = '';
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
          this.parse(this.jsonSchema, this.json)
        );
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

export class ConfigurationControl {
  public get type() {
    return this._type;
  }

  get name(): string {
    return this._name;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get context(): any {
    return this._context;
  }

  get id(): any {
    return this._id;
  }

  private static idCounter = 1;
  private _id: number;
  public itemsType: any = undefined;
  public focused = false;

  constructor(
    protected _name: string,
    protected _title: string,
    protected _type:
      | 'switch'
      | 'select'
      | 'number'
      | 'integer'
      | 'multiple-choice'
      | 'text'
      | 'textarea'
      | 'array',
    public value: any,
    public defaultValue: any,
    protected _description: string,
    public ignore = false,
    protected _context?: any
  ) {
    this._id = ConfigurationControl.idCounter++;
  }

  toObj(): any {
    const result: any = {};
    result[this._name] = this.value;
    return result;
  }
}

export class ConfigurationSwitchControl extends ConfigurationControl {
  constructor(
    protected override _name: string,
    protected override _title: string,
    public override value: boolean,
    public override defaultValue: boolean,
    protected override _description: string,
    public override ignore = false
  ) {
    super(_name, _title, 'switch', value, defaultValue, _description, ignore);
  }
}

export class ConfigurationSelectControl extends ConfigurationControl {
  constructor(
    protected override _name: string,
    protected override _title: string,
    public override value: string,
    public override defaultValue: string,
    protected override _description: string,
    public override ignore = false,
    context: {
      label: string;
      value: string;
    }[]
  ) {
    super(
      _name,
      _title,
      'select',
      value,
      defaultValue,
      _description,
      ignore,
      context
    );
  }
}

export class ConfigurationMultipleChoiceControl extends ConfigurationControl {
  constructor(
    protected override _name: string,
    protected override _title: string,
    public override value: string[],
    public override defaultValue: string[],
    protected override _description: string,
    public override ignore = false,
    context: {
      label: string;
      value: string;
    }[]
  ) {
    super(
      _name,
      _title,
      'multiple-choice',
      value,
      defaultValue,
      _description,
      ignore,
      context
    );
  }
}

export class ConfigurationTextControl extends ConfigurationControl {
  constructor(
    protected override _name: string,
    protected override _title: string,
    public override value: string,
    public override defaultValue: string[],
    protected override _description: string,
    public override ignore = false
  ) {
    super(_name, _title, 'text', value, defaultValue, _description, ignore);
  }
}

export class ConfigurationNumberControl extends ConfigurationControl {
  constructor(
    protected override _name: string,
    protected override _title: string,
    protected override _type: 'number' | 'integer',
    public override value: boolean,
    public override defaultValue: boolean,
    protected override _description: string,
    public override ignore = false
  ) {
    super(_name, _title, _type, value, defaultValue, _description, ignore);
  }
}

export class ConfigurationArrayControl extends ConfigurationControl {
  constructor(
    protected override _name: string,
    protected override _title: string,
    public override itemsType:
      | 'switch'
      | 'select'
      | 'number'
      | 'integer'
      | 'multiple-choice'
      | 'text'
      | 'textarea'
      | 'array',
    public override value: any[],
    public override defaultValue: any[],
    protected override _description: string,
    public override ignore = false,
    protected override _context?: any
  ) {
    super(
      _name,
      _title,
      'array',
      value,
      defaultValue,
      _description,
      ignore,
      _context
    );
  }
}

export class ConfigurationTextareaControl extends ConfigurationControl {
  constructor(
    protected override _name: string,
    protected override _title: string,
    public override value: string,
    public override defaultValue: string,
    protected override _description: string,
    public override ignore = false
  ) {
    super(_name, _title, 'textarea', value, defaultValue, _description, ignore);
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

  // ignore
  public value = undefined;
  public context: any;
  public description = '';
  public id = 1;
  public focused = false;
  public ignore = false;
  public itemsType: any = undefined;

  constructor(
    protected _title: string,
    protected _name: string,
    public controls: (ConfigurationControl | ConfigurationControlGroup)[] = []
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
}
