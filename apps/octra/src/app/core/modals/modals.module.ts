import { Injectable, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BugreportModalComponent } from "./bugreport-modal/bugreport-modal.component";
import { ErrorModalComponent } from "./error-modal/error-modal.component";
import { ExportFilesModalComponent } from "./export-files-modal/export-files-modal.component";
import { HelpModalComponent } from "./help-modal/help-modal.component";
import { InactivityModalComponent } from "./inactivity-modal/inactivity-modal.component";
import { LoginInvalidModalComponent } from "./login-invalid-modal/login-invalid-modal.component";
import { MissingPermissionsModalComponent } from "./missing-permissions/missing-permissions.component";
import { OctraModalComponent } from "./octra-modal";
import { OverviewModalComponent } from "./overview-modal/overview-modal.component";
import { PromptModalComponent } from "./prompt-modal/prompt-modal.component";
import { ShortcutsModalComponent } from "./shortcuts-modal/shortcuts-modal.component";
import { StatisticsModalComponent } from "./statistics-modal/statistics-modal.component";
import { SupportedFilesModalComponent } from "./supportedfiles-modal/supportedfiles-modal.component";
import { ToolsModalComponent } from "./tools-modal/tools-modal.component";
import { TranscriptionDeleteModalComponent } from "./transcription-delete-modal/transcription-delete-modal.component";
import { TranscriptionDemoEndModalComponent } from "./transcription-demo-end/transcription-demo-end-modal.component";
import {
  TranscriptionGuidelinesModalComponent
} from "./transcription-guidelines-modal/transcription-guidelines-modal.component";
import {
  TranscriptionSendingModalComponent
} from "./transcription-sending-modal/transcription-sending-modal.component";
import { TranscriptionStopModalComponent } from "./transcription-stop-modal/transcription-stop-modal.component";
import { YesNoModalComponent } from "./yes-no-modal/yes-no-modal.component";
import { ProtectedModalComponent } from "./protected-modal/protected-modal.component";
import { Translation, TranslocoLoader, TranslocoModule } from "@ngneat/transloco";
import { HttpClient } from "@angular/common/http";
import { AppSharedModule } from "../../app.shared.module";
import { TranslocoConfigProvider, TranslocoLoaderProvider } from "../../app.transloco";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { OctraComponentsModule } from "@octra/components";
import { FormsModule } from "@angular/forms";
import { NamingDragAndDropComponent } from "../tools/naming-drag-and-drop/naming-drag-and-drop.component";
import { ShortcutComponent } from "../shortcut/shortcut.component";
import { TableConfiguratorComponent } from "../tools/table-configurator/table-configurator.component";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { NgbCollapseModule, NgbDropdownModule, NgbModalModule, NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";

@Injectable({ providedIn: "root" })
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
    TranscriptionSendingModalComponent,
    TranscriptionStopModalComponent,
    YesNoModalComponent,
    ProtectedModalComponent,
    NamingDragAndDropComponent,
    ShortcutComponent,
    TableConfiguratorComponent
  ],
  imports: [
    CommonModule,
    AppSharedModule,
    TranslocoModule,
    FontAwesomeModule,
    OctraComponentsModule,
    FormsModule,
    NgbCollapseModule,
    NgbTooltipModule,
    DragDropModule,
    NgbDropdownModule,
    NgbModalModule
  ],
  providers: [
    TranslocoConfigProvider,
    TranslocoLoaderProvider
  ],
  exports: [
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
    TranscriptionSendingModalComponent,
    TranscriptionStopModalComponent,
    YesNoModalComponent,
    ProtectedModalComponent
  ]
})
export class ModalsModule {
}
