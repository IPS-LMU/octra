import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@ngneat/transloco';
import {
  TranslocoConfigProvider,
  TranslocoLoaderProvider,
} from './app.transloco';
import { AsrOptionsComponent } from './core/component/asr-options/asr-options.component';
import { TranscriptionFeedbackComponent } from './core/component/transcription-feedback/transcription-feedback.component';
import { ClipTextPipe } from './core/shared/clip-text.pipe';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  NgbDropdownModule,
  NgbPopoverModule, NgbToast,
} from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { OctraDropzoneComponent } from './core/component/octra-dropzone/octra-dropzone.component';
import {AlertComponent, DropZoneComponent} from './core/component';
import { OctraComponentsModule } from '@octra/ngx-components';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';

@NgModule({
  declarations: [
    AsrOptionsComponent,
    TranscriptionFeedbackComponent,
    ClipTextPipe,
    OctraDropzoneComponent,
    DropZoneComponent,
    AlertComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslocoModule,
    DragDropModule,
    NgbDropdownModule,
    NgbPopoverModule,
    OctraComponentsModule,
    OctraUtilitiesModule,
    TranslocoModule,
    NgbToast,
  ],
  providers: [TranslocoConfigProvider, TranslocoLoaderProvider],
  exports: [
    AsrOptionsComponent,
    TranscriptionFeedbackComponent,
    ClipTextPipe,
    OctraDropzoneComponent,
    DropZoneComponent,
    AlertComponent,
  ],
})
export class AppSharedModule {}
