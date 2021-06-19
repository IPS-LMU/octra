import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Subject, Subscription, timer} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BugReportService} from '../../shared/service/bug-report.service';

@Component({
  selector: 'octra-bugreport-modal',
  templateUrl: './bugreport-modal.component.html',
  styleUrls: ['./bugreport-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BugreportModalComponent {
  modalRef: BsModalRef;
  public visible = false;
  public bgdescr = '';
  public sendProObj = true;
  public bugsent = false;
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: any;
  public sendStatus: 'pending' | 'success' | 'error' | 'sending' = 'pending';
  public screenshots: {
    blob: File,
    previewURL: string
  }[] = [];
  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager<Subscription>();

  public get email(): string {
    return this.appStorage.userProfile.email;
  }

  public set email(value: string) {
    this.appStorage.userProfile = {
      name: this.userName,
      email: value
    };
  }

  public get userName(): string {
    return this.appStorage.userProfile.name;
  }

  public set userName(value: string) {
    this.appStorage.userProfile = {
      name: value,
      email: this.email
    };
  }

  public get isvalid(): boolean {
    return this.sendProObj || this.bgdescr !== '';
  }

  constructor(private modalService: BsModalService, private appStorage: AppStorageService,
              public bugService: BugReportService, private settService: SettingsService,
              private cd: ChangeDetectorRef) {
  }

  public open(data: {
    text: string
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.sendStatus = 'pending';
      this.visible = true;
      this.screenshots = [];
      this.update();

      const subscr = this.modal.onHide.subscribe(() => {
        subscr.unsubscribe();
        resolve();
      });
    });
  }

  public close() {
    this.modal.hide();
  }

  public hide() {
    this.actionperformed.next();
  }

  onShown() {
    // TODO check data and set focus
    // jQuery('#bgDescr').focus();
  }

  onHidden() {
    this.visible = false;
    this.bugsent = false;
    this.sendStatus = 'pending';
    this.update();
  }

  sendBugReport() {
    this.appStorage.userProfile = {
      ...this.appStorage.userProfile,
      email: this.email
    };

    this.sendStatus = 'sending';
    this.subscrmanager.add(
      this.bugService.sendReport(this.userName, this.email, this.bgdescr, this.sendProObj, {
        auth_token: this.settService.appSettings.octra.bugreport.auth_token,
        url: this.settService.appSettings.octra.bugreport.url
      }, this.screenshots).subscribe(
        () => {
          this.sendStatus = 'success';
          this.bugsent = true;
          this.update();
          console.log('Bugreport sent');

          this.subscrmanager.add(timer(2000).subscribe(() => {
            this.bgdescr = '';
            this.modal.hide();
          }));
        },
        (error) => {
          console.error(error);
          this.sendStatus = 'error';
          this.update();
        }
      )
    );
  }

  public selectFileForUpload(input: HTMLInputElement) {
    input.click();
  }

  public onFileChange($event) {
    if ($event.target.files.length > 0) {
      if ($event.target.files[0].name.indexOf('.jpg') > -1 || $event.target.files[0].name.indexOf('.jpeg') > -1
        || $event.target.files[0].name.indexOf('.png') > -1 || $event.target.files[0].name.indexOf('.PNG') > -1
        || $event.target.files[0].name.indexOf('.JPG') > -1 || $event.target.files[0].name.indexOf('.JPEG') > -1
      ) {
        this.screenshots.push({
          blob: $event.target.files[0],
          previewURL: ''
        });
        this.update();
        this.createPreviewFromFile(this.screenshots.length - 1).then(() => {
          this.update();
        }).catch((error) => {
          console.error(error);
        });
      } else {
        alert('Only files with the extensions ".jpg, jpeg,.png" are supported.');
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
    console.log(`update!`);
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
}
