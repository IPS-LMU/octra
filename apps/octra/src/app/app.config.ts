import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  ApplicationConfig,
  Injectable,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideTransloco,
  Translation,
  TranslocoLoader,
} from '@jsverse/transloco';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import {
  provideNgxWebstorage,
  withLocalStorage,
  withNgxWebstorageConfig,
  withSessionStorage,
} from 'ngx-webstorage';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';
import { LoginMode } from './core/store';
import { APIEffects } from './core/store/api';
import { ApplicationEffects } from './core/store/application/application.effects';
import * as fromApplication from './core/store/application/application.reducer';
import { AsrEffects } from './core/store/asr/asr.effects.service';
import * as fromASR from './core/store/asr/asr.reducer';
import {
  AuthenticationEffects,
  authenticationReducer,
} from './core/store/authentication';
import { IDBEffects } from './core/store/idb/idb-effects.service';
import { LoginModeReducers } from './core/store/login-mode';
import { AnnotationEffects } from './core/store/login-mode/annotation/annotation.effects';
import * as fromUser from './core/store/user/user.reducer';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string) {
    const code = lang.replace(/-.*/g, '');
    return this.http.get<Translation>(`assets/i18n/${code}.json`);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideStore(
      {
        application: fromApplication.reducer,
        asr: fromASR.reducer,
        authentication: authenticationReducer,
        user: fromUser.reducer,
        onlineMode: new LoginModeReducers(LoginMode.ONLINE).create(),
        demoMode: new LoginModeReducers(LoginMode.DEMO).create(),
        localMode: new LoginModeReducers(LoginMode.LOCAL).create(),
        urlMode: new LoginModeReducers(LoginMode.URL).create(),
      },
      {
        metaReducers: !environment.production ? [] : [],
        runtimeChecks: {
          strictActionImmutability: true,
          strictStateImmutability: true,
        },
      }
    ),
    !environment.production
      ? provideStoreDevtools({
          trace: !environment.production,
          maxAge: 200,
          logOnly: !environment.production,
          connectInZone: true,
        })
      : [],
    provideEffects([
      IDBEffects,
      ApplicationEffects,
      AsrEffects,
      APIEffects,
      AnnotationEffects,
      AuthenticationEffects,
    ]),
    provideNgxWebstorage(
      withNgxWebstorageConfig({
        separator: '.',
        prefix: 'custom',
      }),
      withLocalStorage(),
      withSessionStorage()
    ),
    provideHttpClient(withInterceptorsFromDi()),
    provideTransloco({
      config: {
        availableLangs: ['en'],
        defaultLang: 'en',
        fallbackLang: 'en',
        missingHandler: {
          // It will use the first language set in the `fallbackLang` property
          useFallbackTranslation: true,
        },
        prodMode: environment.production,
        reRenderOnLangChange: true,
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
