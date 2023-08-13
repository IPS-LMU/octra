import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { ProjectsListComponent } from './projects-list/projects-list.component';
import { AUTHENTICATED_GUARD } from './intern.activateguard';
import { TranscriptionComponent } from './transcription';
import { TranscActivateGuard } from '../../shared/guard/transcr.activateguard';
import { TranscriptionEndComponent } from './transcription-end';
import { TranscrEndGuard } from '../../shared/guard';
import { ReloadFileComponent } from './reload-file';
import { ReloadFileGuard } from './reload-file/reload-file.activateguard';
import { AuthComponent } from './auth';
import {AuthSuccessPageComponent} from './auth-success/auth-success.page.component';

const MEMBER_ROUTES: Routes = [
  {
    path: 'projects',
    component: ProjectsListComponent,
    canActivate: [AUTHENTICATED_GUARD],
  },
  {
    path: 'transcr',
    component: TranscriptionComponent,
    canActivate: [AUTHENTICATED_GUARD, TranscActivateGuard],
  },
  {
    path: 'transcr/end',
    component: TranscriptionEndComponent,
    canActivate: [TranscrEndGuard],
  },
  {
    path: 'transcr/reload-file',
    component: ReloadFileComponent,
    canActivate: [ReloadFileGuard],
  },
  { path: 'auth', component: AuthComponent },
  { path: 'auth-success', component: AuthSuccessPageComponent },
  { path: '', redirectTo: '/load', pathMatch: 'full' },
  //{ path: '**', redirectTo: '/404', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(MEMBER_ROUTES)],
  exports: [RouterModule],
})
export class InternRoutingModule {}
