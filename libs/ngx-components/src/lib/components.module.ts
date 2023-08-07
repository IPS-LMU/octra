import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AudioViewerComponent } from './components/audio/audio-viewer';
import { NgxUtilitiesPipesModule } from '@octra/ngx-utilities';
import { BrowserModule } from '@angular/platform-browser';
import { AudioplayerComponent } from './components/audio/audioplayer';

@NgModule({
  declarations: [AudioViewerComponent, AudioplayerComponent],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgxUtilitiesPipesModule,
  ],
  exports: [AudioViewerComponent, AudioplayerComponent],
})
export class OctraComponentsModule {}
