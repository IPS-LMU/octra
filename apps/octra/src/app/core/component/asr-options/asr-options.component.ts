import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { AppInfo } from '../../../app.info';
import { ASRService, ASRSettings } from '../../obj/Settings';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { NgbDropdown, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { AsrStoreService } from '../../store/asr/asr-store-service.service';
import { SubscriberComponent } from '@octra/ngx-utilities';

@Component({
  selector: 'octra-asr-options',
  templateUrl: './asr-options.component.html',
  styleUrls: ['./asr-options.component.scss'],
})
export class AsrOptionsComponent extends SubscriberComponent implements OnInit {
  public serviceProviders: any = {};
  public settings = {
    onlyForThisOne: false,
    allSegmentsNext: false,
  };

  @Input() enabled = true;
  @ViewChild('dropdown', { static: false }) dropdown?: NgbDropdown;
  @ViewChild('dropdown2', { static: false }) dropdown2?: NgbDropdown;
  @ViewChild('popTemplate', { static: true }) popTemplate!: NgbPopover;

  languageSettings?: ASRSettings;

  fields: {
    asr: {
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

  public get manualURL(): string {
    return AppInfo.manualURL;
  }

  constructor(
    public appStorage: AppStorageService,
    public asrStoreService: AsrStoreService
  ) {
    super();
  }

  ngOnInit() {
    this.subscribe(this.asrStoreService.languageSettings$, {
      next: (settings) => {
        this.languageSettings = settings;
        this.fields.provider.services = settings?.services ?? [];
        this.fields.provider.filtered = settings?.services ?? [];
      },
    });

    this.subscribe(this.asrStoreService.asrLanguages$, {
      next: (asrLanguages) => {
        this.fields.asr.languages = asrLanguages ?? [];
        this.fields.asr.filtered = asrLanguages ?? [];
      },
    });

    this.subscribe(this.asrStoreService.mausLanguages$, {
      next: (asrLanguages) => {
        this.fields.maus.languages = asrLanguages ?? [];
        this.fields.maus.filtered = asrLanguages ?? [];
      },
    });

    this.subscribe(
      this.asrStoreService.asrOptions$,
      {
        next: (state) => {
          this.fields.asr.selected = state?.selectedASRLanguage ?? '';
          this.fields.maus.selected = state?.selectedMausLanguage ?? '';
          this.fields.provider.selected =
            state?.selectedService?.provider ?? '';
          this.subscriptionManager.removeByTag('storeASRLanguages');

          setTimeout(() => {
            this.filterLanguages(this.fields.asr.selected, 'asr');
            this.filterLanguages(this.fields.maus.selected, 'maus');
            this.filterProviders(this.fields.provider.selected);
          }, 0);
        },
      },
      'storeASRLanguages'
    );
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

  filterProviders(value: string, dropdown?: NgbDropdown) {
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
      this.asrStoreService.changeASRService(value);
    }

    dropdown?.open();
  }

  selectProvider(provider: string, dropdown: NgbDropdown) {
    this.fields.provider.selected = provider;
    this.asrStoreService.changeASRService(provider);
    this.popTemplate?.close();
    setTimeout(() => {
      dropdown.close();
    }, 200);
  }

  filterLanguages(value: string, type: 'asr' | 'maus', dropdown?: NgbDropdown) {
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
        this.asrStoreService.changeASRSelectedLanguage(value ?? undefined);
      } else {
        this.asrStoreService.changeASRSelectedMausLanguage(value ?? undefined);
      }
    }

    if (type === 'asr') {
      this.selectLanguage(value, 'maus');
    }
  }

  selectLanguage(language: string, type: 'asr' | 'maus') {
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

      this.asrStoreService.changeASRSelectedLanguage(language ?? undefined);
    } else {
      this.asrStoreService.changeASRSelectedMausLanguage(language ?? undefined);
    }

    if (type === 'asr') {
      this.selectLanguage(language, 'maus');
      this.filterLanguages(language, 'maus');
    }
  }

  onDropdownClose() {
    alert('close');
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
}
