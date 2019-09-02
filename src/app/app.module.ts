// angular
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
// third-party
import {Ng2Webstorage} from '@rars/ngx-webstorage';
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

import {APIService, AppStorageService, AudioService, KeymappingService, SettingsService} from './core/shared/service';

import {ALoginGuard, DeALoginGuard, LogoutGuard, MembersAreaGuard, SettingsGuard, TranscrEndGuard} from './core/shared/guard';

import {AppComponent} from './app.component';

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
import {DictaphoneEditorComponent, LinearEditorComponent, TwoDEditorComponent} from './editors';
import {HelpComponent} from './core/gui/help/';
import {NewEditorComponent} from './editors/new-editor/new-editor.component';
import {HelpToolsComponent} from './core/gui/help-tools/';
import {FeaturesComponent} from './core/gui/features';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {AudioviewerConfig} from './media-components/components/audio/audioviewer';
import {MediaComponentsModule} from './media-components/media-components.module';
import {TranscrEditorComponent} from './core/component/transcr-editor';
import {Error404Component} from './core/gui/error404';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
// icons
import {library} from '@fortawesome/fontawesome-svg-core';
import {
  faAlignJustify,
  faArrowLeft,
  faArrowRight,
  faBook,
  faCheck,
  faChevronDown,
  faChevronUp,
  faCog,
  faDatabase,
  faDownload,
  faEdit,
  faExclamationCircle,
  faExclamationTriangle,
  faEye,
  faFile,
  faFolderOpen,
  faGlobe,
  faHeadphones,
  faInfoCircle,
  faKeyboard,
  faMinus,
  faPaperPlane,
  faPlus,
  faPrint,
  faQuestionCircle,
  faSave,
  faSearch,
  faSignOutAlt,
  faSpinner,
  faThList,
  faTimes,
  faTrash,
  faWindowMaximize
} from '@fortawesome/free-solid-svg-icons';
// modules
import {ButtonsModule, ModalModule, PopoverModule, ProgressbarModule} from 'ngx-bootstrap';
import {YesNoModalComponent} from './core/modals/yes-no-modal/yes-no-modal.component';
import {ModalService} from './core/modals/modal.service';
import {BugreportModalComponent} from './core/modals/bugreport-modal/bugreport-modal.component';
import {SupportedFilesModalComponent} from './core/modals/supportedfiles-modal/supportedfiles-modal.component';
import {TranscriptionDeleteModalComponent} from './core/modals/transcription-delete-modal/transcription-delete-modal.component';
import {TranscriptionStopModalComponent} from './core/modals/transcription-stop-modal/transcription-stop-modal.component';
import {faCopy, faHandshake, faTimesCircle} from '@fortawesome/free-regular-svg-icons';
import {faCheckCircle} from '@fortawesome/free-regular-svg-icons/faCheckCircle';
import {LoginInvalidModalComponent} from './core/modals/login-invalid-modal/login-invalid-modal.component';
import {ErrorModalComponent} from './core/modals/error-modal/error-modal.component';
import {ExportFilesModalComponent} from './core/modals/export-files-modal/export-files-modal.component';
import {StatisticsModalComponent} from './core/modals/statistics-modal/statistics-modal.component';
import {PromptModalComponent} from './core/modals/prompt-modal/prompt-modal.component';
import {TranscriptionSendModalComponent} from './core/modals/transcription-send-modal/transcription-send-modal.component';
import {TranscriptionSendingModalComponent} from './core/modals/transcription-sending-modal/transcription-sending-modal.component';
import {OverviewModalComponent} from './core/modals/overview-modal/overview-modal.component';
import {ShortcutsModalComponent} from './core/modals/shortcuts-modal/shortcuts-modal.component';
import {TranscriptionGuidelinesModalComponent} from './core/modals/transcription-guidelines-modal/transcription-guidelines-modal.component';
import {BrowserTestComponent} from './core/gui/browser-test/browser-test.component';
import {NavbarService} from './core/gui/navbar/navbar.service';
import {CompatibilityService} from './core/shared/service/compatibility.service';
import {TranscriptionFeedbackComponent} from './core/gui/transcription-feedback/transcription-feedback.component';
import {GuidelinesComponent} from './core/gui/guidelines/guidelines.component';
import {InactivityModalComponent} from './core/modals/inactivity-modal/inactivity-modal.component';
import {faStar} from '@fortawesome/free-solid-svg-icons/faStar';
import {ValidationPopoverComponent} from './core/component/transcr-editor/validation-popover/validation-popover.component';
import {NamingDragAndDropComponent} from './core/component/naming-drag-and-drop/naming-drag-and-drop.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MultiThreadingService} from './core/shared/multi-threading/multi-threading.service';
import {StresstestComponent} from './core/tools/stresstest/stresstest.component';
import {TranscriptionDemoEndModalComponent} from './core/modals/transcription-demo-end/transcription-demo-end-modal.component';
import {AsrOptionsComponent} from './core/gui/asr-options/asr-options.component';

library.add(
  faSpinner,
  faCheck,
  faTimes,
  faTrash,
  faExclamationCircle,
  faInfoCircle,
  faDownload,
  faHeadphones,
  faPrint,
  faSearch,
  faExclamationTriangle,
  faTimesCircle,
  faCog,
  faFolderOpen,
  faCheckCircle,
  faThList,
  faBook,
  faCopy,
  faPlus,
  faSignOutAlt,
  faEdit,
  faFile,
  faArrowLeft,
  faArrowRight,
  faKeyboard,
  faEye,
  faExclamationTriangle,
  faSave,
  faQuestionCircle,
  faChevronUp,
  faChevronDown,
  faPaperPlane,
  faMinus,
  faWindowMaximize,
  faAlignJustify,
  faStar,
  faGlobe,
  faHandshake,
  faDatabase
);

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new LanguageLoader(http, './assets/i18n/octra/octra_', '.json');
}

export const EDITORS: any[] = [
  DictaphoneEditorComponent,
  TwoDEditorComponent,
  LinearEditorComponent
];

@NgModule({
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
    TranscriptionComponent,
    TranscriptionEndComponent,
    TranscrOverviewComponent,
    TranscrWindowComponent,
    Error404Component,
    YesNoModalComponent,
    BugreportModalComponent,
    SupportedFilesModalComponent,
    TranscriptionDeleteModalComponent,
    TranscriptionStopModalComponent,
    LoginInvalidModalComponent,
    ErrorModalComponent,
    ExportFilesModalComponent,
    StatisticsModalComponent,
    PromptModalComponent,
    TranscriptionSendModalComponent,
    TranscriptionSendingModalComponent,
    OverviewModalComponent,
    ShortcutsModalComponent,
    TranscriptionGuidelinesModalComponent,
    GuidelinesComponent,
    BrowserTestComponent,
    TranscriptionFeedbackComponent,
    InactivityModalComponent,
    ValidationPopoverComponent,
    NamingDragAndDropComponent,
    StresstestComponent,
    TranscriptionDemoEndModalComponent,
    AsrOptionsComponent
  ],
  entryComponents: EDITORS,
  imports: [
    BrowserModule,
    FontAwesomeModule,
    ModalModule.forRoot(),
    DragDropModule,
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
    ProgressbarModule.forRoot(),
    routing,
    ButtonsModule.forRoot(),
    PopoverModule.forRoot()
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
    BugReportService,
    CompatibilityService,
    MultiThreadingService
  ]
})

export class AppModule {
}
