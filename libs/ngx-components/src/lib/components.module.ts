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
import { AsrOptionsComponent } from './components/asr-options';

@NgModule({
  declarations: [],
  exports: [AudioplayerComponent, AudioViewerComponent, AsrOptionsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OctraUtilitiesModule,
    AudioplayerComponent,
    AudioViewerComponent,
    AsrOptionsComponent,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class OctraComponentsModule {}
