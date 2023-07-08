import { RouterModule, Routes } from '@angular/router';

import {
  BrowserTestComponent,
  Error404Component,
  FeaturesComponent,
  HelpToolsComponent,
  MembersAreaComponent,
  NewsComponent,
} from './core/pages';
import { LoginComponent } from './core/pages/login';
import { MEMBER_ROUTES } from './core/pages/members-area';
import { CompatibilityGuard } from './core/shared/guard/compatibility.guard';
import { StresstestComponent } from './core/tools/stresstest/stresstest.component';

const APP_ROUTES: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [],
  },
  {
    path: 'test',
    component: BrowserTestComponent,
    canActivate: [CompatibilityGuard],
  },
  { path: '404', component: Error404Component },
  {
    path: 'news',
    component: NewsComponent,
    canActivate: [],
  },
  {
    path: 'features',
    component: FeaturesComponent,
    canActivate: [],
  },
  {
    path: 'user',
    component: MembersAreaComponent,
    canActivate: [CompatibilityGuard],
    children: MEMBER_ROUTES,
  },
  { path: 'help-tools', component: HelpToolsComponent },
  { path: 'stresstest', component: StresstestComponent },
  { path: '**', redirectTo: '/404', pathMatch: 'full' },
];

export const routing = RouterModule.forRoot(APP_ROUTES, {
  initialNavigation: 'enabledNonBlocking',
});
