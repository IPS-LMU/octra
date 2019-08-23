import {Injectable} from '@angular/core';
import {ASRLanguage, ASRSettings} from '../../obj/Settings';
import {SettingsService} from './settings.service';
import {AppStorageService} from './appstorage.service';
import {isNullOrUndefined} from '../Functions';

@Injectable({
  providedIn: 'root'
})
export class AsrService {
  get selectedLanguage(): ASRLanguage {
    return this._selectedLanguage;
  }

  set selectedLanguage(value: ASRLanguage) {
    this._selectedLanguage = value;
    this.appStorage.asrSelectedLanguage = value.code;
    this.appStorage.asrSelectedService = value.asr;
  }

  private _selectedLanguage: ASRLanguage = null;

  public get asrSettings(): ASRSettings {
    return this.settingsService.appSettings.octra.plugins.asr;
  }

  constructor(private settingsService: SettingsService, private appStorage: AppStorageService) {
  }

  public getLanguageByCode(code: string, asr: string): ASRLanguage {
    if (isNullOrUndefined(asr) || isNullOrUndefined(code)) {
      return null;
    }

    return this.asrSettings.languages.find((a) => {
      return a.code === code && a.asr === asr;
    });
  }

  public getServiceInformation(serviceProvider: string) {
    if (!(this.asrSettings.services === null || this.asrSettings.services === undefined)) {
      return this.asrSettings.services.find((a) => {
        return a.provider === serviceProvider;
      });
    }

    return undefined;
  }
}
