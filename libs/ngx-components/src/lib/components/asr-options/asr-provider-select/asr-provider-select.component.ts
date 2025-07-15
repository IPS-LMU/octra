import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbPopover,
} from '@ng-bootstrap/ng-bootstrap';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { ASROptionsTranslations, ServiceProvider } from '../types';

const defaultI18n: ASROptionsTranslations = {
  asrProvider: 'ASR Provider',
  nothingFound: 'Nothing found',
  nothingSelected: 'Nothing selected',
};

@Component({
  selector: 'octra-asr-provider-select',
  templateUrl: './asr-provider-select.component.html',
  styleUrls: ['./asr-provider-select.component.scss'],
  imports: [
    NgbDropdown,
    FormsModule,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbPopover,
    NgStyle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OctraProviderSelectComponent
  extends SubscriberComponent
  implements OnChanges
{
  @Output() ocbFocus = new EventEmitter<void>();

  @Input() i18n: ASROptionsTranslations = defaultI18n;
  @Input() value?: ServiceProvider;
  @Output() valueChange = new EventEmitter<ServiceProvider>();
  @Input() langItem?: {
    value: string;
    providersOnly?: string[];
    description: string;
  };
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

  @Input() asrProviders?: ServiceProvider[];
  @Input() required = false;

  get internValue(): ServiceProvider | undefined {
    return this.value;
  }

  set internValue(value: ServiceProvider | undefined) {
    this.value = value;
    this.valueChange.emit(value);
    this.cd.markForCheck();
  }

  @ViewChild('dropdown', { static: false }) dropdown?: NgbDropdown;
  @ViewChild('popTemplate', { static: true }) popTemplate!: NgbPopover;

  filtered: ServiceProvider[] = [];

  protected cd = inject(ChangeDetectorRef);

  constructor() {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    const value = changes['value']?.currentValue;
    if (value) {
      this.value = value;

      setTimeout(() => {
        this.filterProviders(this.value.basName);
      }, 0);

      const i18n = changes['i18n']?.currentValue;
      if (i18n) {
        this.i18n = {
          ...defaultI18n,
          ...i18n,
        };
      }
    }

    const asrProviders = changes['asrProviders']?.currentValue;
    if (asrProviders) {
      this.asrProviders = asrProviders;
      setTimeout(() => {
        this.filterProviders(this.value?.basName);
      }, 0);
    }
  }

  filterProviders(value?: string, dropdown?: NgbDropdown, emit?: boolean) {
    if (this.langItem) {
      this.filtered =
        this.asrProviders?.filter(
          (a) =>
            !this.langItem.providersOnly ||
            this.langItem.providersOnly.length === 0 ||
            this.langItem.providersOnly.includes(a.provider),
        ) ?? [];
    } else {
      this.filtered = this.asrProviders;
    }

    if (!value) {
      this.options = {
        ...this.options,
        selectedServiceProvider: this.asrProviders.find(
          (a) => a.provider === value,
        ),
      };
      if (emit) {
        this.optionsChange.emit(this.options);
      }
    } else {
      this.filtered = this.filtered.filter(
        (a) =>
          a.basName?.toLowerCase().includes(value.toLowerCase()) ||
          a.provider.toLowerCase().includes(value.toLowerCase()),
      );
    }

    dropdown?.open();
  }

  selectProvider(provider?: ServiceProvider, dropdown?: NgbDropdown) {
    this.popTemplate?.close();
    dropdown?.close();

    if (provider) {
      const langItem = this.asrProviders.find(
        (a) => a.basName === provider.basName,
      );
      if (!langItem) {
        provider = undefined;
      }
      this.internValue = provider ?? undefined;
    }
    this.internValue = provider;
    this.dropdown.close();
    this.cd.markForCheck();
  }

  getQuotaPercentage(provider: ServiceProvider) {
    if (provider) {
      if (provider.usedQuota && provider.quotaPerMonth) {
        return Math.round((provider.usedQuota / provider.quotaPerMonth) * 100);
      }
    }
    return 0;
  }

  getQuotaLabel(provider: ServiceProvider) {
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

  onInputKeyup(event: KeyboardEvent, value: string, dropdown?: NgbDropdown) {
    this.filterProviders(value, dropdown);

    if (
      event.key === 'Enter' ||
      event.which === 13 ||
      event.keyCode === 13 ||
      event.code === 'Enter'
    ) {
      const provider = this.asrProviders.find((a) => a.provider === value);
      this.selectProvider(provider, dropdown);
    }
    this.cd.markForCheck();
  }

  focus() {
    this.dropdown?.open();
    this.filterProviders(this.internValue?.provider);
  }

  unfocus() {
    this.dropdown?.close();
  }
}
