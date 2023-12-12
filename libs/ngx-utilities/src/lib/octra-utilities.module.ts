import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CapitalLetterPipe,
  JoinPipe,
  LeadingNullPipe,
  MapPipe,
  ProcentPipe,
  TimespanPipe,
  UnixDurationPipe,
} from './pipes';

@NgModule({
  declarations: [
    TimespanPipe,
    LeadingNullPipe,
    ProcentPipe,
    CapitalLetterPipe,
    JoinPipe,
    MapPipe,
    UnixDurationPipe,
  ],
  imports: [CommonModule],
  exports: [
    TimespanPipe,
    LeadingNullPipe,
    ProcentPipe,
    CapitalLetterPipe,
    JoinPipe,
    MapPipe,
    UnixDurationPipe,
  ],
})
export class OctraUtilitiesModule {}
