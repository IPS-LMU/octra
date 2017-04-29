import {Routes} from '@angular/router';
import {TranscriptionComponent} from '../transcription/transcription.component';
import {TranscriptionSubmitComponent} from '../transcription-submit/transcription-submit.component';
import {MembersAreaGuard} from '../../guard/ma.activateguard';
import {TranscriptionSubmittedComponent} from '../transcription-submitted/transcription-submitted.component';
import {TranscrSubmittedGuard} from '../../guard/transcr-submitted.activateguard';
import {ReloadFileComponent} from '../reload-file/reload-file.component';
import {ReloadFileGuard} from '../../guard/reload-file.activateguard';
import {LoadingComponent} from '../load-data/loading.component';
import {TranscActivateGuard} from '../../guard/transcr.activateguard';
import {AgreementComponent} from '../agreement/agreement.component';

export const MEMBER_ROUTES: Routes = [
  {path: '', redirectTo: '/user/load', pathMatch: 'full'},
  {path: 'load', component: LoadingComponent},
  {path: 'agreement', component: AgreementComponent, canActivate: [MembersAreaGuard]},
  {
    path: 'transcr',
    component: TranscriptionComponent,
    canActivate: [TranscActivateGuard, MembersAreaGuard]
  },
  {path: 'transcr/submit', component: TranscriptionSubmitComponent, canActivate: [TranscActivateGuard]},
  {
    path: 'transcr/submitted',
    component: TranscriptionSubmittedComponent,
    canActivate: [TranscrSubmittedGuard]
  },
  {path: 'transcr/reload-file', component: ReloadFileComponent, canActivate: [ReloadFileGuard]}
];
