import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimespanPipe } from './timespan.pipe';
import { LeadingNullPipe } from './leadingnull.pipe';
import { ProcentPipe } from './procent.pipe';

@NgModule({
  declarations: [TimespanPipe, LeadingNullPipe, ProcentPipe],
  imports: [CommonModule],
  exports: [TimespanPipe, LeadingNullPipe, ProcentPipe],
})
export class OctraUtilitiesModule {}
