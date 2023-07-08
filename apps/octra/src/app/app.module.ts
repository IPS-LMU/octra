// angular
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// icons
import { TranslocoModule } from '@ngneat/transloco';
// third-party
import { environment } from '../environments/environment';

import { NgxWebstorageModule } from 'ngx-webstorage';
import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AuthenticationNeededComponent } from './core/alerts/authentication-needed/authentication-needed.component';
import { ErrorOccurredComponent } from './core/alerts/error-occurred/error-occurred.component';
// other
import {
  AlertComponent,
  DropZoneComponent,
  FastbarComponent,
  NavigationComponent,
  TranscrEditorComponent,
} from './core/component';
import { ValidationPopoverComponent } from './core/component/transcr-editor/validation-popover/validation-popover.component';
import {
  AuthComponent,
  BrowserTestComponent,
  Error404Component,
  FeaturesComponent,
  HelpToolsComponent,
  LoadingComponent,
  LoginComponent,
  MembersAreaComponent,
  NewsComponent,
  ReloadFileComponent,
  TranscriptionComponent,
  TranscriptionEndComponent,
} from './core/pages';
import { NavbarService } from './core/component/navbar/navbar.service';
import { OctraDropzoneComponent } from './core/component/octra-dropzone/octra-dropzone.component';

import { ReloadFileGuard } from './core/pages/reload-file/reload-file.activateguard';

import { OctraModalService } from './core/modals/octra-modal.service';

// modules
import { DynComponentDirective } from './core/shared/directive/dyn-component.directive';
import { LoadeditorDirective } from './core/shared/directive/loadeditor.directive';

import {
  ALoginGuard,
  DeALoginGuard,
  TranscrEndGuard,
} from './core/shared/guard';
import { TranscActivateGuard } from './core/shared/guard/transcr.activateguard';
import { MultiThreadingService } from './core/shared/multi-threading/multi-threading.service';

import {
  APIService,
  AudioService,
  KeymappingService,
  SettingsService,
} from './core/shared/service';
import { AppStorageService } from './core/shared/service/appstorage.service';
import { BugReportService } from './core/shared/service/bug-report.service';
import { CompatibilityService } from './core/shared/service/compatibility.service';
import { StresstestComponent } from './core/tools/stresstest/stresstest.component';
import {
  DictaphoneEditorComponent,
  LinearEditorComponent,
  TrnEditorComponent,
  TwoDEditorComponent,
} from './editors';
import { NewEditorComponent } from './editors/new-editor/new-editor.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { TranscrWindowComponent } from './editors/2D-editor/transcr-window';

import * as fromApplication from './core/store/application/application.reducer';
import * as fromASR from './core/store/asr/asr.reducer';
import { OnlineModeReducers } from './core/store/modes/online-mode/online-mode.reducer';
import * as fromLocalMode from './core/store/modes/local-mode/local-mode.reducer';
import * as fromUser from './core/store/user/user.reducer';
import { IDBEffects } from './core/store/idb/idb-effects.service';
import { IDBService } from './core/shared/service/idb.service';
import { ConfigurationEffects } from './core/store/configuration/configuration.effects';
import { ContextMenuComponent } from './core/component/context-menu/context-menu.component';
import { MaintenanceModule } from './core/component/maintenance/maintenance.module';
import { ApplicationEffects } from './core/store/application/application.effects';
import { LoginMode } from './core/store';
import { PermutationsReplaceModalComponent } from './editors/trn-editor/modals/permutations-replace-modal/permutations-replace-modal.component';
import { AudioNavigationComponent } from './core/component/audio-navigation';
import { ModalsModule } from './core/modals/modals.module';
import { AppSharedModule } from './app.shared.module';
import { OctraComponentsModule } from '@octra/ngx-components';
import {
  TranslocoConfigProvider,
  TranslocoLoaderProvider,
} from './app.transloco';
import { NgxOctraApiModule, OctraAPIService } from '@octra/ngx-octra-api';
import { ProjectsListComponent } from './core/pages/projects-list/projects-list.component';
import {
  NgbCollapseModule,
  NgbDropdownModule,
  NgbModalModule,
  NgbNavModule,
  NgbPopoverModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { NgxJoditModule } from 'ngx-jodit';
import {
  AuthenticationEffects,
  authenticationReducer,
} from './core/store/authentication';
import { APIEffects } from './core/store/api';
import { AnnotationEffects } from './core/store/annotation/annotation.effects';

export const EDITORS: any[] = [
  DictaphoneEditorComponent,
  TwoDEditorComponent,
  LinearEditorComponent,
  TrnEditorComponent,
];

export const ALERTS: any[] = [AuthenticationNeededComponent];

@NgModule({
  declarations: [
    AlertComponent,
    AppComponent,
    DropZoneComponent,
    EDITORS,
    FastbarComponent,
    FeaturesComponent,
    HelpToolsComponent,
    AudioNavigationComponent,
    LoadeditorDirective,
    LoadingComponent,
    LoginComponent,
    MembersAreaComponent,
    NavigationComponent,
    NewEditorComponent,
    NewsComponent,
    OctraDropzoneComponent,
    ReloadFileComponent,
    TranscrEditorComponent,
    TranscriptionComponent,
    TranscriptionEndComponent,
    TranscrWindowComponent,
    Error404Component,
    BrowserTestComponent,
    ValidationPopoverComponent,
    StresstestComponent,
    AuthComponent,
    PermutationsReplaceModalComponent,
    ALERTS,
    DynComponentDirective,
    ErrorOccurredComponent,
    ContextMenuComponent,
    ProjectsListComponent,
  ],
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
    routing,
    TranslocoModule,
    StoreModule.forRoot(
      {
        application: fromApplication.reducer,
        asr: fromASR.reducer,
        authentication: authenticationReducer,
        onlineMode: new OnlineModeReducers(LoginMode.ONLINE).create(),
        demoMode: new OnlineModeReducers(LoginMode.DEMO).create(),
        localMode: fromLocalMode.reducer,
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
      maxAge: 25,
      logOnly: environment.production,
    }),
    EffectsModule.forRoot([
      ConfigurationEffects,
      IDBEffects,
      ApplicationEffects,
      APIEffects,
      AnnotationEffects,
      AuthenticationEffects,
    ]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    EffectsModule.forFeature([]),
    MaintenanceModule,
    NgxJoditModule,
    NgbDropdownModule,
    NgbNavModule,
    NgbModalModule,
    NgbPopoverModule,
    NgbTooltipModule,
    NgbCollapseModule,
    ModalsModule,
    TranslocoModule,
    OctraComponentsModule,
    NgxOctraApiModule,
    OctraComponentsModule,
  ],
  bootstrap: [AppComponent],
  providers: [
    OctraAPIService,
    ALoginGuard,
    APIService,
    AudioService,
    DeALoginGuard,
    KeymappingService,
    OctraModalService,
    NavbarService,
    ReloadFileGuard,
    AppStorageService,
    IDBService,
    TranscActivateGuard,
    SettingsService,
    TranscrEndGuard,
    BugReportService,
    CompatibilityService,
    MultiThreadingService,
    TranslocoConfigProvider,
    TranslocoLoaderProvider,
  ],
})
export class AppModule {}
