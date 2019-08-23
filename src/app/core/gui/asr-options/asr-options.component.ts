import {Component, Input, OnInit} from '@angular/core';
import {AppStorageService, SettingsService} from '../../shared/service';
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

  constructor(public appStorage: AppStorageService, public settingsService: SettingsService,
              public asrService: AsrService) {
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

  checkBoxesChanged() {
    // test ASR
    if (!isNullOrUndefined(this.asrService.selectedLanguage)) {
      this.asrService.transcribeSignalWithASR(this.audioChunk).subscribe(
        (result: string) => {
          console.log('ASR Result:');
          console.log(result);
        },
        error => {
          console.error(error);
        }
      );
    }
  }
}
