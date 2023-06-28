import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslocoModule } from "@ngneat/transloco";
import { TranslocoConfigProvider, TranslocoLoaderProvider } from "./app.transloco";
import { AsrOptionsComponent } from "./core/component/asr-options/asr-options.component";
import {
  TranscriptionFeedbackComponent
} from "./core/component/transcription-feedback/transcription-feedback.component";
import { ClipTextPipe } from "./core/shared/clip-text.pipe";
import { FormsModule } from "@angular/forms";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { NgbDropdownModule } from "@ng-bootstrap/ng-bootstrap";


@NgModule({
  declarations: [
    AsrOptionsComponent,
    TranscriptionFeedbackComponent,
    ClipTextPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    DragDropModule,
    NgbDropdownModule
  ],
  providers: [
    TranslocoConfigProvider,
    TranslocoLoaderProvider
  ],
  exports: [
    AsrOptionsComponent,
    TranscriptionFeedbackComponent,
    ClipTextPipe
  ]
})
export class AppSharedModule {}
