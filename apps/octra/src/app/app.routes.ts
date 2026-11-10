import { Routes } from '@angular/router';

import {
  ALoginGuard,
  BrowserTestComponent,
  Error404Component,
  FeaturesComponent,
  HelpToolsComponent,
  InternModule,
  LoadingComponent,
  NewsComponent,
} from './core/pages';
import { AuthSuccessPageComponent } from './core/pages/intern/auth-success/auth-success.page.component';
import { LoginComponent } from './core/pages/login';
import {
  APP_INITIALIZED_GUARD,
  CONFIG_LOADED_GUARD,
} from './core/shared/guard/appconfig-load.guard';
import { IDB_LOADED_GUARD } from './core/shared/guard/idb.activateguard';
import { StresstestComponent } from './core/tools/stresstest/stresstest.component';

export const APP_ROUTES: Routes = [
  { path: 'load', component: LoadingComponent },
  // popup after re-authentication: must not have guards that initialize the app
  { path: 'auth-success', component: AuthSuccessPageComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [APP_INITIALIZED_GUARD, ALoginGuard],
  },
  {
    path: 'intern',
    loadChildren: () => InternModule,
    canActivate: [APP_INITIALIZED_GUARD],
  },
  {
    path: 'test',
    component: BrowserTestComponent,
    canActivate: [CONFIG_LOADED_GUARD, IDB_LOADED_GUARD],
  },
  {
    path: '404',
    component: Error404Component,
    canActivate: [APP_INITIALIZED_GUARD],
  },
  {
    path: 'news',
    component: NewsComponent,
    canActivate: [APP_INITIALIZED_GUARD, CONFIG_LOADED_GUARD, IDB_LOADED_GUARD],
  },
  {
    path: 'features',
    component: FeaturesComponent,
    canActivate: [APP_INITIALIZED_GUARD, CONFIG_LOADED_GUARD, IDB_LOADED_GUARD],
  },
  {
    path: 'help-tools',
    component: HelpToolsComponent,
    canActivate: [APP_INITIALIZED_GUARD, CONFIG_LOADED_GUARD],
  },
  {
    path: 'stresstest',
    component: StresstestComponent,
    canActivate: [APP_INITIALIZED_GUARD, CONFIG_LOADED_GUARD],
  },
];
