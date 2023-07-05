import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { timer } from 'rxjs';
import { SettingsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { BugReportService } from '../../shared/service/bug-report.service';
import { OctraModal } from '../types';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'octra-bugreport-modal',
  templateUrl: './bugreport-modal.component.html',
  styleUrls: ['./bugreport-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BugreportModalComponent extends OctraModal implements OnInit {
  public visible = false;
  public bgdescr = '';
  public sendProObj = true;
  public bugsent = false;
  public sendStatus: 'pending' | 'success' | 'error' | 'sending' = 'pending';
  public screenshots: {
    blob: File;
    previewURL: string;
  }[] = [];
  protected data = undefined;

  public static options: NgbModalOptions = {
    size: 'xl',
    keyboard: false,
    backdrop: true,
  };

  profile = {
    email: '',
    username: '',
  };

  public get isvalid(): boolean {
    return this.sendProObj || this.bgdescr !== '';
  }

  constructor(
    modalService: NgbModal,
    private appStorage: AppStorageService,
    public bugService: BugReportService,
    private settService: SettingsService,
    private cd: ChangeDetectorRef,
    protected override activeModal: NgbActiveModal
  ) {
    super('bugreportModal', activeModal);
  }

  ngOnInit() {
    this.profile = {
      username: this.appStorage.snapshot.authentication.me?.username ?? '',
      email: this.appStorage.snapshot.authentication.me?.email ?? '',
    };
  }

  onHidden() {
    this.visible = false;
    this.bugsent = false;
    this.sendStatus = 'pending';
    this.update();
  }

  sendBugReport() {
    this.sendStatus = 'sending';
    this.subscrManager.add(
      this.bugService
        .sendReport(
          this.profile.username,
          this.profile.email,
          this.bgdescr,
          this.sendProObj,
          {
            auth_token: this.settService.appSettings.octra.bugreport.auth_token,
            url: this.settService.appSettings.octra.bugreport.url,
          },
          this.screenshots
        )
        .subscribe(
          () => {
            this.sendStatus = 'success';
            this.bugsent = true;
            this.update();
            console.log('Bugreport sent');

            this.subscrManager.add(
              timer(2000).subscribe(() => {
                this.bgdescr = '';
                this.close();
              })
            );
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
          'Only files with the extensions ".jpg, jpeg,.png" are supported.'
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
    console.log(`update!`);
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
}
