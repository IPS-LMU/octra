import {Routes} from '@angular/router';
import {TranscriptionComponent} from '../transcription/transcription.component';
import {MembersAreaGuard} from '../../guard/ma.activateguard';
import {TranscriptionEndComponent} from '../transcription-end/transcription-end.component';
import {TranscrEndGuard} from '../../guard/transcr-end.activateguard';
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
  {
    path: 'transcr/end',
    component: TranscriptionEndComponent,
    canActivate: [TranscrEndGuard]
  },
  {path: 'transcr/reload-file', component: ReloadFileComponent, canActivate: [ReloadFileGuard]}
];
