import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { OctraComponentsModule } from '@octra/ngx-components';
import { AppSharedModule } from '../../app.shared.module';
import { StresstestComponent } from '../tools/stresstest/stresstest.component';
import { Error404Component } from './error404';
import { FeaturesComponent } from './features';
import { HelpToolsComponent } from './help-tools';
import { InternModule } from './intern';
import { LoginComponent } from './login';
import { NewsComponent } from './news';

import { RouterModule } from '@angular/router';
import { ModalsModule } from '../modals/modals.module';
import { BrowserTestComponent } from './browser-test';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    InternModule,
    OctraComponentsModule,
    AppSharedModule,
    RouterModule,
    TranslocoModule,
    ModalsModule,
    Error404Component,
    FeaturesComponent,
    HelpToolsComponent,
    LoginComponent,
    NewsComponent,
    StresstestComponent,
    BrowserTestComponent,
  ],
  bootstrap: [],
  providers: [],
  exports: [
    Error404Component,
    FeaturesComponent,
    HelpToolsComponent,
    LoginComponent,
    NewsComponent,
    StresstestComponent,
    BrowserTestComponent,
  ],
})
export class PagesModule {}
