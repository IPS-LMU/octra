// angular
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
// third-party
import {BsModalModule} from 'ng2-bs3-modal';
import {Ng2Webstorage} from 'ngx-webstorage';
// other
import {LanguageLoader} from './core/shared';
import {AlertComponent, DropZoneComponent, OctraModalComponent, TranscrEditorComponent} from './core/component';
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

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {routing} from './app.routes';
import {LeadingNullPipe, ProcentPipe, SecondsPipe, TimespanPipe} from './core/shared/pipe';

import {
  APIService,
  AppStorageService,
  AudioService,
  KeymappingService,
  ModalService,
  NavbarService,
  SettingsService
} from './core/shared/service';

import {
  ALoginGuard,
  DeALoginGuard,
  LogoutGuard,
  MembersAreaGuard,
  SettingsGuard,
  TranscrEndGuard
} from './core/shared/guard';

import {AppComponent} from './app.component';

import {TranscrGuidelinesComponent} from './core/gui/transcr-guidelines/transcr-guidelines.component';
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
import {EditorWSignaldisplayComponent, LinearEditorComponent, TwoDEditorComponent} from './editors';
import {HelpComponent} from './core/gui/help/help.component';
import {NewEditorComponent} from './editors/new-editor/new-editor.component';
import {HelpToolsComponent} from './core/gui/help-tools/help-tools.component';
import {FeaturesComponent} from './core/gui/features/features.component';
import {Timespan2Pipe} from './core/shared/pipe/timespan2.pipe';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {AudioNavigationComponent} from './mediacomponents/components/audio/audio-navigation';
import {AudioplayerComponent, AudioplayerDirective} from './mediacomponents/components/audio/audioplayer';
import {
  AudioviewerComponent,
  AudioviewerConfig,
  AudioviewerDirective
} from './mediacomponents/components/audio/audioviewer';
import {CircleLoupeComponent} from './mediacomponents/components/audio/circleloupe';
import {LoupeComponent} from './mediacomponents/components/audio/loupe';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
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
    HelpToolsComponent,
    MembersAreaComponent,
    NavigationComponent,
    ProcentPipe,
    SecondsPipe,
    LeadingNullPipe,
    TimespanPipe,
    Timespan2Pipe,
    TranscrEditorComponent,
    TranscriptionComponent,
    TranscriptionEndComponent,
    TranscrOverviewComponent,
    TranscrWindowComponent,
    HelpComponent,
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
    EDITORS,
    NewEditorComponent,
    FeaturesComponent
  ],
  entryComponents: EDITORS,
  imports: [
    BrowserModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    BsDropdownModule.forRoot(),
    CollapseModule.forRoot(),
    FormsModule,
    HttpClientModule,
    Ng2Webstorage.forRoot({
      separator: '.',
      prefix: 'custom'
    }),
    BsModalModule,
    BrowserAnimationsModule,
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
    AppStorageService,
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
