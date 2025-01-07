import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { MaintenanceBannerComponent } from './maintenance-banner/maint-banner.component';

@NgModule({
  declarations: [MaintenanceBannerComponent],
  imports: [CommonModule, TranslocoModule],
  exports: [MaintenanceBannerComponent],
})
export class MaintenanceModule {}
