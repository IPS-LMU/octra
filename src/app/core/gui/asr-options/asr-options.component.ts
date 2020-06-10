import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {TranslocoService} from '@ngneat/transloco';
import {BsDropdownDirective} from 'ngx-bootstrap/dropdown';
import {AudioChunk, isUnset} from 'octra-components';
import {AppInfo} from '../../../app.info';
import {AppSettings, ASRLanguage} from '../../obj/Settings';
import {AlertService, AppStorageService, SettingsService, TranscriptionService} from '../../shared/service';
import {ASRQueueItemType, AsrService} from '../../shared/service/asr.service';

@Component({
  selector: 'octra-asr-options',
  templateUrl: './asr-options.component.html',
  styleUrls: ['./asr-options.component.css']
})
export class AsrOptionsComponent implements OnInit {

  public serviceProviders = {};
  public settings = {
    onlyForThisOne: false,
    allSegmentsNext: false
  };

  @Input() audioChunk: AudioChunk;
  @Input() enabled = true;
  @ViewChild('dropdown', {static: true}) dropdown: BsDropdownDirective;

  public get appSettings(): AppSettings {
    return this.settingsService.appSettings;
  }

  public get manualURL(): string {
    return AppInfo.manualURL;
  }

  constructor(public appStorage: AppStorageService, public settingsService: SettingsService,
              public asrService: AsrService, private transcrService: TranscriptionService,
              private alertService: AlertService, private langService: TranslocoService) {
    for (const provider of this.appSettings.octra.plugins.asr.services) {
      this.serviceProviders['' + provider.provider] = provider;
    }
  }

  ngOnInit() {

  }

  onMouseMove() {

  }

  onMouseOut() {

  }

  getShortCode(code) {
    return code.substring(code.length - 2);
  }

  onASRLangChanged(lang: ASRLanguage) {
    this.asrService.selectedLanguage = lang;
    this.dropdown.hide();
  }

  startASRForThisSegment() {
    if (!isUnset(this.asrService.selectedLanguage)) {
      if (this.audioChunk.time.duration.seconds > 600) {
        // trigger alert, too big audio duration
        this.alertService.showAlert('danger', this.langService.translate('asr.file too big').toString())
          .catch((error) => {
            console.error(error);
          });
      } else {
        const time = this.audioChunk.time.start.add(this.audioChunk.time.duration);
        const segNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(time);

        if (segNumber > -1) {
          console.log(`SEGNUMBER = ${segNumber} browser sample is ${time.samples}`);
          const segment = this.transcrService.currentlevel.segments.get(segNumber);

          if (!isUnset(segment)) {
            segment.isBlockedBy = ASRQueueItemType.ASR;

            this.asrService.addToQueue({
              sampleStart: this.audioChunk.time.start.samples,
              sampleLength: this.audioChunk.time.duration.samples
            }, ASRQueueItemType.ASR);
            this.asrService.startASR();
          } else {
            console.error(`could not find segment for doing ASR.`);
          }
        } else {
          console.error(`could not start ASR because segment number was not found.`);
        }
      }
    }
  }

  startASRForAllSegmentsNext() {
    const segNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
      this.audioChunk.time.start.add(this.audioChunk.time.duration)
    );

    if (segNumber > -1) {
      for (let i = segNumber; i < this.transcrService.currentlevel.segments.length; i++) {
        const segment = this.transcrService.currentlevel.segments.get(i);

        if (!isUnset(segment)) {
          const sampleStart = (i > 0) ? this.transcrService.currentlevel.segments.get(i - 1).time.samples
            : 0;
          const sampleLength = segment.time.samples - sampleStart;

          if (sampleLength / this.transcrService.audioManager.sampleRate > 600) {
            this.alertService.showAlert('danger', this.langService.translate('asr.file too big')).catch((error) => {
              console.error(error);
            });
            segment.isBlockedBy = null;
          } else {
            if (segment.transcript.trim() === '' && segment.transcript.indexOf(this.transcrService.breakMarker.code) < 0) {
              // segment is empty and contains not a break
              segment.isBlockedBy = ASRQueueItemType.ASR;
              this.asrService.addToQueue({
                sampleStart, sampleLength
              }, ASRQueueItemType.ASR);
            }
          }
        } else {
          console.error(`could not find segment in startASRForAllSegmentsNext()`);
        }
      }
      this.asrService.startASR();
    } else {
      console.error(`could not start ASR for all next because segment number was not found.`);
    }
  }

  stopASRForAll() {
    this.asrService.stopASR();
    this.asrService.queue.clear();
  }

  stopASRForThisSegment() {
    if (!isUnset(this.asrService.selectedLanguage)) {
      const item = this.asrService.queue.getItemByTime(this.audioChunk.time.start.samples, this.audioChunk.time.duration.samples);

      if (item !== undefined) {
        this.asrService.stopASROfItem(item);
      }
    } else {
      console.error(`could not stop ASR because segment number was not found.`);
    }
  }
}
