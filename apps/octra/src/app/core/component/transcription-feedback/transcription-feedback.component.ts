import {Component, Input, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {TranslocoService} from '@ngneat/transloco';
import {SettingsService, TranscriptionService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';

@Component({
  selector: 'octra-transcription-feedback',
  templateUrl: './transcription-feedback.component.html',
  styleUrls: ['./transcription-feedback.component.css']
})
export class TranscriptionFeedbackComponent {

  @Input() feedbackData = {};
  @Input() showCommentFieldOnly = false;
  @ViewChild('fo', {static: true}) feedbackForm: NgForm;

  public get valid(): boolean {
    return this.feedbackForm.valid;
  }

  constructor(public transcrService: TranscriptionService, public langService: TranslocoService, private appStorage: AppStorageService,
              private settingsService: SettingsService) {
  }

  translate(languages: any, lang: string): string {
    if ((languages[lang] === null || languages[lang] === undefined)) {
      return Object.entries(languages)[0][1] as string;
    }
    return languages[lang];
  }

  public saveFeedbackform() {
    if (!(this.transcrService.feedback.comment === null || this.transcrService.feedback.comment === undefined)
      && this.transcrService.feedback.comment !== '') {
      this.transcrService.feedback.comment = this.transcrService.feedback.comment.replace(/(<)|(\/>)|(>)/g, ' ');
    }
    this.appStorage.comment = this.transcrService.feedback.comment;

    if (!this.settingsService.isTheme('shortAudioFiles')) {
      for (const [name, value] of Object.entries(this.feedbackData)) {
        this.changeValue(name, value);
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
