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
import { SubscriberComponent } from './components';

@NgModule({
  declarations: [
    TimespanPipe,
    LeadingNullPipe,
    ProcentPipe,
    CapitalLetterPipe,
    JoinPipe,
    MapPipe,
    UnixDurationPipe,
    SubscriberComponent,
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
    SubscriberComponent,
  ],
})
export class OctraUtilitiesModule {}
