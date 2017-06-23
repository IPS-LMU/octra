import {RouterModule, Routes} from '@angular/router';

import {LoginComponent} from './core/gui/login/login.component';
import {MEMBER_ROUTES} from './core/gui/members-area/members-area.routes';
import {MembersAreaComponent} from './core/gui/members-area/members-area.component';
import {ALoginGuard} from './core/gui/login/login.activateguard';
import {LogoutComponent} from './core/gui/logout/logout.component';
import {LogoutGuard} from './core/gui/logout/logout.guard';
import {SettingsGuard} from './core/shared/guard/settings.activateguard';
import {NewsComponent} from './core/gui/news/news.component';
import {FaqComponent} from './core/gui/faq/faq.component';

const APP_ROUTES: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login', component: LoginComponent, canActivate: [SettingsGuard, ALoginGuard]},
  {path: 'news', component: NewsComponent, canActivate: [SettingsGuard, ALoginGuard]},
  {path: 'faq', component: FaqComponent, canActivate: [SettingsGuard, ALoginGuard]},
  {path: 'logout', component: LogoutComponent, canActivate: [SettingsGuard, LogoutGuard]},
  {path: 'user', component: MembersAreaComponent, canActivate: [SettingsGuard], children: MEMBER_ROUTES},
  {path: '**', redirectTo: '/login', pathMatch: 'full'}
];

export const routing = RouterModule.forRoot(APP_ROUTES);
