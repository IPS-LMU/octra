import { CommonModule } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import {
  OctraASRLanguageSelectComponent,
  OctraProviderSelectComponent,
} from './asr-options';
import { AudioViewerComponent } from './audio/audio-viewer';
import { AudioplayerComponent } from './audio/audioplayer';

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
    OctraASRLanguageSelectComponent,
    OctraProviderSelectComponent,
  ],
  providers: [provideHttpClient(withXhr(), withInterceptorsFromDi())],
})
export class OctraComponentsModule {}
