import { JSONSchema7 } from 'json-schema';

let idCounter = 1;

function nextControlId(): number {
  return idCounter++;
}

export class ConfigurationItem {
  type?: 'switch' | 'select' | 'number' | 'integer' | 'multiple-choice' | 'text' | 'textarea' | 'array' | 'group';
  title?: string;
  description?: string;
  ignore = false;
  textAbove?: string;
  textBottom?: string;
  schema: JSONSchema7;
}

export class ConfigurationControlOptions<R, S = any> extends ConfigurationItem {
  override type?: 'switch' | 'select' | 'number' | 'integer' | 'multiple-choice' | 'text' | 'textarea' | 'array';
  placeholder?: string;
  value?: R;
  defaultValue?: R;
  examples?: any;
  toggleable = false;
  required = false;
  dependsOn: string[] = [];
  context?: S;

  constructor(partial?: Partial<ConfigurationControlOptions<R, S>>) {
    super();
    Object.assign(this, partial);
  }
}

export class ConfigurationGroupOptions extends ConfigurationItem {
  override type = 'group' as const;

  constructor(partial?: Partial<ConfigurationGroupOptions>) {
    super();
    Object.assign(this, partial);
  }
}

export class FixedConfigurationControlOptions<R, S = any> extends ConfigurationControlOptions<R, S> {
  declare type: 'switch' | 'select' | 'number' | 'integer' | 'multiple-choice' | 'text' | 'textarea' | 'array';
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

  get placeholder(): string | undefined {
    return this._options.placeholder;
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

  get schema(): JSONSchema7 {
    return this._options.schema;
  }

  get examples(): any {
    return this._options.examples;
  }

  get ignore(): boolean {
    return this._options.ignore;
  }

  get required(): boolean | undefined {
    return this._options.required;
  }

  get id(): any {
    return this._id;
  }

  get textAbove(): string {
    return this._options.textAbove;
  }

  get textBottom(): string {
    return this._options.textBottom;
  }

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
    this._id = nextControlId();
    this._options = _options as FixedConfigurationControlOptions<R, S>;
  }

  toObj(): any {
    const result: any = {};
    result[this._name] = !this.checkToggleStateOfControl() ? undefined : this._options.value;
    return result;
  }

  checkToggleStateOfControl() {
    if (this.toggleable && !this.toggled) {
      return false;
    } else if (this.dependsOn && this.dependsOn.length > 0) {
      for (const dependsOnAttributePath of this.dependsOn) {
        const found = this.findControlOfAttributeName(dependsOnAttributePath);
        if (!found?.toggled || !found?.value) {
          return false;
        }
      }
      return true;
    } else if (!this.dependsOn) {
      return true;
    }
    return this.toggled;
  }

  private findControlOfAttributeName(path: string): ConfigurationControl | ConfigurationControlGroup | undefined {
    const splitArray = path.split('.').filter((a) => a !== '');
    let pointer: ConfigurationControlGroup = this._root as any;
    for (let i = 0; i < splitArray.length; i++) {
      const searchPart = splitArray[i];
      const index = (pointer?.controls ?? []).findIndex((a) => a.name === searchPart);

      if (index > -1) {
        if (i === splitArray.length - 1) {
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
  protected _options: ConfigurationGroupOptions;
  protected _name: string;

  get type(): string {
    return this._type;
  }

  get title(): string {
    return this._options.title;
  }

  get name(): string {
    return this._name;
  }

  get textAbove(): string {
    return this._options.textAbove;
  }

  get textBottom(): string {
    return this._options.textBottom;
  }

  // ignore
  public value = undefined;
  public context: any;
  public description = '';
  public id = nextControlId();
  public focused = false;
  public toggled = false;
  public ignore = false;
  public itemsType: any = undefined;

  constructor(
    name: string,
    options: Partial<ConfigurationGroupOptions>,
    public controls: (ConfigurationControl | ConfigurationControlGroup)[] = [],
    public readonly root?: ConfigurationControlGroup,
  ) {
    this._options = new ConfigurationGroupOptions(options);
    this._name = name;
  }

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
