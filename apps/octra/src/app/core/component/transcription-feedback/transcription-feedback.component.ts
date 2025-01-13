import { AsyncPipe } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { getProperties } from '@octra/utilities';
import { SettingsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';

@Component({
  selector: 'octra-transcription-feedback',
  templateUrl: './transcription-feedback.component.html',
  styleUrls: ['./transcription-feedback.component.scss'],
  imports: [FormsModule, AsyncPipe, TranslocoPipe],
})
export class TranscriptionFeedbackComponent implements OnChanges, OnDestroy {
  @Input() feedbackData = {};
  @Input() showCommentFieldOnly = false;
  @ViewChild('fo', { static: true }) feedbackForm!: NgForm;

  comment = '';

  public get valid(): boolean {
    return this.feedbackForm.valid!;
  }

  internFeedbackData: {
    name: string;
    value: any;
  }[] = [];

  constructor(
    public annotationStoreService: AnnotationStoreService,
    public langService: TranslocoService,
    private appStorage: AppStorageService,
    private settingsService: SettingsService
  ) {}

  translate(languages: any, lang: string): string {
    if (languages[lang] === undefined || languages[lang] === undefined) {
      return getProperties(languages)[0][1] as string;
    }
    return languages[lang];
  }

  public saveFeedbackform() {
    if (
      !(this.annotationStoreService?.feedback?.comment === undefined) &&
      this.annotationStoreService.feedback.comment !== ''
    ) {
      this.annotationStoreService.changeFeedback({
        ...this.annotationStoreService.feedback,
        comment: this.annotationStoreService.feedback.comment.replace(
          /(<)|(\/>)|(>)/g,
          ' '
        ),
      });
    }
    this.annotationStoreService.comment =
      this.annotationStoreService?.feedback?.comment;

    if (!this.settingsService.isTheme('shortAudioFiles')) {
      for (const [name, value] of getProperties(this.feedbackData)) {
        this.changeValue(name, value);
      }
      this.appStorage.save(
        'feedback',
        this.annotationStoreService?.feedback?.exportData()
      );
    }
  }

  changeValue(control: string, value: any) {
    const result = this.annotationStoreService.feedback.setValueForControl(
      control,
      value.toString()
    );
    this.annotationStoreService.changeFeedback(
      this.annotationStoreService.feedback
    );
    console.warn(result);
  }

  ngOnChanges(changes: SimpleChanges) {
    const feedbackData = changes['feedbackData'];

    if (feedbackData) {
      if (!feedbackData.currentValue) {
        this.internFeedbackData = [];
      } else {
        for (const key of Object.keys(feedbackData.currentValue)) {
          this.internFeedbackData.push({
            name: key,
            value: feedbackData.currentValue[key],
          });
        }
      }
    }
  }

  public checkBoxChanged(groupName: string, checkb: string) {
    for (const group of this.annotationStoreService.feedback.groups) {
      if (group.name === groupName) {
        for (const control of group.controls) {
          if (control.value === checkb) {
            control.custom.checked =
              control.custom.checked === undefined ||
              control.custom.checked === undefined
                ? true
                : !control.custom.checked;
            break;
          }
        }
        break;
      }
    }
  }

  ngOnDestroy() {
    this.annotationStoreService.comment = this.comment;
  }
}
