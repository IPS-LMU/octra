import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranscriptionFeedbackComponent } from './core/component/transcription-feedback/transcription-feedback.component';
import { ClipTextPipe } from './core/shared/clip-text.pipe';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  NgbDropdownModule,
  NgbPopoverModule,
  NgbToast,
} from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { OctraDropzoneComponent } from './core/component/octra-dropzone/octra-dropzone.component';
import {
  AlertComponent,
  DropZoneComponent,
  TranscrEditorComponent,
} from './core/component';
import { AsrOptionsComponent, OctraComponentsModule } from '@octra/ngx-components';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { SignupComponent } from './core/component/authentication-component/signup/signup.component';
import { TranslocoModule } from '@jsverse/transloco';
import { TranscrOverviewComponent } from './core/component/transcr-overview';
import { NgxJoditComponent } from 'ngx-jodit';
import { ValidationPopoverComponent } from './core/component/transcr-editor/validation-popover/validation-popover.component';

@NgModule({
  declarations: [
    TranscriptionFeedbackComponent,
    ClipTextPipe,
    OctraDropzoneComponent,
    DropZoneComponent,
    AlertComponent,
    SignupComponent,
    TranscrOverviewComponent,
    TranscrEditorComponent,
    ValidationPopoverComponent,
  ],
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
  ],
})
export class AppSharedModule {}
