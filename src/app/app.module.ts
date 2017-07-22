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
import {LanguageLoader} from './core/shared';
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
} from './core/component';
import {
  FastbarComponent,
  LoadingComponent,
  LoginComponent,
  LogoutComponent,
  MembersAreaComponent,
  NavigationComponent,
  ReloadFileComponent,
  TranscriptionComponent,
  TranscriptionEndComponent,
  TranscrOverviewComponent,
  TranscrWindowComponent
} from './core/gui';

import {routing} from './app.routes';
import {LeadingNullPipe, ProcentPipe, SecondsPipe, TimespanPipe} from './core/shared/pipe';

import {
  APIService,
  AudioService,
  KeymappingService,
  ModalService,
  NavbarService,
  SessionService,
  SettingsService
} from './core/shared/service';

import {ALoginGuard, DeALoginGuard, LogoutGuard, MembersAreaGuard, SettingsGuard, TranscrEndGuard} from './core/shared/guard';

import {AppComponent} from './app.component';

import {TranscrGuidelinesComponent} from './core/gui/transcr-guidelines/transcr-guidelines.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ReloadFileGuard} from './core/gui/reload-file/reload-file.activateguard';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {TranscActivateGuard} from './core/shared/guard/transcr.activateguard';
import {AgreementComponent} from './core/gui/agreement/agreement.component';
import {BugReportService} from './core/shared/service/bug-report.service';
import {OctraDropzoneComponent} from './core/gui/octra-dropzone/octra-dropzone.component';
import {LoadeditorDirective} from './core/shared/directive/loadeditor.directive';
import {NewsComponent} from './core/gui/news/news.component';
import {FaqComponent} from './core/gui/faq/faq.component';
import {ExpandDirective} from './core/gui/faq/expand.directive';
import {LinearEditorComponent} from './editors/linear-editor/linear-editor.component';
import {EditorWSignaldisplayComponent} from './editors/editor-without-signaldisplay/editor-w-signaldisplay.component';
import {TwoDEditorComponent} from './editors/2D-editor/2D-editor.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
  return new LanguageLoader(http, './i18n/octra/octra_', '.json');
}

export const EDITORS: any[] = [
  EditorWSignaldisplayComponent,
  TwoDEditorComponent,
  LinearEditorComponent
];

export const ngmodule = {
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
    TranscriptionEndComponent,
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
    LoadeditorDirective,
    NewsComponent,
    FaqComponent,
    ExpandDirective,
    EDITORS
  ],
  entryComponents: EDITORS,
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
    TranscrEndGuard,
    TranslateService,
    BugReportService
  ]
};

@NgModule(ngmodule)

export class AppModule {
}
