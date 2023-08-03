import { NgModule } from '@angular/core';
import { Error404Component } from './error404';
import { FeaturesComponent } from './features';
import { HelpToolsComponent } from './help-tools';
import { LoginComponent } from './login';
import { OctraComponentsModule } from '@octra/ngx-components';
import { InternModule } from './intern';
import { NewsComponent } from './news';
import { StresstestComponent } from '../tools/stresstest/stresstest.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';
import { AppSharedModule } from '../../app.shared.module';
import { MaintenanceModule } from '../component/maintenance/maintenance.module';
import { RouterModule } from '@angular/router';
import { BrowserTestComponent } from './browser-test';

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
