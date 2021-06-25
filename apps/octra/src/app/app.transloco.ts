import {Injectable} from '@angular/core';
import {Translation, TRANSLOCO_CONFIG, TRANSLOCO_LOADER, translocoConfig, TranslocoLoader} from '@ngneat/transloco';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environments/environment';

@Injectable({providedIn: 'root'})
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {
  }

  getTranslation(lang: string) {
    console.log(`load translation...`);
    return this.http.get<Translation>(`./assets/i18n/${lang}.json`);
  }
}

export const TranslocoConfigProvider = {
  provide: TRANSLOCO_CONFIG,
  useValue: translocoConfig({
    availableLangs: ['en'],
    defaultLang: 'en',
    fallbackLang: 'en',
    prodMode: environment.production,
    reRenderOnLangChange: true
  })
};

export const TranslocoLoaderProvider = {provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader};
