import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AudioplayerComponent } from './components/audio/audioplayer';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { AudioViewerComponent } from './components/audio/audio-viewer';

@NgModule({
  declarations: [AudioplayerComponent, AudioViewerComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    OctraUtilitiesModule,
  ],
  exports: [AudioplayerComponent, AudioViewerComponent],
})
export class OctraComponentsModule {}
