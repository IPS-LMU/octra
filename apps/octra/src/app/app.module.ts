// angular
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {Injectable, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {faHandshake} from '@fortawesome/free-regular-svg-icons';
// icons
import {
  faAlignJustify,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faBars,
  faBook,
  faCheck,
  faChevronDown,
  faChevronUp,
  faCircle,
  faCog,
  faCopy,
  faDatabase,
  faDownload,
  faEdit,
  faEraser,
  faExchangeAlt,
  faExclamationTriangle,
  faEye,
  faFile,
  faFolderOpen,
  faGlobe,
  faGripLines,
  faInfoCircle,
  faKeyboard,
  faLongArrowAltRight,
  faMinus,
  faObjectGroup,
  faPaperPlane,
  faPause,
  faPlay,
  faPlus,
  faPrint,
  faQuestionCircle,
  faSave,
  faSearch,
  faSignOutAlt,
  faSpinner,
  faStar,
  faStop,
  faTable,
  faThList,
  faTimes,
  faTimesCircle,
  faTools,
  faTrash,
  faTrashAlt,
  faUserCheck,
  faWindowMaximize
} from '@fortawesome/free-solid-svg-icons';
import {
  Translation,
  TRANSLOCO_CONFIG,
  TRANSLOCO_LOADER,
  translocoConfig,
  TranslocoLoader,
  TranslocoModule
} from '@ngneat/transloco';
// third-party
import {DragulaModule} from 'ng2-dragula';
import {OctraComponentsModule} from '@octra/components';
import {environment} from '../environments/environment';

import {NgxWebstorageModule} from 'ngx-webstorage';
import {AppComponent} from './app.component';
import {routing} from './app.routes';
import {AuthenticationNeededComponent} from './core/alerts/authentication-needed/authentication-needed.component';
import {ErrorOccurredComponent} from './core/alerts/error-occurred/error-occurred.component';
// other
import {
  AlertComponent,
  DropZoneComponent,
  FastbarComponent,
  NavigationComponent,
  TranscrEditorComponent
} from './core/component';
import {NamingDragAndDropComponent} from './core/tools/naming-drag-and-drop/naming-drag-and-drop.component';
import {TableConfiguratorComponent} from './core/tools/table-configurator/table-configurator.component';
import {ValidationPopoverComponent} from './core/component/transcr-editor/validation-popover/validation-popover.component';
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
  TranscriptionEndComponent
} from './core/pages';
import {AsrOptionsComponent} from './core/component/asr-options/asr-options.component';
import {NavbarService} from './core/component/navbar/navbar.service';
import {OctraDropzoneComponent} from './core/component/octra-dropzone/octra-dropzone.component';

import {ReloadFileGuard} from './core/pages/reload-file/reload-file.activateguard';
import {TranscriptionFeedbackComponent} from './core/component/transcription-feedback/transcription-feedback.component';

import {ModalService} from './core/modals/modal.service';

// modules
import {ClipTextPipe} from './core/shared/clip-text.pipe';
import {DynComponentDirective} from './core/shared/directive/dyn-component.directive';
import {LoadeditorDirective} from './core/shared/directive/loadeditor.directive';

import {ALoginGuard, DeALoginGuard, MembersAreaGuard, SettingsGuard, TranscrEndGuard} from './core/shared/guard';
import {TranscActivateGuard} from './core/shared/guard/transcr.activateguard';
import {MultiThreadingService} from './core/shared/multi-threading/multi-threading.service';

import {APIService, AudioService, KeymappingService, SettingsService} from './core/shared/service';
import {AppStorageService} from './core/shared/service/appstorage.service';
import {BugReportService} from './core/shared/service/bug-report.service';
import {CompatibilityService} from './core/shared/service/compatibility.service';
import {StresstestComponent} from './core/tools/stresstest/stresstest.component';
import {DictaphoneEditorComponent, LinearEditorComponent, TrnEditorComponent, TwoDEditorComponent} from './editors';
import {NewEditorComponent} from './editors/new-editor/new-editor.component';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {TranscrWindowComponent} from './editors/2D-editor/transcr-window';

