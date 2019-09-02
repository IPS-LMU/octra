import {Component, Input, OnInit} from '@angular/core';
import {AppStorageService, SettingsService, TranscriptionService} from '../../shared/service';
import {AppSettings, ASRLanguage} from '../../obj/Settings';
import {AsrService} from '../../shared/service/asr.service';
import {isNullOrUndefined} from '../../shared/Functions';
import {AudioChunk} from '../../../media-components/obj/media/audio/AudioManager';

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

  constructor(public appStorage: AppStorageService, public settingsService: SettingsService,
              public asrService: AsrService, private transcrService: TranscriptionService) {
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
  }

  startASRForThisSegment() {
    if (!isNullOrUndefined(this.asrService.selectedLanguage)) {
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

  startASRForAllSegmentsNext() {
    const segNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
      this.audioChunk.time.start.browserSample.add(this.audioChunk.time.duration.browserSample)
    );

    if (segNumber > -1) {
      for (let i = segNumber; i < this.transcrService.currentlevel.segments.length; i++) {
        const segment = this.transcrService.currentlevel.segments.get(i);

        if (segment.transcript.trim() === '' && segment.transcript.indexOf(this.transcrService.breakMarker.code) < 0) {
          // segment is empty and contains not a break
          const sampleStart = (i > 0) ? this.transcrService.currentlevel.segments.get(i - 1).time.originalSample.value
            : 0;
          const sampleLength = segment.time.originalSample.value - sampleStart;

          segment.isBlockedBy = 'asr';
          this.asrService.addToQueue({sampleStart, sampleLength});
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
        this.asrService.queue.remove(item.id);
      }
    } else {
      console.error(`could not stop ASR because segment number was not found.`);
    }
  }
}
