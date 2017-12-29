import {Routes} from '@angular/router';
import {TranscriptionComponent} from '../transcription';
import {MembersAreaGuard} from './members-area.activateguard';
import {TranscriptionEndComponent} from '../transcription-end';
import {TranscrEndGuard} from '../../shared/guard';
import {ReloadFileComponent} from '../reload-file';
import {ReloadFileGuard} from '../reload-file/reload-file.activateguard';
import {LoadingComponent} from '../loading';
import {TranscActivateGuard} from '../../shared/guard/transcr.activateguard';
import {AgreementComponent} from '../agreement/agreement.component';
import {HelpComponent} from '../help/help.component';

export const MEMBER_ROUTES: Routes = [
  {path: 'load', component: LoadingComponent},
  {path: 'agreement', component: AgreementComponent, canActivate: [MembersAreaGuard]},
  {
    path: 'transcr',
    component: TranscriptionComponent,
    canActivate: [TranscActivateGuard, MembersAreaGuard]
  },
  {path: 'transcr/help', component: HelpComponent, canActivate: [TranscActivateGuard, MembersAreaGuard]},
  {
    path: 'transcr/end',
    component: TranscriptionEndComponent,
    canActivate: [TranscrEndGuard]
  },
  {path: 'transcr/reload-file', component: ReloadFileComponent, canActivate: [ReloadFileGuard]},
  {path: '', redirectTo: 'load', pathMatch: 'full'},
  {path: '**', redirectTo: '/404', pathMatch: 'full'}
];
