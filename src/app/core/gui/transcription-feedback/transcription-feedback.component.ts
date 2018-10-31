import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {AppStorageService, SettingsService, TranscriptionService} from '../../shared/service';
import {TranslateService} from '@ngx-translate/core';
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-transcription-feedback',
  templateUrl: './transcription-feedback.component.html',
  styleUrls: ['./transcription-feedback.component.css']
})
export class TranscriptionFeedbackComponent implements OnInit {

  @Input() feedback_data = {};
  @Input() showCommentFieldOnly = false;
  @ViewChild('fo') feedback_form: NgForm;

  public get valid(): boolean {
    return this.feedback_form.valid;
  }

  constructor(public transcrService: TranscriptionService, public langService: TranslateService, private appStorage: AppStorageService,
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
      for (const control in this.feedback_data) {
        if (this.feedback_data.hasOwnProperty(control)) {
          this.changeValue(control, this.feedback_data[control]);
        }
      }
      this.appStorage.save('feedback', this.transcrService.feedback.exportData());
    }
  }

  changeValue(control: string, value: any) {
    const result = this.transcrService.feedback.setValueForControl(control, value.toString());
    console.warn(result);
  }

  public checkBoxChanged(group: string, checkb: string) {
    for (let i = 0; i < this.transcrService.feedback.groups.length; i++) {
      const group_ = this.transcrService.feedback.groups[i];
      if (group_.name === group) {
        for (let j = 0; j < group_.controls.length; j++) {
          const control = group_.controls[j];
          if (control.value === checkb) {
            control.custom['checked'] = ((control.custom['checked'] === null || control.custom['checked'] === undefined))
              ? true : !control.custom['checked'];
            break;
          }
        }
        break;
      }
    }
  }
}
