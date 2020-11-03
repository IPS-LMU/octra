import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
// icons
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {
  faClock,
  faForward,
  faPause,
  faPlay,
  faRetweet,
  faStepBackward,
  faStepForward,
  faStop,
  faVolumeDown,
  faVolumeUp
} from '@fortawesome/free-solid-svg-icons';
import {AudioNavigationComponent} from './components/audio/audio-navigation';
import {AudioViewerComponent} from './components/audio/audio-viewer';
import {AudioplayerComponent} from './components/audio/audioplayer';
import {LeadingNullPipe, ProcentPipe} from './pipe';

@NgModule({
  declarations: [
    AudioplayerComponent,
    AudioNavigationComponent,
    ProcentPipe,
    AudioViewerComponent,
    LeadingNullPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    ReactiveFormsModule
  ],
  exports: [
    AudioNavigationComponent,
    AudioplayerComponent,
    AudioViewerComponent,
    ProcentPipe,
    LeadingNullPipe
  ]
})
export class OctraComponentsModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faPlay, faPause, faStop, faForward, faStepForward, faStepBackward, faRetweet, faClock, faVolumeUp, faVolumeDown);
  }
}
