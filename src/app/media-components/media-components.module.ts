import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LoupeComponent} from './components/audio/loupe';
import {CircleLoupeComponent} from './components/audio/circleloupe';
import {AudioviewerComponent, AudioviewerDirective} from './components/audio/audioviewer';
import {AudioNavigationComponent} from './components/audio/audio-navigation';
import {AudioplayerComponent, AudioplayerDirective} from './components/audio/audioplayer';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ProcentPipe, TimespanPipe} from './pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ReactiveFormsModule
  ],
  declarations: [
    AudioNavigationComponent,
    AudioplayerComponent,
    AudioplayerDirective,
    AudioviewerComponent,
    AudioviewerDirective,
    CircleLoupeComponent,
    LoupeComponent,
    ProcentPipe,
    TimespanPipe
  ],
  exports: [
    CommonModule,
    AudioNavigationComponent,
    AudioplayerComponent,
    AudioplayerDirective,
    AudioviewerComponent,
    AudioviewerDirective,
    CircleLoupeComponent,
    LoupeComponent
  ]
})
export class MediaComponentsModule {
}
