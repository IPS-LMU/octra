import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MaintenanceBannerComponent } from "./maintenance-banner/maint-banner.component";
import { TranslocoModule } from "@ngneat/transloco";


@NgModule({
  declarations: [
    MaintenanceBannerComponent
  ],
  imports: [
    CommonModule,
    TranslocoModule
  ],
  exports: [
    MaintenanceBannerComponent
  ]
})
export class MaintenanceModule {
}
