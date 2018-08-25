import {RouterModule, Routes} from '@angular/router';

import {
  Error404Component, FeaturesComponent, HelpToolsComponent, LoginComponent, LogoutComponent,
  MembersAreaComponent
} from './core/gui';
import {MEMBER_ROUTES} from './core/gui/members-area/members-area.routes';
import {ALoginGuard} from './core/gui/login/login.activateguard';
import {LogoutGuard} from './core/gui/logout/logout.guard';
import {SettingsGuard} from './core/shared/guard';
import {NewsComponent} from './core/gui/news/news.component';
import {FaqComponent} from './core/gui/faq/faq.component';
import {BrowserTestComponent} from './core/gui/browser-test/browser-test.component';

const APP_ROUTES: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent, canActivate: [SettingsGuard, ALoginGuard]},
  {path: 'test', component: BrowserTestComponent},
  {path: '404', component: Error404Component},
  {path: 'news', component: NewsComponent, canActivate: [SettingsGuard]},
  {path: 'faq', component: FaqComponent, canActivate: [SettingsGuard]},
  {path: 'features', component: FeaturesComponent, canActivate: [SettingsGuard]},
  {path: 'logout', component: LogoutComponent, canActivate: [SettingsGuard, LogoutGuard]},
  {path: 'user', component: MembersAreaComponent, canActivate: [SettingsGuard], children: MEMBER_ROUTES},
  {path: 'help-tools', component: HelpToolsComponent},
  {path: '**', redirectTo: '/404', pathMatch: 'full'}
];

export const routing = RouterModule.forRoot(APP_ROUTES);
