import { Injectable, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorModalComponent } from './error-modal/error-modal.component';
import { ExportFilesModalComponent } from './export-files-modal/export-files-modal.component';
import { HelpModalComponent } from './help-modal/help-modal.component';
import { InactivityModalComponent } from './inactivity-modal/inactivity-modal.component';
import { LoginInvalidModalComponent } from './login-invalid-modal/login-invalid-modal.component';
import { MissingPermissionsModalComponent } from './missing-permissions/missing-permissions.component';
import { OctraModalComponent } from './octra-modal';
import { OverviewModalComponent } from './overview-modal/overview-modal.component';
import { PromptModalComponent } from './prompt-modal/prompt-modal.component';
import { ShortcutsModalComponent } from './shortcuts-modal/shortcuts-modal.component';
import { StatisticsModalComponent } from './statistics-modal/statistics-modal.component';
import { SupportedFilesModalComponent } from './supportedfiles-modal/supportedfiles-modal.component';
import { ToolsModalComponent } from './tools-modal/tools-modal.component';
import { TranscriptionDeleteModalComponent } from './transcription-delete-modal/transcription-delete-modal.component';
import { TranscriptionDemoEndModalComponent } from './transcription-demo-end/transcription-demo-end-modal.component';
import { TranscriptionGuidelinesModalComponent } from './transcription-guidelines-modal/transcription-guidelines-modal.component';
import { TranscriptionSendingModalComponent } from './transcription-sending-modal/transcription-sending-modal.component';
import { TranscriptionStopModalComponent } from './transcription-stop-modal/transcription-stop-modal.component';
import { YesNoModalComponent } from './yes-no-modal/yes-no-modal.component';
import { ProtectedModalComponent } from './protected-modal/protected-modal.component';
import {
  Translation,
  TranslocoLoader,
  TranslocoModule,
} from '@jsverse/transloco';
import { HttpClient } from '@angular/common/http';
import { AppSharedModule } from '../../app.shared.module';
import {
  BugreportModalComponent,
  OctraComponentsModule,
  OctraFormGeneratorModule
} from '@octra/ngx-components';
import { FormsModule } from '@angular/forms';
import { NamingDragAndDropComponent } from '../tools/naming-drag-and-drop/naming-drag-and-drop.component';
import { ShortcutComponent } from '../shortcut/shortcut.component';
import { TableConfiguratorComponent } from '../tools/table-configurator/table-configurator.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  NgbAccordionCollapse,
  NgbCollapseModule,
  NgbDropdownModule,
  NgbModalModule, NgbPopover,
  NgbTooltipModule
} from '@ng-bootstrap/ng-bootstrap';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { ReAuthenticationModalComponent } from './re-authentication-modal/re-authentication-modal.component';
import { AuthenticationComponent } from '../component/authentication-component/authentication-component.component';
import { AboutModalComponent } from './about-modal/about-modal.component';
import { FeedbackNoticeModalComponent } from './feedback-notice-modal/feedback-notice-modal.component';
import { NgxJoditComponent } from 'ngx-jodit';
import { TranscriptionBackupEndModalComponent } from './transcription-backup-end/transcription-backup-end-modal.component';
import { ImportOptionsModalComponent } from './import-options-modal/import-options-modal.component';
import { WaitingModalComponent } from './waiting-modal/waiting-modal.component';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string) {
    return this.http.get<Translation>(`./assets/i18n/${lang}.json`);
  }
}

@NgModule({
  declarations: [
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
    TranscriptionSendingModalComponent,
    TranscriptionStopModalComponent,
    YesNoModalComponent,
    ProtectedModalComponent,
    ShortcutComponent,
    TableConfiguratorComponent,
    ReAuthenticationModalComponent,
    AuthenticationComponent,
    AboutModalComponent,
    FeedbackNoticeModalComponent,
    TranscriptionBackupEndModalComponent,
    ImportOptionsModalComponent,
    WaitingModalComponent,
  ],
  imports: [
    CommonModule,
    AppSharedModule,
    TranslocoModule,
    OctraComponentsModule,
    FormsModule,
    NgbCollapseModule,
    NgbTooltipModule,
    DragDropModule,
    NgbDropdownModule,
    NamingDragAndDropComponent,
    NgbModalModule,
    OctraUtilitiesModule,
    NgbAccordionCollapse,
    NgxJoditComponent,
    OctraFormGeneratorModule,
    BugreportModalComponent,
    NgbPopover,
  ],
  exports: [
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
    TranscriptionSendingModalComponent,
    TranscriptionStopModalComponent,
    YesNoModalComponent,
    ProtectedModalComponent,
    AuthenticationComponent,
    AboutModalComponent,
    ImportOptionsModalComponent,
    TranscriptionBackupEndModalComponent,
  ],
})
export class ModalsModule {}
