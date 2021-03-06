import {Routes} from '@angular/router';
import {TranscrEndGuard} from '../../shared/guard';
import {TranscActivateGuard} from '../../shared/guard/transcr.activateguard';
import {AuthComponent} from '../auth/auth.component';
import {LoadingComponent} from '../loading';
import {ReloadFileComponent} from '../reload-file';
import {ReloadFileGuard} from '../reload-file/reload-file.activateguard';
import {TranscriptionComponent} from '../transcription';
import {TranscriptionEndComponent} from '../transcription-end';
import {MembersAreaGuard} from './members-area.activateguard';
import {ProjectsListComponent} from '../projects-list/projects-list.component';

export const MEMBER_ROUTES: Routes = [
  {path: 'load', component: LoadingComponent},
  {
    path: 'projects',
    component: ProjectsListComponent,
    canActivate: [MembersAreaGuard]
  },
  {
    path: 'transcr',
    component: TranscriptionComponent,
    canActivate: [MembersAreaGuard, TranscActivateGuard]
  },
  {
    path: 'transcr/end',
    component: TranscriptionEndComponent,
    canActivate: [TranscrEndGuard]
  },
  {path: 'transcr/reload-file', component: ReloadFileComponent, canActivate: [ReloadFileGuard]},
  {path: 'auth', component: AuthComponent},
  {path: '', redirectTo: 'load', pathMatch: 'full'},
  {path: '**', redirectTo: '/404', pathMatch: 'full'}
];
