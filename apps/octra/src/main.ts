/// <reference types="@angular/localize" />

import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import '@angular/localize/init';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
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
import { OctraComponentsModule } from '@octra/ngx-components';
import { NgxOctraApiModule } from '@octra/ngx-octra-api';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import 'jodit/esm/plugins/justify/justify.js';
import {
  provideNgxWebstorage,
  withLocalStorage,
  withNgxWebstorageConfig,
  withSessionStorage,
} from 'ngx-webstorage';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { AppSharedModule } from './app/app.shared.module';
import { TranslocoRootModule } from './app/app.transloco';
import { NavbarService } from './app/core/component/navbar/navbar.service';
import { ModalsModule } from './app/core/modals/modals.module';
import { OctraModalService } from './app/core/modals/octra-modal.service';
import { ReloadFileGuard } from './app/core/pages/intern/reload-file/reload-file.activateguard';
import { PagesModule } from './app/core/pages/pages.module';
import { ALoginGuard, DeALoginGuard } from './app/core/shared/guard';
import { TranscActivateGuard } from './app/core/shared/guard/transcr.activateguard';
import { MultiThreadingService } from './app/core/shared/multi-threading/multi-threading.service';
import { AudioService, SettingsService } from './app/core/shared/service';
import { AppStorageService } from './app/core/shared/service/appstorage.service';
import { BugReportService } from './app/core/shared/service/bug-report.service';
import { CompatibilityService } from './app/core/shared/service/compatibility.service';
import { IDBService } from './app/core/shared/service/idb.service';
import { APIEffects } from './app/core/store/api';
import { ApplicationEffects } from './app/core/store/application/application.effects';
import * as fromApplication from './app/core/store/application/application.reducer';
import { AsrEffects } from './app/core/store/asr/asr.effects.service';
import * as fromASR from './app/core/store/asr/asr.reducer';
import {
  AuthenticationEffects,
  authenticationReducer,
} from './app/core/store/authentication';
import { IDBEffects } from './app/core/store/idb/idb-effects.service';
import * as fromUser from './app/core/store/user/user.reducer';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserModule,
      AppSharedModule,
      FormsModule,
      ReactiveFormsModule,
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
      EffectsModule.forRoot([
        IDBEffects,
        ApplicationEffects,
        AsrEffects,
        APIEffects,
        AuthenticationEffects,
      ]),
      EffectsModule.forFeature([]),
      NgbDropdownModule,
      NgbNavModule,
      NgbModalModule,
      NgbPopoverModule,
      NgbTooltipModule,
      NgbCollapseModule,
      ModalsModule,
      TranslocoRootModule,
      NgxOctraApiModule,
      OctraComponentsModule,
      OctraUtilitiesModule,
      NgbOffcanvasModule,
    ),
    ALoginGuard,
    AudioService,
    DeALoginGuard,
    OctraModalService,
    NavbarService,
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
    provideAnimations(),
    provideRouter(APP_ROUTES, withEnabledBlockingInitialNavigation()),
  ],
}).catch((err) => console.error(err));
