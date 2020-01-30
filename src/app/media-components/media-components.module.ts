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
import {LeadingNullPipe, ProcentPipe, SecondsPipe, TimespanPipe} from './pipe';

// icons
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {
  faClock,
  faForward,
  faPause, faPlay,
  faRetweet,
  faStepBackward,
  faStepForward,
  faStop,
  faVolumeDown,
  faVolumeUp
} from '@fortawesome/free-solid-svg-icons';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    FontAwesomeModule
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
    SecondsPipe,
    LeadingNullPipe,
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
    LoupeComponent,
    SecondsPipe,
    LeadingNullPipe,
    TimespanPipe,
    ProcentPipe
  ]
})
export class MediaComponentsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faPlay, faPause, faStop, faForward, faStepForward, faStepBackward, faRetweet, faClock, faVolumeUp, faVolumeDown);
  }
}
