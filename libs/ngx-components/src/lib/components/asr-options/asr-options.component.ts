import { NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { ASROptionsTranslations, ASRService, ASRSettings } from './types';

const defaultI18n: ASROptionsTranslations = {
  header: 'Language and Provider',
  asrLanguage: 'ASR Language',
  mausLanguage: "MAUS Language",
  nothingFound: 'Nothing found',
  asrProvider: 'Provider',
  accessCode: 'Access Code',
};

@Component({
  selector: 'octra-asr-options',
  standalone: true,
  templateUrl: './asr-options.component.html',
  styleUrls: ['./asr-options.component.scss'],
  imports: [
    NgbDropdown,
    FormsModule,
    NgbPopover,
    NgStyle,
    NgClass,
    NgbDropdownMenu,
    NgbDropdownItem,
    NgbDropdownToggle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsrOptionsComponent
  extends SubscriberComponent
  implements OnChanges
{
  public settings = {
    onlyForThisOne: false,
    allSegmentsNext: false,
  };

  @Input() manualURL = '';
  @Input() languageSettings?: ASRSettings;
  @Input() asrLanguages?: {
    value: string;
    providersOnly?: string[];
    description: string;
  }[];
  @Input() mausLanguages?: {
    value: string;
    providersOnly?: string[];
    description: string;
  }[];
  @Input() options?: {
    accessCode?: string;
    selectedMausLanguage?: string;
    selectedASRLanguage?: string;
    selectedServiceProvider?: ASRService;
  };
  @Output() optionsChange = new EventEmitter<{
    accessCode?: string;
    selectedMausLanguage?: string;
    selectedASRLanguage?: string;
    selectedServiceProvider?: ASRService;
  }>();
  @Input() i18n: ASROptionsTranslations = defaultI18n;

  @Input() showAccessCode = false;

  @ViewChild('dropdown', { static: false }) dropdown?: NgbDropdown;
  @ViewChild('dropdown2', { static: false }) dropdown2?: NgbDropdown;
  @ViewChild('popTemplate', { static: true }) popTemplate!: NgbPopover;

  protected accessCodeVisible = false;

  fields: {
    asr: {
      accessCode?: string;
      languages: {
        value: string;
        providersOnly?: string[];
        description: string;
      }[];
      filtered: {
        value: string;
        providersOnly?: string[];
        description: string;
      }[];
      selected: string;
    };
    maus: {
      languages: {
        value: string;
        providersOnly?: string[];
        description: string;
      }[];
      filtered: {
        value: string;
        providersOnly?: string[];
        description: string;
      }[];
      selected: string;
    };
    provider: {
      services: ASRService[];
      filtered: ASRService[];
      selected: string;
    };
  } = {
    asr: {
      languages: [],
      filtered: [],
      selected: '',
    },
    maus: {
      languages: [],
      filtered: [],
      selected: '',
    },
    provider: {
      services: [],
      filtered: [],
      selected: '',
    },
  };

  constructor(private cd: ChangeDetectorRef) {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    const languageSettings = changes['languageSettings']?.currentValue;
    if (languageSettings) {
      this.fields.provider.services = languageSettings.services ?? [];
      this.fields.provider.filtered = languageSettings.services ?? [];
    }

    const asrLanguages = changes['asrLanguages']?.currentValue;
    if (asrLanguages) {
      this.fields.asr.languages = asrLanguages ?? [];
      this.fields.asr.filtered = asrLanguages ?? [];
    }

    const mausLanguages = changes['mausLanguages']?.currentValue;
    if (mausLanguages) {
      this.fields.maus.languages = mausLanguages ?? [];
      this.fields.maus.filtered = mausLanguages ?? [];
    }

    const options = changes['options']?.currentValue;
    if (options) {
      this.fields.asr.accessCode = options?.accessCode ?? '';
      this.fields.asr.selected = options?.selectedASRLanguage ?? '';
      this.fields.maus.selected = options?.selectedMausLanguage ?? '';
      this.fields.provider.selected =
        options?.selectedServiceProvider?.provider ?? '';

      setTimeout(() => {
        this.filterLanguages(this.fields.asr.selected, 'asr');
        this.filterLanguages(this.fields.maus.selected, 'maus');
        this.filterProviders(this.fields.provider.selected);
        this.cd.markForCheck();
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

  getQuotaPercentage(provider: ASRService) {
    if (provider) {
      if (provider.usedQuota && provider.quotaPerMonth) {
        return Math.round((provider.usedQuota / provider.quotaPerMonth) * 100);
      }
    }
    return 0;
  }

  getQuotaLabel(provider: ASRService) {
    if (provider) {
      const ohService = provider;
      if (ohService.usedQuota && ohService.quotaPerMonth) {
        const remainingQuota =
          (ohService.quotaPerMonth - ohService.usedQuota) / 60;
        let label = '';
        if (remainingQuota > 60) {
          label = `${Math.round(remainingQuota / 60)} hours`;
        } else {
          label = `${Math.round(remainingQuota)} minutes`;
        }

        return `Free quota: Approx.<br/><b>${label}</b><br/>of recording time shared among all BAS users.`;
      } else {
        return `Unlimited quota`;
      }
    }
    return '';
  }

  filterProviders(value: string, dropdown?: NgbDropdown, emit?: boolean) {
    const langItem = this.fields.asr.languages.find(
      (a) => a.value === this.fields.asr.selected
    );

    if (this.fields.asr.selected && langItem) {
      this.fields.provider.filtered = this.fields.provider.services.filter(
        (a) =>
          !langItem.providersOnly ||
          langItem.providersOnly.length === 0 ||
          langItem.providersOnly.includes(a.provider)
      );
    } else {
      this.fields.provider.filtered = this.fields.provider.services;
    }
    this.fields.provider.filtered = this.fields.provider.filtered.filter(
      (a) =>
        a.basName?.toLowerCase().includes(value.toLowerCase()) ||
        a.provider.toLowerCase().includes(value.toLowerCase())
    );

    if (
      value === '' ||
      this.fields.provider.services.filter(
        (a) =>
          a.basName?.toLowerCase() === value.toLowerCase() ||
          a.provider.toLowerCase() === value.toLowerCase()
      )
    ) {
      this.options = {
        ...this.options,
        selectedServiceProvider: this.fields.provider.services.find(
          (a) => a.provider === value
        ),
      };
      if (emit) {
        this.optionsChange.emit(this.options);
      }
    }

    dropdown?.open();
    this.cd.markForCheck();
  }

  selectProvider(provider: string, dropdown: NgbDropdown, emit?: boolean) {
    this.fields.provider.selected = provider;
    this.options = {
      ...this.options,
      selectedServiceProvider: this.languageSettings?.services.find(
        (a) => a.provider === provider
      ),
    };

    if (emit) {
      this.optionsChange.emit(this.options);
    }
    this.popTemplate?.close();
    setTimeout(() => {
      dropdown.close();
    }, 200);
    this.cd.markForCheck();
  }

  filterLanguages(
    value: string,
    type: 'asr' | 'maus',
    dropdown?: NgbDropdown,
    emit?: boolean
  ) {
    this.fields[type].filtered = this.fields[type].languages.filter(
      (a) =>
        a.description.toLowerCase().includes(value.toLowerCase()) ||
        a.value.toLowerCase().includes(value.toLowerCase())
    );
    dropdown?.open();

    if (
      this.fields[type].languages.find(
        (a) => a.value.toLowerCase() === value.toLowerCase()
      ) ||
      value === ''
    ) {
      if (type === 'asr') {
        this.options = {
          ...this.options,
          selectedASRLanguage: value ?? undefined,
        };
        if (emit) {
          this.optionsChange.emit(this.options);
        }
      } else {
        this.options = {
          ...this.options,
          selectedMausLanguage: value ?? undefined,
        };
        if (emit) {
          this.optionsChange.emit(this.options);
        }
      }
    }

    if (type === 'asr') {
      this.selectLanguage(value, 'maus', emit);
    }
    this.cd.markForCheck();
  }

  selectLanguage(language: string, type: 'asr' | 'maus', emit?: boolean) {
    this.popTemplate?.close();
    const langItem = this.fields[type].languages.find(
      (a) => a.value === language
    );
    if (!langItem) {
      language = '';
    }
    this.fields[type].selected = language;

    if (type === 'asr') {
      if (language && langItem) {
        this.fields.provider.filtered = this.fields.provider.services.filter(
          (a) =>
            !langItem.providersOnly ||
            langItem.providersOnly.length === 0 ||
            langItem.providersOnly.includes(a.provider)
        );
      } else {
        this.fields.provider.filtered = this.fields.provider.services;
      }

      if (
        !this.fields.provider.filtered.find(
          (a) => a.provider === this.fields.provider.selected
        )
      ) {
        this.fields.provider.selected = '';
      }

      this.options = {
        ...this.options,
        selectedASRLanguage: language ?? undefined,
      };
      this.optionsChange.emit(this.options);
    } else {
      this.options = {
        ...this.options,
        selectedMausLanguage: language ?? undefined,
      };
      if (emit) {
        this.optionsChange.emit(this.options);
      }
    }

    if (type === 'asr') {
      this.selectLanguage(language, 'maus', emit);
      this.filterLanguages(language, 'maus', undefined, emit);
    }
    this.cd.markForCheck();
  }

  onLanguageDropdownOpenChange(opened: boolean, type: 'asr' | 'maus') {
    if (
      !opened &&
      !this.fields[type].languages.find(
        (a) =>
          a.value.toLowerCase() === this.fields[type].selected.toLowerCase()
      )
    ) {
      this.fields[type].selected = '';
      this.fields[type].filtered = this.fields[type].languages;
    }
  }

  onAccessCodeChange(accessCode: string, emit?: boolean) {
    this.options = {
      ...this.options,
      accessCode,
    };
    if (emit) {
      this.optionsChange.emit(this.options);
    }
  }
}
