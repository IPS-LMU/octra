import {RouterModule, Routes} from '@angular/router';

import {Error404Component, FeaturesComponent, HelpToolsComponent, LoginComponent, LogoutComponent, MembersAreaComponent} from './core/gui';
import {MEMBER_ROUTES} from './core/gui/members-area/members-area.routes';
import {ALoginGuard} from './core/gui/login/login.activateguard';
import {LogoutGuard} from './core/gui/logout/logout.guard';
import {SettingsGuard} from './core/shared/guard';
import {NewsComponent} from './core/gui/news/news.component';
import {BrowserTestComponent} from './core/gui/browser-test/browser-test.component';
import {CompatibilityGuard} from './core/shared/guard/compatibility.guard';
import {StresstestComponent} from './core/tools/stresstest/stresstest.component';

const APP_ROUTES: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent, canActivate: [SettingsGuard, CompatibilityGuard, ALoginGuard]},
  {path: 'test', component: BrowserTestComponent, canActivate: [SettingsGuard, CompatibilityGuard]},
  {path: '404', component: Error404Component},
  {path: 'news', component: NewsComponent, canActivate: [SettingsGuard]},
  {path: 'features', component: FeaturesComponent, canActivate: [SettingsGuard]},
  {path: 'logout', component: LogoutComponent, canActivate: [SettingsGuard, LogoutGuard]},
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

export const routing = RouterModule.forRoot(APP_ROUTES);
