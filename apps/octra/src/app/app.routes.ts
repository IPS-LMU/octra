import { RouterModule, Routes } from "@angular/router";

import {
  BrowserTestComponent,
  Error404Component,
  FeaturesComponent,
  HelpToolsComponent,
  MembersAreaComponent,
  NewsComponent
} from "./core/pages";
import { ALoginGuard, LoginComponent } from "./core/pages/login";
import { MEMBER_ROUTES } from "./core/pages/members-area";
import { SettingsGuard } from "./core/shared/guard";
import { CompatibilityGuard } from "./core/shared/guard/compatibility.guard";
import { StresstestComponent } from "./core/tools/stresstest/stresstest.component";

const APP_ROUTES: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent, canActivate: [SettingsGuard, CompatibilityGuard, ALoginGuard]},
  {path: 'test', component: BrowserTestComponent, canActivate: [SettingsGuard, CompatibilityGuard]},
  {path: '404', component: Error404Component},
  {path: 'news', component: NewsComponent, canActivate: [SettingsGuard]},
  {path: 'features', component: FeaturesComponent, canActivate: [SettingsGuard]},
  {
    path: 'user',
    component: MembersAreaComponent,
    canActivate: [SettingsGuard, CompatibilityGuard],
    children: MEMBER_ROUTES
  },
  {path: 'help-tools', component: HelpToolsComponent},
  {path: 'stresstest', component: StresstestComponent},
  {path: '**', redirectTo: '/404', pathMatch: 'full'}
];

export const routing = RouterModule.forRoot(APP_ROUTES, {initialNavigation: 'enabledNonBlocking'});