import * as fromApplication from './core/store/application/application.reducer';
import * as fromASR from './core/store/asr/asr.reducer';
import {OnlineModeReducers} from './core/store/modes/online-mode/online-mode.reducer';
import * as fromLocalMode from './core/store/modes/local-mode/local-mode.reducer';
import * as fromUser from './core/store/user/user.reducer';
import {IDBEffects} from './core/store/idb/idb-effects.service';
import {IDBService} from './core/shared/service/idb.service';
import {ConfigurationEffects} from './core/store/application/configuration.effects';
import {faDropbox} from '@fortawesome/free-brands-svg-icons';
import {ShortcutComponent} from './core/shortcut/shortcut.component';
import {ContextMenuComponent} from './core/component/context-menu/context-menu.component';
import {MaintenanceModule} from './core/component/maintenance/maintenance.module';
import {ApplicationEffects} from './core/store/application/application-effects.service';
import {LoginMode} from './core/store';
import {JoditAngularModule} from 'jodit-angular';
import {MdbCheckboxModule} from 'mdb-angular-ui-kit/checkbox';
import {MdbCollapseModule} from 'mdb-angular-ui-kit/collapse';
import {MdbDropdownModule} from 'mdb-angular-ui-kit/dropdown';
import {MdbFormsModule} from 'mdb-angular-ui-kit/forms';
import {MdbModalModule} from 'mdb-angular-ui-kit/modal';
import {MdbPopoverModule} from 'mdb-angular-ui-kit/popover';
import {MdbTooltipModule} from 'mdb-angular-ui-kit/tooltip';
import {MdbValidationModule} from 'mdb-angular-ui-kit/validation';
import {PermutationsReplaceModalComponent} from './editors/trn-editor/modals/permutations-replace-modal/permutations-replace-modal.component';
import {BugreportModalComponent} from './core/modals/bugreport-modal/bugreport-modal.component';
import {ErrorModalComponent} from './core/modals/error-modal/error-modal.component';
import {ExportFilesModalComponent} from './core/modals/export-files-modal/export-files-modal.component';
import {HelpModalComponent} from './core/modals/help-modal/help-modal.component';
import {InactivityModalComponent} from './core/modals/inactivity-modal/inactivity-modal.component';
import {LoginInvalidModalComponent} from './core/modals/login-invalid-modal/login-invalid-modal.component';
import {MissingPermissionsModalComponent} from './core/modals/missing-permissions/missing-permissions.component';
import {OctraModalComponent} from './core/modals/octra-modal';
import {OverviewModalComponent} from './core/modals/overview-modal/overview-modal.component';
import {PromptModalComponent} from './core/modals/prompt-modal/prompt-modal.component';
import {ShortcutsModalComponent} from './core/modals/shortcuts-modal/shortcuts-modal.component';
import {StatisticsModalComponent} from './core/modals/statistics-modal/statistics-modal.component';
import {SupportedFilesModalComponent} from './core/modals/supportedfiles-modal/supportedfiles-modal.component';
import {ToolsModalComponent} from './core/modals/tools-modal/tools-modal.component';
import {TranscriptionDeleteModalComponent} from './core/modals/transcription-delete-modal/transcription-delete-modal.component';
import {TranscriptionDemoEndModalComponent} from './core/modals/transcription-demo-end/transcription-demo-end-modal.component';
import {TranscriptionGuidelinesModalComponent} from './core/modals/transcription-guidelines-modal/transcription-guidelines-modal.component';
import {TranscriptionSendModalComponent} from './core/modals/transcription-send-modal/transcription-send-modal.component';
import {TranscriptionSendingModalComponent} from './core/modals/transcription-sending-modal/transcription-sending-modal.component';
import {TranscriptionStopModalComponent} from './core/modals/transcription-stop-modal/transcription-stop-modal.component';
import {YesNoModalComponent} from './core/modals/yes-no-modal/yes-no-modal.component';

export const EDITORS: any[] = [
  DictaphoneEditorComponent,
  TwoDEditorComponent,
  LinearEditorComponent,
  TrnEditorComponent
];

export const ALERTS: any[] = [AuthenticationNeededComponent];

@Injectable({providedIn: 'root'})
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {
  }

  getTranslation(lang: string) {
    console.log(`load translation...`);
    return this.http.get<Translation>(`./assets/i18n/${lang}.json`);
  }
}

