import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {AppStorageService, SettingsService} from '../../shared/service';
import {AppSettings, ASRLanguage} from '../../obj/Settings';
import {ASRQueueItem, AsrService} from '../../shared/service/asr.service';
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

  private asrQueueItem: ASRQueueItem;

  constructor(public appStorage: AppStorageService, public settingsService: SettingsService,
              public asrService: AsrService, private cd: ChangeDetectorRef) {
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
    // test ASR
    if (!isNullOrUndefined(this.asrService.selectedLanguage)) {
      this.asrQueueItem = this.asrService.addToQueue(this.audioChunk);
      this.asrService.startASR();
    }
  }

  startASRForAllSegmentsNext() {

  }

  stopASRForAll() {
    this.asrService.stopASR();
    this.asrService.queue.clear();
  }

  stopASRForThisSegment() {
    this.asrService.queue.remove(this.asrQueueItem.id);
    this.asrQueueItem.stopProcessing();
  }
}
