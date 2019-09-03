import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AppStorageService, MessageService, SettingsService, TranscriptionService} from '../../shared/service';
import {AppSettings, ASRLanguage} from '../../obj/Settings';
import {AsrService} from '../../shared/service/asr.service';
import {isNullOrUndefined} from '../../shared/Functions';
import {AudioChunk} from '../../../media-components/obj/media/audio/AudioManager';
import {TranslateService} from '@ngx-translate/core';
import {BsDropdownDirective} from 'ngx-bootstrap';

@Component({
  selector: 'app-asr-options',
  templateUrl: './asr-options.component.html',
  styleUrls: ['./asr-options.component.css']
})
export class AsrOptionsComponent implements OnInit {

  public get appSettings(): AppSettings {
    return this.settingsService.appSettings;
  }

  public serviceProviders = {};
  public settings = {
    onlyForThisOne: false,
    allSegmentsNext: false
  };

  @Input() audioChunk: AudioChunk;
  @Input() enabled = true;
  @ViewChild('dropdown', {static: true}) dropdown: BsDropdownDirective;

  constructor(public appStorage: AppStorageService, public settingsService: SettingsService,
              public asrService: AsrService, private transcrService: TranscriptionService,
              private messageService: MessageService, private langService: TranslateService) {
    for (let i = 0; i < this.appSettings.octra.plugins.asr.services.length; i++) {
      const provider = this.appSettings.octra.plugins.asr.services[i];
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
    if (!isNullOrUndefined(this.asrService.selectedLanguage)) {
      if (this.audioChunk.time.duration.originalSample.seconds > 600) {
        // trigger alert, too big audio duration
        this.messageService.showMessage('error', this.langService.instant('asr.file too big'));
      } else {
        const segNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
          this.audioChunk.time.start.browserSample.add(this.audioChunk.time.duration.browserSample)
        );

        if (segNumber > -1) {
          this.transcrService.currentlevel.segments.get(segNumber).isBlockedBy = 'asr';
          this.asrService.addToQueue({
            sampleStart: this.audioChunk.time.start.originalSample.value,
            sampleLength: this.audioChunk.time.duration.originalSample.value
          });
          this.asrService.startASR();
        } else {
          console.error(`could not start ASR because segment number was not found.`);
        }
      }
    }
  }

  startASRForAllSegmentsNext() {
    const segNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
      this.audioChunk.time.start.browserSample.add(this.audioChunk.time.duration.browserSample)
    );

    if (segNumber > -1) {
      for (let i = segNumber; i < this.transcrService.currentlevel.segments.length; i++) {
        const segment = this.transcrService.currentlevel.segments.get(i);
        const sampleStart = (i > 0) ? this.transcrService.currentlevel.segments.get(i - 1).time.originalSample.value
          : 0;
        const sampleLength = segment.time.originalSample.value - sampleStart;

        if (sampleLength / this.transcrService.audiomanager.originalSampleRate > 600) {
          this.messageService.showMessage('error', this.langService.instant('asr.file too big'));
          segment.isBlockedBy = 'none';
        } else {
          if (segment.transcript.trim() === '' && segment.transcript.indexOf(this.transcrService.breakMarker.code) < 0) {
            // segment is empty and contains not a break
            segment.isBlockedBy = 'asr';
            this.asrService.addToQueue({sampleStart, sampleLength});
          }
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
    if (!isNullOrUndefined(this.asrService.selectedLanguage)) {
      const item = this.asrService.queue.getItemByTime(this.audioChunk.time.start.originalSample.value, this.audioChunk.time.duration.originalSample.value);

      if (item !== undefined) {
        this.asrService.stopASROfItem(item);
      }
    } else {
      console.error(`could not stop ASR because segment number was not found.`);
    }
  }
}
