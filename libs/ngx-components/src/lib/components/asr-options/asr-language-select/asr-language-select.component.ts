import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgModel,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { ASROptionsTranslations, ServiceProvider } from '../types';

const defaultI18n: ASROptionsTranslations = {
  header: 'Language and Provider',
  asrLanguage: 'ASR Language',
  nothingFound: 'Nothing found',
};

@Component({
  selector: 'octra-asr-language-select',
  templateUrl: './asr-language-select.component.html',
  styleUrls: ['./asr-language-select.component.scss'],
  imports: [
    NgbDropdown,
    FormsModule,
    NgbDropdownMenu,
    NgbDropdownItem,
    NgbDropdownToggle,
  ],
  providers: [
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: OctraASRLanguageSelectComponent,
    },
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: OctraASRLanguageSelectComponent,
    },
  ],
})
export class OctraASRLanguageSelectComponent
  extends SubscriberComponent
  implements OnChanges, ControlValueAccessor, Validator
{
  @Input() languageSettings?: {
    services: ServiceProvider[];
  };
  @Input() id = 'languageDropdownMenu';
  @Input() languages?: {
    value: string;
    providersOnly?: string[];
    description: string;
  }[];
  @Input() i18n: ASROptionsTranslations = defaultI18n;
  @Input() options?: {
    accessCode?: string;
    selectedMausLanguage?: string;
    selectedASRLanguage?: string;
    selectedServiceProvider?: ServiceProvider;
  };
  @Output() optionsChange = new EventEmitter<{
    accessCode?: string;
    selectedMausLanguage?: string;
    selectedASRLanguage?: string;
    selectedServiceProvider?: ServiceProvider;
  }>();
  @Output() ocbFocus = new EventEmitter<void>();

  @Input() title?: string = 'Language';
  @Input() placeholder?: string = 'Language';
  @Input() required = false;
  @Input() name = '';

  @ViewChild('languageInput', { static: true }) input?: NgModel;

  private value?: string | null;

  get internValue(): string | undefined {
    return this.value;
  }

  set internValue(value: string | undefined) {
    this.value = value;
  }

  @ViewChild('dropdown', { static: false }) dropdown?: NgbDropdown;

  filtered: {
    value: string;
    providersOnly?: string[];
    description: string;
  }[] = [];

  protected touched = false;
  protected disabled = false;

  constructor() {
    super();
  }

  validate(
    control: AbstractControl<OctraASRLanguageSelectComponent>,
  ): ValidationErrors | null {
    if (this.required && !this.value) {
      return {
        mustBeSet: true,
      };
    }
    return null;
  }

  registerOnValidatorChange(fn: () => void) {
    this.onValidate = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnChanges(changes: SimpleChanges) {
    const asrLanguages = changes['asrLanguages']?.currentValue;
    if (asrLanguages) {
      this.filtered = asrLanguages ?? [];
    }

    this.value = changes['value']?.currentValue;

    setTimeout(() => {
      this.filterLanguages(this.value);
    }, 0);

    const i18n = changes['i18n']?.currentValue;
    if (i18n) {
      this.i18n = {
        ...defaultI18n,
        ...i18n,
      };
    }
  }

  filterLanguages(value?: string, dropdown?: NgbDropdown, emit?: boolean) {
    if (value) {
      this.filtered = this.languages.filter(
        (a) =>
          a.description?.toLowerCase().includes(value.toLowerCase()) ||
          a.value?.toLowerCase().includes(value.toLowerCase()),
      );
      dropdown?.open();

      if (
        this.languages.find(
          (a) => a.value.toLowerCase() === value.toLowerCase(),
        ) ||
        value === ''
      ) {
        this.options = {
          ...this.options,
          selectedASRLanguage: value ?? undefined,
        };
        if (emit) {
          this.optionsChange.emit(this.options);
        }
      }
    } else {
      this.filtered = this.languages;
    }
  }

  selectLanguage(language?: string, dropdown?: NgbDropdown) {
    dropdown?.close();
    if (language) {
      const langItem = this.languages.find((a) => a.value === language);
      if (!langItem) {
        language = '';
      }
    }
    this.internValue = language ?? undefined;
    this.filterLanguages(this.internValue);
    this.onChange(language);
  }

  onLanguageDropdownOpenChange(opened: boolean) {
    if (
      !opened &&
      (!this.value ||
        !this.languages.find(
          (a) => a.value.toLowerCase() === this.value.toLowerCase(),
        ))
    ) {
      this.internValue = undefined;
      this.filtered = this.languages;
    }
  }

  onInputKeyup(event: KeyboardEvent, value: string, dropdown?: NgbDropdown) {
    this.filterLanguages(value, dropdown);

    if (
      event.key === 'Enter' ||
      event.which === 13 ||
      event.keyCode === 13 ||
      event.code === 'Enter'
    ) {
      this.selectLanguage(value, dropdown);
    } else if (value === '') {
      this.selectLanguage(undefined);
    }
  }

  focus() {
    this.dropdown?.open();
    this.filterLanguages(this.internValue);
  }

  unfocus() {
    this.dropdown?.close();
  }

  onTouched = () => {};
  onValidate = () => {};

  markAsTouched() {
    if (!this.touched) {
      this.input?.control.markAsTouched();
      this.touched = true;
    }
  }

  writeValue(value?: string): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = () => {
      console.log('TOUCHED!');
      fn();
    };
  }

  onChange(value?: string) {
    this.markAsTouched();
  }
}
