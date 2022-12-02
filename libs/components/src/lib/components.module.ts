import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AudioplayerComponent} from './components/audio/audioplayer';
import {LeadingNullPipe, ProcentPipe, TimespanPipe} from './pipe';
import {AudioViewerComponent} from './components/audio/audio-viewer';

@NgModule({
  declarations: [
    AudioplayerComponent,
    ProcentPipe,
    AudioViewerComponent,
    LeadingNullPipe,
    TimespanPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  exports: [
    AudioplayerComponent,
    AudioViewerComponent,
    ProcentPipe,
    TimespanPipe,
    LeadingNullPipe
  ]
})
export class OctraComponentsModule {
}
