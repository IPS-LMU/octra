import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MaintenanceBannerComponent} from './maintenance-banner/maint-banner.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {TranslocoModule} from '@ngneat/transloco';


@NgModule({
  declarations: [
    MaintenanceBannerComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    TranslocoModule
  ],
  exports: [
    MaintenanceBannerComponent
  ]
})
export class MaintenanceModule {
}
