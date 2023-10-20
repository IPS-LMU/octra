// angular
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // icons
import { TranslocoModule } from '@ngneat/transloco'; // third-party
import { environment } from '../environments/environment';

import { NgxWebstorageModule } from 'ngx-webstorage';
import { AppComponent } from './app.component';
import { APP_ROUTES } from './app.routes'; // other
import { NavigationComponent } from './core/component';
import { NavbarService } from './core/component/navbar/navbar.service';

import { ReloadFileGuard } from './core/pages/intern/reload-file/reload-file.activateguard';

import { OctraModalService } from './core/modals/octra-modal.service'; // modules
import { ALoginGuard, DeALoginGuard } from './core/shared/guard';
import { TranscActivateGuard } from './core/shared/guard/transcr.activateguard';
import { MultiThreadingService } from './core/shared/multi-threading/multi-threading.service';

import {
  APIService,
  AudioService,
  SettingsService,
} from './core/shared/service';
import { AppStorageService } from './core/shared/service/appstorage.service';
import { BugReportService } from './core/shared/service/bug-report.service';
import { CompatibilityService } from './core/shared/service/compatibility.service';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import * as fromApplication from './core/store/application/application.reducer';
import * as fromASR from './core/store/asr/asr.reducer';
import * as fromUser from './core/store/user/user.reducer';
import { IDBEffects } from './core/store/idb/idb-effects.service';
import { IDBService } from './core/shared/service/idb.service';
import { ApplicationEffects } from './core/store/application/application.effects';
import { ModalsModule } from './core/modals/modals.module';
import { AppSharedModule } from './app.shared.module';
import { OctraComponentsModule } from '@octra/ngx-components';
import { NgxOctraApiModule } from '@octra/ngx-octra-api';
import {
  NgbCollapseModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbNavModule,
  NgbPopoverModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import {
  AuthenticationEffects,
  authenticationReducer,
} from './core/store/authentication';
import { APIEffects } from './core/store/api';
import { PagesModule } from './core/pages/pages.module';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { AsrEffects } from './core/store/asr/asr.effects.service';
import { TranslocoRootModule } from './app.transloco';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AppComponent, NavigationComponent],
  imports: [
    BrowserModule,
    AppSharedModule,
    FormsModule,
    HttpClientModule,
    NgxWebstorageModule.forRoot({
      separator: '.',
      prefix: 'custom',
    }),
    BrowserAnimationsModule,
    ReactiveFormsModule,
    PagesModule,
    RouterModule.forRoot(APP_ROUTES, { initialNavigation: 'enabledBlocking' }),
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
      }
    ),
    StoreDevtoolsModule.instrument({
      trace: true,
      maxAge: 50,
      logOnly: !environment.production,
    }),
    EffectsModule.forRoot([
      IDBEffects,
      ApplicationEffects,
      AsrEffects,
      APIEffects,
      AuthenticationEffects,
    ]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
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
  ],
  bootstrap: [AppComponent],
  providers: [
    ALoginGuard,
    APIService,
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
  ],
  exports: [],
})
export class AppModule {}
