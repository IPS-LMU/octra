// angular
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
// third-party
import {Ng2Webstorage} from 'ngx-webstorage';
// other
import {LanguageLoader} from './core/shared';
import {AlertComponent, DropZoneComponent, OctraModalComponent} from './core/component';
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

import {
  APIService,
  AppStorageService,
  AudioService,
  KeymappingService,
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
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {AudioviewerConfig} from './media-components/components/audio/audioviewer';
import {MediaComponentsModule} from './media-components/media-components.module';
import {TranscrEditorComponent} from './core/component/transcr-editor';
import {Error404Component} from './core/gui/error404/error404.component';
//icons
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faCheck, faSpinner, faTrash} from '@fortawesome/free-solid-svg-icons';
import {faTimes} from '@fortawesome/free-solid-svg-icons/faTimes';
import {ModalModule} from 'ngx-bootstrap';
import {YesNoModalComponent} from './core/modals/yes-no-modal/yes-no-modal.component';
import {ModalService} from './core/modals/modal.service';
import {BugreportModalComponent} from './core/modals/bugreport-modal/bugreport-modal.component';
import {faExclamationCircle} from '@fortawesome/free-solid-svg-icons/faExclamationCircle';
import {SupportedFilesModalComponent} from './core/modals/supportedfiles-modal/supportedfiles-modal.component';

library.add(faSpinner, faCheck, faTimes, faTrash, faExclamationCircle);

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
    AgreementComponent,
    AlertComponent,
    AppComponent,
    DropZoneComponent,
    EDITORS,
    FaqComponent,
    FastbarComponent,
    FeaturesComponent,
    HelpComponent,
    HelpToolsComponent,
    LoadeditorDirective,
    LoadingComponent,
    LoginComponent,
    LogoutComponent,
    MembersAreaComponent,
    NavigationComponent,
    NewEditorComponent,
    NewsComponent,
    OctraDropzoneComponent,
    OctraModalComponent,
    ReloadFileComponent,
    TranscrEditorComponent,
    TranscrGuidelinesComponent,
    TranscriptionComponent,
    TranscriptionEndComponent,
    TranscrOverviewComponent,
    TranscrWindowComponent,
    Error404Component,
    YesNoModalComponent,
    BugreportModalComponent,
    SupportedFilesModalComponent
  ],
  entryComponents: EDITORS,
  imports: [
    BrowserModule,
    FontAwesomeModule,
    ModalModule.forRoot(),
    BsDropdownModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    CollapseModule.forRoot(),
    FormsModule,
    HttpClientModule,
    MediaComponentsModule,
    Ng2Webstorage.forRoot({
      separator: '.',
      prefix: 'custom'
    }),
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MediaComponentsModule,
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
