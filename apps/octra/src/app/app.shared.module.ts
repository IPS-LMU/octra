import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import {
  NgbDropdownModule,
  NgbPopoverModule,
  NgbToast,
} from '@ng-bootstrap/ng-bootstrap';
import {
  AsrOptionsComponent,
  OctraComponentsModule,
} from '@octra/ngx-components';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { NgxJoditComponent } from 'ngx-jodit';
import {
  AlertComponent,
  DropZoneComponent,
  TranscrEditorComponent,
} from './core/component';
import { SignupComponent } from './core/component/authentication-component/signup/signup.component';
import { OctraDropzoneComponent } from './core/component/octra-dropzone/octra-dropzone.component';
import { ValidationPopoverComponent } from './core/component/transcr-editor/validation-popover/validation-popover.component';
import { TranscrOverviewComponent } from './core/component/transcr-overview';
import { TranscriptionFeedbackComponent } from './core/component/transcription-feedback/transcription-feedback.component';
import { ClipTextPipe } from './core/shared/clip-text.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DragDropModule,
    NgbDropdownModule,
    NgbPopoverModule,
    OctraComponentsModule,
    OctraUtilitiesModule,
    TranslocoModule,
    NgbToast,
    NgxJoditComponent,
    TranscriptionFeedbackComponent,
    ClipTextPipe,
    OctraDropzoneComponent,
    DropZoneComponent,
    AlertComponent,
    SignupComponent,
    TranscrOverviewComponent,
    TranscrEditorComponent,
    ValidationPopoverComponent,
    AsrOptionsComponent,
  ],
  exports: [
    TranscriptionFeedbackComponent,
    ClipTextPipe,
    OctraDropzoneComponent,
    DropZoneComponent,
    AlertComponent,
    SignupComponent,
    TranscrOverviewComponent,
    TranscrEditorComponent,
    ValidationPopoverComponent,
    AsrOptionsComponent,
  ],
})
export class AppSharedModule {}
