import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { OctraComponentsModule } from '@octra/ngx-components';
import { AppSharedModule } from '../../app.shared.module';
import { MaintenanceModule } from '../component/maintenance/maintenance.module';
import { ModalsModule } from '../modals/modals.module';
import { StresstestComponent } from '../tools/stresstest/stresstest.component';
import { BrowserTestComponent } from './browser-test';
import { Error404Component } from './error404';
import { FeaturesComponent } from './features';
import { HelpToolsComponent } from './help-tools';
import { InternModule } from './intern';
import { LoginComponent } from './login';
import { NewsComponent } from './news';

@NgModule({
  declarations: [
    Error404Component,
    FeaturesComponent,
    HelpToolsComponent,
    LoginComponent,
    NewsComponent,
    StresstestComponent,
    BrowserTestComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MaintenanceModule,
    InternModule,
    OctraComponentsModule,
    AppSharedModule,
    RouterModule,
    TranslocoModule,
    ModalsModule,
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
