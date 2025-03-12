import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { JoditConfig, NgxJoditComponent } from 'ngx-jodit';
import { Observable, Subject, timer } from 'rxjs';
import { BugReportTranslations } from './types';

const defaultTranslations: BugReportTranslations = {
  giveFeedback: 'Give Feedback',
  error:
    'Unfortunately your feedback could not be sent to us. Please send us an e-mail to {{email}}.',
  introduction:
    'Please tell us what you think about this web application. What can we do better? Did you find any bugs?',
  bugReportSent: 'Your feedback was successfully reported \uD83D\uDE42',
  addProtocol: 'Add Protocol (recommended)',
  eMail: 'E-Mail',
  name: 'Name',
  description: 'Description',
  screenshots: 'Screenshots',
  protocol: 'Protocol',
  abort: 'Abort',
  sendFeedback: 'Send Feedback',
  sending: 'Please wait while sending your feedback...',
};

@Component({
  selector: 'octra-bugreport-modal',
  standalone: true,
  templateUrl: './bugreport-modal.component.html',
  styleUrls: ['./bugreport-modal.component.scss'],
  imports: [FormsModule, NgxJoditComponent],
})
export class BugreportModalComponent
  extends SubscriberComponent
  implements AfterViewInit
{
  @ViewChild('editor') editor?: NgxJoditComponent;
  public static options: NgbModalOptions = {
    size: 'xl',
    keyboard: false,
    backdrop: true,
  };

  joditOptions: JoditConfig = {
    maxHeight: 300,
    buttons: [
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'align',
      'ul',
      'ol',
      'brush',
    ],
    statusbar: false,
    placeholder: 'Please write a message in German or English...',
  };
  public visible = false;
  public bgdescr = '';
  public sendProObj = true;
  public bugsent = false;
  public sendStatus: 'pending' | 'success' | 'error' | 'sending' = 'pending';
  public action: Subject<unknown> = new Subject<unknown>();
  public screenshots: {
    blob: Blob;
    previewURL: string;
  }[] = [];
  protected data = undefined;

  _profile?: {
    email?: string;
    name?: string;
  } = {};

  protected set email(email: string) {
    this._profile = { ...(this._profile ?? {}), ...(email ? { email } : {}) };
    this.profileChange.emit(this._profile);
  }

  protected get email(): string | undefined {
    return this._profile?.email;
  }

  protected set name(name: string | undefined) {
    this._profile = { ...(this._profile ?? {}), ...(name ? { name } : {}) };
    this.profileChange.emit(this._profile);
  }

  protected get name(): string | undefined {
    return this._profile?.name;
  }

  protected get profile(): { email?: string; name?: string } | undefined {
    return this._profile;
  }

  profileChange: EventEmitter<{
    email?: string;
    name?: string;
  }> = new EventEmitter();

  pkgText = '';

  showSenderFields = true;

  send = new EventEmitter<{
    name?: string;
    email?: string;
    message: string;
    sendProtocol: boolean;
    screenshots: any[];
  }>();

  _i18n: BugReportTranslations = defaultTranslations;

  get i18n() {
    return this._i18n;
  }

  set i18n(value: BugReportTranslations) {
    this._i18n = value;
  }

  public get isvalid(): boolean {
    return this.sendProObj || this.bgdescr !== '';
  }

  public close(action?: unknown) {
    this.activeModal.close(action);
  }

  public applyAction(action: any) {
    this.action.next(action);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.editor?.jodit?.focus();
    }, 0);
  }

  constructor(
    private cd: ChangeDetectorRef,
    protected activeModal: NgbActiveModal,
  ) {
    super();
  }

  onHidden() {
    this.visible = false;
    this.bugsent = false;
    this.sendStatus = 'pending';
    this.update();
  }

  sendBugReport() {
    if (this.bgdescr.length > 10000) {
      alert(
        `Please write a message with less 10000 letters. Remove ${
          this.bgdescr.length - 10000
        } letters.`,
      );
      return;
    }

    this.sendStatus = 'sending';
    this.send.emit({
      name: this.profile!.name,
      email: this.profile!.email,
      message: this.bgdescr,
      sendProtocol: this.sendProObj,
      screenshots: this.screenshots,
    });
  }

  waitForSendResponse(obervable: Observable<void>) {
    this.subscribe(obervable, {
      next: () => {
        this.sendStatus = 'success';
        this.bugsent = true;
        this.update();
        this.subscribe(timer(2000), () => {
          this.bgdescr = '';
          this.close();
        });
      },
      error: (error) => {
        console.error(error);
        this.sendStatus = 'error';
        this.update();
      },
    });
  }

  public selectFileForUpload(input: HTMLInputElement) {
    input.click();
  }

  public onFileChange($event: any) {
    if ($event.target.files.length > 0) {
      if (
        $event.target.files[0].name.indexOf('.jpg') > -1 ||
        $event.target.files[0].name.indexOf('.jpeg') > -1 ||
        $event.target.files[0].name.indexOf('.png') > -1 ||
        $event.target.files[0].name.indexOf('.PNG') > -1 ||
        $event.target.files[0].name.indexOf('.JPG') > -1 ||
        $event.target.files[0].name.indexOf('.JPEG') > -1
      ) {
        this.screenshots.push({
          blob: $event.target.files[0],
          previewURL: '',
        });
        this.update();
        this.createPreviewFromFile(this.screenshots.length - 1)
          .then(() => {
            this.update();
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        alert(
          'Only files with the extensions ".jpg, jpeg,.png" are supported.',
        );
      }
    }
  }

  public createPreviewFromFile(index: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        this.screenshots[index].previewURL = reader.result as string;
        resolve();
      };

      reader.onerror = reject;

      reader.readAsDataURL(this.screenshots[index].blob);
    });
  }

  public removeScreenshot(index: number) {
    this.screenshots.splice(index, 1);
    this.update();
  }

  update() {
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
}
