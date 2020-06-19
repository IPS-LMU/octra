import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {TranslocoService} from '@ngneat/transloco';
import {SettingsService, TranscriptionService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';

@Component({
  selector: 'octra-transcription-feedback',
  templateUrl: './transcription-feedback.component.html',
  styleUrls: ['./transcription-feedback.component.css']
})
export class TranscriptionFeedbackComponent implements OnInit {

  @Input() feedbackData = {};
  @Input() showCommentFieldOnly = false;
  @ViewChild('fo', {static: true}) feedbackForm: NgForm;

  public get valid(): boolean {
    return this.feedbackForm.valid;
  }

  constructor(public transcrService: TranscriptionService, public langService: TranslocoService, private appStorage: AppStorageService,
              private settingsService: SettingsService) {
  }

  ngOnInit() {
  }

  translate(languages: any, lang: string): string {
    if ((languages[lang] === null || languages[lang] === undefined)) {
      for (const attr in languages) {
        // take first
        if (languages.hasOwnProperty(attr)) {
          return languages[attr];
        }
      }
    }
    return languages[lang];
  }

  public saveFeedbackform() {
    if (!(this.transcrService.feedback.comment === null || this.transcrService.feedback.comment === undefined)
      && this.transcrService.feedback.comment !== '') {
      this.transcrService.feedback.comment = this.transcrService.feedback.comment.replace(/(<)|(\/>)|(>)/g, '\s');
    }
    this.appStorage.comment = this.transcrService.feedback.comment;

    if (!this.settingsService.isTheme('shortAudioFiles')) {
      for (const control in this.feedbackData) {
        if (this.feedbackData.hasOwnProperty(control)) {
          this.changeValue(control, this.feedbackData[control]);
        }
      }
      this.appStorage.save('feedback', this.transcrService.feedback.exportData());
    }
  }

  changeValue(control: string, value: any) {
    const result = this.transcrService.feedback.setValueForControl(control, value.toString());
    console.warn(result);
  }

  public checkBoxChanged(groupName: string, checkb: string) {
    for (const group of this.transcrService.feedback.groups) {
      if (group.name === groupName) {
        for (const control of group.controls) {
          if (control.value === checkb) {
            control.custom.checked = ((control.custom.checked === null || control.custom.checked === undefined))
              ? true : !control.custom.checked;
            break;
          }
        }
        break;
      }
    }
  }
}
