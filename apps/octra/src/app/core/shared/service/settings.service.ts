import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SubscriptionManager } from '@octra/utilities';

import { Subscription } from 'rxjs';
import { AppSettings, ProjectSettings } from '../../obj/Settings';
import { getModeState } from '../../store';
import { AppStorageService } from './appstorage.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private subscrmanager: SubscriptionManager<Subscription>;

  get projectsettings(): ProjectSettings | undefined {
    return getModeState(this.appStorage.snapshot)?.projectConfig;
  }

  get appSettings(): AppSettings {
    return this.appStorage.snapshot.application.appConfiguration!;
  }

  get guidelines(): any {
    return getModeState(this.appStorage.snapshot)?.guidelines;
  }

  private _log = '';

  get log(): string {
    return this._log;
  }

  set log(value: string) {
    this._log = value;
  }

  private _filename!: string;

  get filename(): string {
    return this._filename;
  }

  constructor(
    private http: HttpClient,
    private appStorage: AppStorageService,
  ) {
    this.subscrmanager = new SubscriptionManager<Subscription>();
  }

  public destroy() {
    this.subscrmanager.destroy();
  }

  /**
   * checks jif the specific theme is active
   */
  public isTheme(theme: string) {
    const selectedTheme =
      this.projectsettings?.octra === undefined ||
      this.projectsettings?.octra?.theme === undefined
        ? 'default'
        : this.projectsettings?.octra.theme;

    return selectedTheme === theme;
  }

  public getAudioExample(language: string) {
    if (this.appSettings.octra.audioExamples !== undefined) {
      let example = this.appSettings.octra.audioExamples.find((a) => {
        return a.language === language;
      });

      if (example === undefined) {
        example = this.appSettings.octra.audioExamples[0];
      }

      return example;
    }

    return undefined;
  }
}
