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
import {Translation, TRANSLOCO_CONFIG, TRANSLOCO_LOADER, translocoConfig, TranslocoLoader, TranslocoModule} from '@ngneat/transloco';
// third-party
import {Ng2Webstorage} from '@rars/ngx-webstorage';
import {DragulaModule} from 'ng2-dragula';
import {ButtonsModule} from 'ngx-bootstrap/buttons';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {ModalModule} from 'ngx-bootstrap/modal';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {ProgressbarModule} from 'ngx-bootstrap/progressbar';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {OctraComponentsModule} from 'octra-components';
import {environment} from '../environments/environment';

import {AppComponent} from './app.component';
import {routing} from './app.routes';
import {AuthenticationNeededComponent} from './core/alerts/authentication-needed/authentication-needed.component';
import {ErrorOccurredComponent} from './core/alerts/error-occurred/error-occurred.component';
// other
import {DropZoneComponent, OctraModalComponent} from './core/component';
import {AlertComponent} from './core/component/alert/alert.component';
import {NamingDragAndDropComponent} from './core/component/naming-drag-and-drop/naming-drag-and-drop.component';
import {TableConfiguratorComponent} from './core/component/table-configurator/table-configurator.component';
import {TranscrEditorComponent} from './core/component/transcr-editor';
import {ValidationPopoverComponent} from './core/component/transcr-editor/validation-popover/validation-popover.component';
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
import {AgreementComponent} from './core/gui/agreement/agreement.component';
import {AsrOptionsComponent} from './core/gui/asr-options/asr-options.component';
import {AuthComponent} from './core/gui/auth/auth.component';
import {BrowserTestComponent} from './core/gui/browser-test/browser-test.component';
import {Error404Component} from './core/gui/error404';
import {FeaturesComponent} from './core/gui/features';
import {GuidelinesComponent} from './core/gui/guidelines/guidelines.component';
import {HelpToolsComponent} from './core/gui/help-tools/';
import {NavbarService} from './core/gui/navbar/navbar.service';
import {NewsComponent} from './core/gui/news/news.component';
import {OctraDropzoneComponent} from './core/gui/octra-dropzone/octra-dropzone.component';

import {ReloadFileGuard} from './core/gui/reload-file/reload-file.activateguard';
import {TranscriptionFeedbackComponent} from './core/gui/transcription-feedback/transcription-feedback.component';
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

import {ALoginGuard, DeALoginGuard, LogoutGuard, MembersAreaGuard, SettingsGuard, TranscrEndGuard} from './core/shared/guard';
import {TranscActivateGuard} from './core/shared/guard/transcr.activateguard';
import {MultiThreadingService} from './core/shared/multi-threading/multi-threading.service';

import {APIService, AppStorageService, AudioService, KeymappingService, SettingsService} from './core/shared/service';
import {BugReportService} from './core/shared/service/bug-report.service';
import {CompatibilityService} from './core/shared/service/compatibility.service';
import {StresstestComponent} from './core/tools/stresstest/stresstest.component';
import {DictaphoneEditorComponent, LinearEditorComponent, TwoDEditorComponent} from './editors';
import {NewEditorComponent} from './editors/new-editor/new-editor.component';

export const EDITORS: any[] = [
  DictaphoneEditorComponent,
  TwoDEditorComponent,
  LinearEditorComponent
];

export const ALERTS: any[] = [
  AuthenticationNeededComponent
];

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
    AgreementComponent,
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
    AsrOptionsComponent,
    TableConfiguratorComponent,
    ClipTextPipe,
    AuthComponent,
    ToolsModalComponent,
    HelpModalComponent,
    ALERTS,
    DynComponentDirective,
    ErrorOccurredComponent,
    MissingPermissionsModalComponent
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
    Ng2Webstorage.forRoot({
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
    TooltipModule.forRoot()
  ],
  bootstrap: [
    AppComponent
  ],
  providers: [
    ALoginGuard,
    APIService,
    AudioService,
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
    library.addIconPacks(fas, far);
  }
}
