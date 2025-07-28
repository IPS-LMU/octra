import { NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgbDropdown, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import {
  ASROptionsTranslations,
  OctraASRLanguageSelectComponent,
  OctraProviderSelectComponent,
  ServiceProvider,
} from '@octra/ngx-components';
import { SubscriberComponent } from '@octra/ngx-utilities';

const defaultI18n: ASROptionsTranslations = {
  header: 'Language and Provider',
  asrLanguage: 'ASR Language',
  mausLanguage: 'MAUS Language',
  nothingFound: 'Nothing found',
  asrProvider: 'Provider',
  accessCode: 'Access Code',
};

@Component({
  selector: 'octra-asr-options',
  templateUrl: './asr-options.component.html',
  styleUrls: ['./asr-options.component.scss'],
  imports: [
    FormsModule,
    NgClass,
    OctraASRLanguageSelectComponent,
    TranslocoPipe,
    OctraProviderSelectComponent,
  ],
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
  @Input() languageSettings?: {
    services: ServiceProvider[];
  };
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
    selectedServiceProvider?: ServiceProvider;
  };
  @Output() optionsChange = new EventEmitter<{
    accessCode?: string;
    selectedMausLanguage?: string;
    selectedASRLanguage?: string;
    selectedServiceProvider?: ServiceProvider;
  }>();
  @Input() i18n: ASROptionsTranslations = defaultI18n;

  @Input() showAccessCode = false;

  @ViewChild('dropdown', { static: false }) dropdown?: NgbDropdown;
  @ViewChild('dropdown2', { static: false }) dropdown2?: NgbDropdown;
  @ViewChild('popTemplate', { static: true }) popTemplate!: NgbPopover;
  @ViewChild('mausSelection', { static: true })
  mausSelection!: OctraASRLanguageSelectComponent;

  langService: TranslocoService = inject(TranslocoService);

  protected asrTranslations: ASROptionsTranslations = {
    header: this.langService.translate('p.language and provider'),
    asrLanguage: this.langService.translate('asr.asr language'),
    mausLanguage: this.langService.translate('asr.maus language'),
    nothingFound: this.langService.translate('p.nothing found'),
    asrProvider: this.langService.translate('asr.asr provider'),
    accessCode: this.langService.translate('g.access code'),
  };

  protected accessCodeVisible = false;

  fields: {
    asr: {
      accessCode?: string;
      selected: string;
    };
    maus: {
      selected: string;
    };
    provider: {
      selected?: ServiceProvider;
    };
  } = {
    asr: {
      selected: '',
    },
    maus: {
      selected: '',
    },
    provider: {
      selected: undefined,
    },
  };

  constructor() {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    const options = changes['options']?.currentValue;
    if (options) {
      this.fields.asr.accessCode = options?.accessCode ?? '';
      this.fields.asr.selected = options?.selectedASRLanguage ?? '';
      this.fields.maus.selected = options?.selectedMausLanguage ?? '';
      this.fields.provider.selected = options?.selectedServiceProvider;

      const i18n = changes['i18n']?.currentValue;
      if (i18n) {
        this.i18n = {
          ...defaultI18n,
          ...i18n,
        };
      }
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

  setASRLanguage(language: string) {
    this.options = {
      ...this.options,
      selectedASRLanguage: language,
    };
    this.mausSelection.selectLanguage(language);
    this.optionsChange.emit(this.options);
  }

  setMAUSLanguage(language: string) {
    this.options = {
      ...this.options,
      selectedMausLanguage: language,
    };
    this.optionsChange.emit(this.options);
  }

  setProvider(provider: ServiceProvider) {
    this.options = {
      ...this.options,
      selectedServiceProvider: provider,
    };
    this.optionsChange.emit(this.options);
  }
}
