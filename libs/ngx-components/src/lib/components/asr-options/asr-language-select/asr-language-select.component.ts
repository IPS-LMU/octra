import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbPopover,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OctraASRLanguageSelectComponent
  extends SubscriberComponent
  implements OnChanges
{
  @Input() languageSettings?: {
    services: ServiceProvider[];
  };
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

  @Input() value?: string;
  @Output() valueChange = new EventEmitter<string>();

  get internValue(): string | undefined {
    return this.value;
  }

  set internValue(value: string | undefined) {
    this.value = value;
    this.valueChange.emit(value);
  }

  @ViewChild('dropdown', { static: false }) dropdown?: NgbDropdown;
  @ViewChild('popTemplate', { static: true }) popTemplate!: NgbPopover;

  filtered: {
    value: string;
    providersOnly?: string[];
    description: string;
  }[] = [];

  constructor() {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    const asrLanguages = changes['asrLanguages']?.currentValue;
    if (asrLanguages) {
      this.filtered = asrLanguages ?? [];
    }

    const value = changes['value']?.currentValue;
    if (value) {
      this.value = value ?? '';

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
  }

  filterLanguages(value: string, dropdown?: NgbDropdown, emit?: boolean) {
    if (value !== '') {
      this.filtered = this.languages.filter(
        (a) =>
          a.description.toLowerCase().includes(value.toLowerCase()) ||
          a.value.toLowerCase().includes(value.toLowerCase()),
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

  selectLanguage(language: string, dropdown?: NgbDropdown) {
    this.popTemplate?.close();
    dropdown?.close();
    const langItem = this.languages.find((a) => a.value === language);
    if (!langItem) {
      language = '';
    }
    this.internValue = language ?? undefined;
    this.filterLanguages(this.internValue);
  }

  onLanguageDropdownOpenChange(opened: boolean) {
    if (
      !opened &&
      !this.languages.find(
        (a) => a.value.toLowerCase() === this.value.toLowerCase(),
      )
    ) {
      this.internValue = '';
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
    }
  }

  focus() {
    this.dropdown?.open();
    this.filterLanguages(this.internValue);
  }

  unfocus() {
    this.dropdown?.close();
  }
}
