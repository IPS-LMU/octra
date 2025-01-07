import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SubscriberComponent } from './components';
import {
  CapitalLetterPipe,
  FileSizePipe,
  JoinPipe,
  LeadingNullPipe,
  MapPipe,
  ProcentPipe,
  TimespanPipe,
  UnixDurationPipe,
} from './pipes';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TimespanPipe,
    LeadingNullPipe,
    ProcentPipe,
    CapitalLetterPipe,
    JoinPipe,
    MapPipe,
    UnixDurationPipe,
    SubscriberComponent,
    FileSizePipe,
  ],
  exports: [
    TimespanPipe,
    LeadingNullPipe,
    ProcentPipe,
    CapitalLetterPipe,
    JoinPipe,
    MapPipe,
    UnixDurationPipe,
    SubscriberComponent,
    FileSizePipe,
  ],
})
export class OctraUtilitiesModule {}
