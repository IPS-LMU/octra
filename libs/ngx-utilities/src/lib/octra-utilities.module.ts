import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimespanPipe } from './pipes/timespan.pipe';
import { LeadingNullPipe } from './pipes/leadingnull.pipe';
import { ProcentPipe } from './pipes/procent.pipe';

@NgModule({
  declarations: [TimespanPipe, LeadingNullPipe, ProcentPipe],
  imports: [CommonModule],
  exports: [TimespanPipe, LeadingNullPipe, ProcentPipe],
})
export class OctraUtilitiesModule {}
