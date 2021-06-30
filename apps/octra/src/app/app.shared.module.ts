import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FaIconLibrary, FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {
  faAlignJustify,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faBars,
  faBook,
  faCheck,
  faChevronDown,
  faChevronUp,
  faCircle,
  faClock,
  faCog,
  faCopy,
  faDatabase,
  faDoorOpen,
  faDownload,
  faEdit,
  faEraser,
  faExchangeAlt,
  faExclamationTriangle,
  faEye,
  faFile,
  faFolderOpen,
  faForward,
  faGlobe,
  faGripLines,
  faHouseUser,
  faInfoCircle,
  faKeyboard,
  faLongArrowAltRight,
  faMinus,
  faObjectGroup,
  faPaperPlane,
  faPause,
  faPlay,
  faPlus,
  faPrint,
  faQuestionCircle,
  faRetweet,
  faSave,
  faSearch,
  faSignOutAlt,
  faSpinner,
  faStar,
  faStepBackward,
  faStepForward,
  faStop,
  faTable,
  faThList,
  faTimes,
  faTimesCircle,
  faTools,
  faTrash,
  faTrashAlt,
  faUniversity,
  faUserCheck,
  faUserCircle,
  faVolumeDown,
  faVolumeUp,
  faWindowMaximize
} from '@fortawesome/free-solid-svg-icons';
import {faHandshake} from '@fortawesome/free-regular-svg-icons';
import {faDropbox, faGithub} from '@fortawesome/free-brands-svg-icons';
import {TranslocoModule} from '@ngneat/transloco';
import {TranslocoConfigProvider, TranslocoLoaderProvider} from './app.transloco';
import {AsrOptionsComponent} from './core/component/asr-options/asr-options.component';
import {TranscriptionFeedbackComponent} from './core/component/transcription-feedback/transcription-feedback.component';
import {ClipTextPipe} from './core/shared/clip-text.pipe';
import {FormsModule} from '@angular/forms';


@NgModule({
  declarations: [
    AsrOptionsComponent,
    TranscriptionFeedbackComponent,
    ClipTextPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    TranslocoModule
  ],
  providers: [
    TranslocoConfigProvider,
    TranslocoLoaderProvider
  ],
  exports: [
    AsrOptionsComponent,
    TranscriptionFeedbackComponent,
    ClipTextPipe
  ]
})
export class AppSharedModule {

  constructor(library: FaIconLibrary) {
    library.addIcons(
      faPaperPlane,
      faTrashAlt,
      faDatabase,
      faExclamationTriangle,
      faHandshake,
      faGlobe,
      faQuestionCircle,
      faObjectGroup,
      faEraser,
      faTrash,
      faDropbox,
      faMinus,
      faWindowMaximize,
      faAlignJustify,
      faTable,
      faThList,
      faBook,
      faCopy,
      faPlus,
      faInfoCircle,
      faTools,
      faDownload,
      faCog,
      faTimes,
      faCheck,
      faSpinner,
      faKeyboard,
      faEye,
      faChevronUp,
      faChevronDown,
      faSave,
      faStar,
      faPrint,
      faSearch,
      faUserCheck,
      faSignOutAlt,
      faFile,
      faTimesCircle,
      faGripLines,
      faArrowLeft,
      faArrowRight,
      faPlay,
      faStop,
      faPause,
      faExchangeAlt,
      faCircle,
      faArrowUp,
      faArrowDown,
      faLongArrowAltRight,
      faBars,
      faEdit,
      faFolderOpen,
      faUniversity,
      faHouseUser, faForward, faStepForward, faStepBackward, faRetweet, faClock, faVolumeUp, faVolumeDown, faUserCircle,
      faGithub, faDoorOpen
    );
  }
}