@NgModule({
  declarations: [
    AlertComponent,
    AppComponent,
    DropZoneComponent,
    EDITORS,
    FastbarComponent,
    FeaturesComponent,
    HelpToolsComponent,
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
    TranscriptionFeedbackComponent,
    ValidationPopoverComponent,
    NamingDragAndDropComponent,
    StresstestComponent,
    AsrOptionsComponent,
    TableConfiguratorComponent,
    ClipTextPipe,
    AuthComponent,
    PermutationsReplaceModalComponent,
    ALERTS,
    DynComponentDirective,
    ErrorOccurredComponent,
    ShortcutComponent,
    ContextMenuComponent,
    BugreportModalComponent,
    ErrorModalComponent,
    ExportFilesModalComponent,
    HelpModalComponent,
    InactivityModalComponent,
    LoginInvalidModalComponent,
    MissingPermissionsModalComponent,
    OctraModalComponent,
    OverviewModalComponent,
    PromptModalComponent,
    ShortcutsModalComponent,
    StatisticsModalComponent,
    SupportedFilesModalComponent,
    ToolsModalComponent,
    TranscriptionDeleteModalComponent,
    TranscriptionDemoEndModalComponent,
    TranscriptionGuidelinesModalComponent,
    TranscriptionSendModalComponent,
    TranscriptionSendingModalComponent,
    TranscriptionStopModalComponent,
    YesNoModalComponent
  ],
  imports: [
    BrowserModule,
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    OctraComponentsModule,
    NgxWebstorageModule.forRoot({
      separator: '.',
      prefix: 'custom'
    }),
    BrowserAnimationsModule,
    ReactiveFormsModule,
    routing,
    TranslocoModule,
    DragulaModule.forRoot(),
    StoreModule.forRoot(
      {
        application: fromApplication.reducer,
        asr: fromASR.reducer,
        onlineMode: new OnlineModeReducers(LoginMode.ONLINE).create(),
        demoMode: new OnlineModeReducers(LoginMode.DEMO).create(),
        localMode: fromLocalMode.reducer,
        user: fromUser.reducer
      },
      {
        metaReducers: !environment.production ? [] : [],
        runtimeChecks: {
          strictActionImmutability: true,
          strictStateImmutability: true
        }
      }
    ),
    StoreDevtoolsModule.instrument({maxAge: 25, logOnly: environment.production}),
    EffectsModule.forRoot([ConfigurationEffects, IDBEffects, ApplicationEffects]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    EffectsModule.forFeature([]),
    MaintenanceModule,
    JoditAngularModule,
    MdbCheckboxModule,
    MdbCollapseModule,
    MdbDropdownModule,
    MdbFormsModule,
    MdbModalModule,
    MdbPopoverModule,
    MdbTooltipModule,
    MdbValidationModule
  ],
  bootstrap: [AppComponent],
  providers: [
    ALoginGuard,
    APIService,
    AudioService,
    DeALoginGuard,
    KeymappingService,
    MembersAreaGuard,
    ModalService,
    NavbarService,
    ReloadFileGuard,
    AppStorageService,
    IDBService,
    TranscActivateGuard,
    SettingsGuard,
    SettingsService,
    TranscrEndGuard,
    BugReportService,
    CompatibilityService,
    MultiThreadingService,
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: ['en'],
        defaultLang: 'en',
        fallbackLang: 'en',
        prodMode: environment.production,
        reRenderOnLangChange: true
      })
    },
    {provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader}
  ]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPaperPlane,
      faTrashAlt,
      faDatabase,
      faExclamationTriangle,
      faHandshake,
      faGlobe,
      faQuestionCircle,
      faObjectGroup,
      faEraser,
      faTrash,
      faDropbox,
      faMinus,
      faWindowMaximize,
      faAlignJustify,
      faTable,
      faThList,
      faBook,
      faCopy,
      faPlus,
      faInfoCircle,
      faTools,
      faDownload,
      faCog,
      faTimes,
      faCheck,
      faSpinner,
      faKeyboard,
      faEye,
      faChevronUp,
      faChevronDown,
      faSave,
      faStar,
      faPrint,
      faSearch,
      faUserCheck,
      faSignOutAlt,
      faFile,
      faTimesCircle,
      faGripLines,
      faArrowLeft,
      faArrowRight,
      faPlay,
      faStop,
      faPause,
      faExchangeAlt,
      faCircle,
      faArrowUp,
      faArrowDown,
      faLongArrowAltRight,
      faBars,
      faEdit,
      faFolderOpen
    );
  }
}
