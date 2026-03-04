import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { TranslocoModule } from '@jsverse/transloco';
import {
  NgbCollapseModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbNavModule,
  NgbOffcanvasModule,
  NgbPopoverModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { MultiThreadingService, OctraComponentsModule, VersionCheckerService } from '@octra/ngx-components';
import { NgxOctraApiModule } from '@octra/ngx-octra-api';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { provideNgxWebstorage, withLocalStorage, withNgxWebstorageConfig, withSessionStorage } from 'ngx-webstorage';
import { environment } from '../environments/environment';
import { APP_ROUTES } from './app.routes';
import { AppSharedModule } from './app.shared.module';
import { TranslocoRootModule } from './app.transloco';
import { ModalsModule } from './core/modals/modals.module';
import { OctraModalService } from './core/modals/octra-modal.service';
import { ALoginGuard, DeALoginGuard } from './core/pages';
import { ReloadFileGuard } from './core/pages/intern/reload-file/reload-file.activateguard';
import { PagesModule } from './core/pages/pages.module';
import { TranscActivateGuard } from './core/shared/guard/transcr.activateguard';
import { SettingsService } from './core/shared/service';
import { AppStorageService } from './core/shared/service/appstorage.service';
import { BugReportService } from './core/shared/service/bug-report.service';
import { CompatibilityService } from './core/shared/service/compatibility.service';
import { IDBService } from './core/shared/service/idb.service';
import { APIEffects } from './core/store/api';
import { ApplicationEffects } from './core/store/application/application.effects';
import { AsrEffects } from './core/store/asr/asr.effects.service';
import { AuthenticationEffects, authenticationReducer } from './core/store/authentication';
import { IDBEffects } from './core/store/idb/idb-effects.service';
import * as fromApplication from './core/store/application/application.reducer';
import * as fromASR from './core/store/asr/asr.reducer';
import * as fromUser from './core/store/user/user.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(APP_ROUTES),
    importProvidersFrom(
      AppSharedModule,
      FormsModule,
      ReactiveFormsModule,
      NgxOctraApiModule,
      PagesModule,
      TranslocoModule,
      StoreModule.forRoot(
        {
          application: fromApplication.reducer,
          asr: fromASR.reducer,
          authentication: authenticationReducer,
          user: fromUser.reducer,
        },
        {
          metaReducers: !environment.production ? [] : [],
          runtimeChecks: {
            strictActionImmutability: true,
            strictStateImmutability: true,
          },
        },
      ),
      !environment.production
        ? StoreDevtoolsModule.instrument({
            trace: !environment.production,
            maxAge: 200,
            logOnly: !environment.production,
            connectInZone: true,
          })
        : [],
      EffectsModule.forRoot([IDBEffects, ApplicationEffects, AsrEffects, APIEffects, AuthenticationEffects]),
      EffectsModule.forFeature([]),
      NgbDropdownModule,
      NgbNavModule,
      NgbModalModule,
      NgbPopoverModule,
      NgbTooltipModule,
      NgbCollapseModule,
      ModalsModule,
      TranslocoRootModule,
      OctraComponentsModule,
      OctraUtilitiesModule,
      NgbOffcanvasModule,
    ),
    ALoginGuard,
    DeALoginGuard,
    OctraModalService,
    ReloadFileGuard,
    AppStorageService,
    IDBService,
    TranscActivateGuard,
    SettingsService,
    BugReportService,
    CompatibilityService,
    MultiThreadingService,
    provideHttpClient(withInterceptorsFromDi()),
    provideNgxWebstorage(
      withNgxWebstorageConfig({
        separator: '.',
        prefix: 'custom',
      }),
      withLocalStorage(),
      withSessionStorage(),
    ),
    provideRouter(APP_ROUTES, withEnabledBlockingInitialNavigation()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    VersionCheckerService,
  ],
};
