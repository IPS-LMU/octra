import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TranscActivateGuard } from '../../shared/guard/transcr.activateguard';
import { AuthComponent } from './auth';
import { AuthSuccessPageComponent } from './auth-success/auth-success.page.component';
import { AUTHENTICATED_GUARD } from './intern.activateguard';
import { ProjectsListComponent } from './projects-list/projects-list.component';
import { ReloadFileComponent } from './reload-file';
import { ReloadFileGuard } from './reload-file/reload-file.activateguard';
import { TranscriptionComponent } from './transcription';
import { TranscriptionEndComponent } from './transcription-end';

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
  },
  {
    path: 'transcr/reload-file',
    component: ReloadFileComponent,
    canActivate: [ReloadFileGuard],
  },
  { path: 'auth', component: AuthComponent },
  { path: 'auth-success', component: AuthSuccessPageComponent },
  { path: '', redirectTo: '/load', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(MEMBER_ROUTES)],
  exports: [RouterModule],
})
export class InternRoutingModule {}
