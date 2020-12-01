// angular
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {Injectable, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {far} from '@fortawesome/free-regular-svg-icons';
// icons
import {fas} from '@fortawesome/free-solid-svg-icons';
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
import {ButtonsModule} from 'ngx-bootstrap/buttons';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {ModalModule} from 'ngx-bootstrap/modal';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {ProgressbarModule} from 'ngx-bootstrap/progressbar';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {OctraComponentsModule} from '@octra/components';
import {environment} from '../environments/environment';

import {NgxWebstorageModule} from 'ngx-webstorage';
import {AppComponent} from './app.component';
import {routing} from './app.routes';
import {AuthenticationNeededComponent} from './core/alerts/authentication-needed/authentication-needed.component';
import {ErrorOccurredComponent} from './core/alerts/error-occurred/error-occurred.component';
// other
import {AlertComponent, DropZoneComponent} from './core/component';
import {NamingDragAndDropComponent} from './core/tools/naming-drag-and-drop/naming-drag-and-drop.component';
import {TableConfiguratorComponent} from './core/tools/table-configurator/table-configurator.component';
import {TranscrEditorComponent} from './core/component/transcr-editor';
import {ValidationPopoverComponent} from './core/component/transcr-editor/validation-popover/validation-popover.component';
import {AuthComponent, BrowserTestComponent, NewsComponent} from './core/pages';
import {AsrOptionsComponent} from './core/component/asr-options/asr-options.component';
import {Error404Component} from './core/pages/error404';
import {FeaturesComponent} from './core/pages/features';
import {HelpToolsComponent} from './core/pages/help-tools/';
import {NavbarService} from './core/component/navbar/navbar.service';
import {OctraDropzoneComponent} from './core/component/octra-dropzone/octra-dropzone.component';

import {ReloadFileGuard} from './core/pages/reload-file/reload-file.activateguard';
import {TranscriptionFeedbackComponent} from './core/component/transcription-feedback/transcription-feedback.component';
import {BugreportModalComponent} from './core/modals/bugreport-modal/bugreport-modal.component';
import {ErrorModalComponent} from './core/modals/error-modal/error-modal.component';
import {ExportFilesModalComponent} from './core/modals/export-files-modal/export-files-modal.component';
import {HelpModalComponent} from './core/modals/help-modal/help-modal.component';
import {InactivityModalComponent} from './core/modals/inactivity-modal/inactivity-modal.component';
import {LoginInvalidModalComponent} from './core/modals/login-invalid-modal/login-invalid-modal.component';
import {MissingPermissionsModalComponent} from './core/modals/missing-permissions/missing-permissions.component';
import {ModalService} from './core/modals/modal.service';
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
// modules
import {YesNoModalComponent} from './core/modals/yes-no-modal/yes-no-modal.component';
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
import {FastbarComponent} from './core/component/taskbar';
import {LoadingComponent} from './core/pages/loading';
import {LoginComponent} from './core/pages/login';
import {MembersAreaComponent} from './core/pages/members-area';
import {NavigationComponent} from './core/component/navbar';
import {ReloadFileComponent} from './core/pages/reload-file';
import {TranscriptionComponent} from './core/pages/transcription';
import {TranscriptionEndComponent} from './core/pages/transcription-end';
import {TranscrOverviewComponent} from './core/component/transcr-overview';
import {TranscrWindowComponent} from './editors/2D-editor/transcr-window';
import {OctraModalComponent} from './core/modals/octra-modal';
import * as fromLogin from './core/store/login/login.reducer';
import * as fromApplication from './core/store/application/application.reducer';
import * as fromASR from './core/store/asr/asr.reducer';
import * as fromTranscription from './core/store/transcription/transcription.reducer';
import * as fromUser from './core/store/user/user.reducer';
import {IDBEffects} from './core/store/idb/idb-effects.service';
import {IDBService} from './core/shared/service/idb.service';
import {ConfigurationEffects} from './core/store/transcription/configuration.effects';
import {fab} from '@fortawesome/free-brands-svg-icons';
import {ShortcutComponent} from './core/shortcut/shortcut.component';
import {ContextMenuComponent} from './core/component/context-menu/context-menu.component';

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
    HelpModalComponent,
    HelpToolsComponent,
    LoadeditorDirective,
    LoadingComponent,
    LoginComponent,
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
    BrowserTestComponent,
    TranscriptionFeedbackComponent,
    InactivityModalComponent,
    ValidationPopoverComponent,
    NamingDragAndDropComponent,
    StresstestComponent,
    TranscriptionDemoEndModalComponent,
    AsrOptionsComponent,
    TableConfiguratorComponent,
    ClipTextPipe,
    AuthComponent,
    ToolsModalComponent,
    HelpModalComponent,
    ALERTS,
    DynComponentDirective,
    ErrorOccurredComponent,
    MissingPermissionsModalComponent,
    ShortcutComponent,
    ContextMenuComponent
  ],
  imports: [
    BrowserModule,
    FontAwesomeModule,
    ModalModule.forRoot(),
    BsDropdownModule.forRoot(),
    CollapseModule.forRoot(),
    FormsModule,
    HttpClientModule,
    OctraComponentsModule,
    NgxWebstorageModule.forRoot({
      separator: '.',
      prefix: 'custom'
    }),
    BrowserAnimationsModule,
    ReactiveFormsModule,
    ProgressbarModule.forRoot(),
    routing,
    ButtonsModule.forRoot(),
    PopoverModule.forRoot(),
    TranslocoModule,
    DragulaModule.forRoot(),
    TooltipModule.forRoot(),
    StoreModule.forRoot(
      {
        login: fromLogin.reducer,
        application: fromApplication.reducer,
        asr: fromASR.reducer,
        transcription: fromTranscription.reducer,
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
    EffectsModule.forRoot([ConfigurationEffects, IDBEffects]),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    EffectsModule.forFeature([])
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
    library.addIconPacks(fas, far, fab);
  }
}
