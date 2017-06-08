// angular
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Http, HttpModule, JsonpModule} from '@angular/http';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
// third-party
import {Ng2Bs3ModalModule} from 'ng2-bs3-modal/ng2-bs3-modal';
import {Ng2Webstorage} from 'ng2-webstorage';
// other
import {LanguageLoader} from './shared';
import {
  AlertComponent,
  AudioNavigationComponent,
  AudioplayerComponent,
  AudioplayerDirective,
  AudioviewerComponent,
  AudioviewerConfig,
  AudioviewerDirective,
  CircleLoupeComponent,
  DropZoneComponent,
  LoupeComponent,
  OctraModalComponent,
  TranscrEditorComponent
} from './component';
import {
  FastbarComponent,
  LoadingComponent,
  LoginComponent,
  LogoutComponent,
  MembersAreaComponent,
  NavigationComponent,
  ReloadFileComponent,
  TranscriptionComponent,
  TranscriptionSubmitComponent,
  TranscriptionSubmittedComponent,
  TranscrOverviewComponent,
  TranscrWindowComponent
} from './gui';

import {routing} from './app.routes';
import {LeadingNullPipe, ProcentPipe, SecondsPipe, TimespanPipe} from './pipe';

import {
  APIService,
  AudioService,
  KeymappingService,
  ModalService,
  NavbarService,
  SessionService,
  SettingsService
} from './service';

import {ALoginGuard, DeALoginGuard, LogoutGuard, MembersAreaGuard, SettingsGuard, TranscrSubmittedGuard} from './guard';

import {AppComponent} from './app.component';

import {TranscrGuidelinesComponent} from './gui/transcr-guidelines/transcr-guidelines.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ReloadFileGuard} from './guard/reload-file.activateguard';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {TranscActivateGuard} from './guard/transcr.activateguard';
import {AgreementComponent} from './gui/agreement/agreement.component';
import {BugReportService} from './service/bug-report.service';
import {OctraDropzoneComponent} from './gui/octra-dropzone/octra-dropzone.component';
import {LoadeditorDirective} from './directive/loadeditor.directive';
import {AppInfo} from './app.info';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
  return new LanguageLoader(http, './assets/i18n/octra/octra_', '.json');
}

function getEditorArray(): any[] {
  const result: any[] = [];

  for (let i = 0; i < AppInfo.editors.length; i++) {
    result.push(AppInfo.editors[i].editor);
  }

  return result;
}

const ngmodule = {
  declarations: [
    AppComponent,
    AudioNavigationComponent,
    AudioplayerComponent,
    AudioplayerDirective,
    AudioviewerComponent,
    AudioviewerDirective,
    CircleLoupeComponent,
    LoadingComponent,
    LoginComponent,
    LogoutComponent,
    LoupeComponent,
    MembersAreaComponent,
    NavigationComponent,
    ProcentPipe,
    SecondsPipe,
    LeadingNullPipe,
    TimespanPipe,
    TranscrEditorComponent,
    TranscriptionComponent,
    TranscriptionSubmitComponent,
    TranscriptionSubmittedComponent,
    TranscrOverviewComponent,
    TranscrWindowComponent,
    AlertComponent,
    ReloadFileComponent,
    DropZoneComponent,
    FastbarComponent,
    OctraModalComponent,
    TranscrGuidelinesComponent,
    AgreementComponent,
    OctraDropzoneComponent,
    LoadeditorDirective
  ],
  entryComponents: [
    getEditorArray()
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [Http]
      }
    }),
    BsDropdownModule.forRoot(),
    CollapseModule.forRoot(),
    FormsModule,
    HttpModule,
    JsonpModule,
    Ng2Webstorage.forRoot({
      separator: '.',
      prefix: 'custom'
    }),
    Ng2Bs3ModalModule,
    ReactiveFormsModule,
    routing
  ],
  bootstrap: [
    AppComponent
  ],
  providers: [
    ALoginGuard,
    APIService,
    AudioService,
    AudioviewerConfig,
    DeALoginGuard,
    KeymappingService,
    LogoutGuard,
    MembersAreaGuard,
    ModalService,
    NavbarService,
    ReloadFileGuard,
    SessionService,
    TranscActivateGuard,
    SettingsGuard,
    SettingsService,
    TranscrSubmittedGuard,
    TranslateService,
    BugReportService
  ]
};

// add editors to declaration
for (let i = 0; i < AppInfo.editors.length; i++) {
  const comp = getEditorArray()[i];
  ngmodule.declarations.push(comp);
}

@NgModule(ngmodule)

export class AppModule {
}
