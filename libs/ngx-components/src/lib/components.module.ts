import { CommonModule } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AudioplayerComponent } from './components/audio/audioplayer';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { AudioViewerComponent } from './components/audio/audio-viewer';

@NgModule({
  declarations: [AudioplayerComponent, AudioViewerComponent],
  exports: [AudioplayerComponent, AudioViewerComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OctraUtilitiesModule,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class OctraComponentsModule {}
