import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AudioplayerComponent} from './components/audio/audioplayer/audioplayer.component';
import {TimespanPipe} from './pipe/timespan.pipe';
import {AudioNavigationComponent} from './components/audio/audio-navigation';
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
import {ProcentPipe} from './pipe/procent.pipe';
import {AudioViewerComponent} from './components/audio/audio-viewer/audio-viewer.component';
import {Timespan2Pipe} from './pipe/timespan2.pipe';
import {LeadingNullPipe} from './pipe/leadingnull.pipe';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    ReactiveFormsModule
  ],
  declarations: [
    AudioplayerComponent,
    AudioNavigationComponent,
    TimespanPipe,
    Timespan2Pipe,
    ProcentPipe,
    AudioViewerComponent,
    LeadingNullPipe
  ],
  exports: [
    AudioNavigationComponent,
    AudioplayerComponent,
    AudioViewerComponent,
    Timespan2Pipe,
    ProcentPipe,
    LeadingNullPipe
  ]
})
export class MediaComponentsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faPlay, faPause, faStop, faForward, faStepForward, faStepBackward, faRetweet, faClock, faVolumeUp, faVolumeDown);
  }
}
