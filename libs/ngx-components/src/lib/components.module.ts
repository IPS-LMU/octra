import { CommonModule } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { AudioViewerComponent } from './components/audio/audio-viewer';
import { AudioplayerComponent } from './components/audio/audioplayer';

@NgModule({
  declarations: [],
  exports: [AudioplayerComponent, AudioViewerComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OctraUtilitiesModule,
    AudioplayerComponent,
    AudioViewerComponent,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class OctraComponentsModule {}
