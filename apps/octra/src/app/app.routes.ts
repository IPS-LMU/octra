import { RouterModule, Routes } from '@angular/router';

import {
  BrowserTestComponent,
  Error404Component,
  FeaturesComponent,
  HelpToolsComponent, InternModule,
  NewsComponent
} from "./core/pages";
import { LoginComponent } from './core/pages/login';
import { CompatibilityGuard } from './core/shared/guard/compatibility.guard';
import { StresstestComponent } from './core/tools/stresstest/stresstest.component';
import { CONFIG_LOADED_GUARD } from './core/shared/guard/appconfig-load.guard';
import { IDB_LOADED_GUARD } from './core/shared/guard/idb.activateguard';

const APP_ROUTES: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [CONFIG_LOADED_GUARD, IDB_LOADED_GUARD],
  },
  {
    path: 'intern',
    loadChildren: () => InternModule,
    canActivate: [],
  },
  {
    path: 'test',
    component: BrowserTestComponent,
    canActivate: [CONFIG_LOADED_GUARD, IDB_LOADED_GUARD, CompatibilityGuard],
  },
  { path: '404', component: Error404Component },
  {
    path: 'news',
    component: NewsComponent,
    canActivate: [CONFIG_LOADED_GUARD, IDB_LOADED_GUARD],
  },
  {
    path: 'features',
    component: FeaturesComponent,
    canActivate: [CONFIG_LOADED_GUARD, IDB_LOADED_GUARD],
  },
  { path: 'help-tools', component: HelpToolsComponent },
  { path: 'stresstest', component: StresstestComponent },
  { path: '**', redirectTo: '/404', pathMatch: 'full' },
];

export const routing = RouterModule.forRoot(APP_ROUTES, {
  initialNavigation: 'enabledNonBlocking',
});
