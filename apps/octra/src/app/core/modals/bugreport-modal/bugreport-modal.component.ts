import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { timer } from 'rxjs';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { BugReportService } from '../../shared/service/bug-report.service';
import { OctraModal } from '../types';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationStoreService } from '../../store/authentication';
import { JoditConfig } from 'ngx-jodit';

@Component({
  selector: 'octra-bugreport-modal',
  templateUrl: './bugreport-modal.component.html',
  styleUrls: ['./bugreport-modal.component.scss'],
})
export class BugreportModalComponent extends OctraModal implements OnInit {
  public static options: NgbModalOptions = {
    size: 'xl',
    keyboard: false,
    backdrop: true,
  };

  joditOptions: JoditConfig = {
    maxHeight: 300,
    statusbar: false,
    placeholder: 'Please write a message in German or English...',
  };
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

  profile = {
    email: '',
    username: '',
  };

  public get isvalid(): boolean {
    return this.sendProObj || this.bgdescr !== '';
  }

  constructor(
    private appStorage: AppStorageService,
    public bugService: BugReportService,
    public authStoreService: AuthenticationStoreService,
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
    this.bugService.getPackage();
    this.cd.markForCheck();
    this.cd.detectChanges();
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
        } letters.`
      );
      return;
    }

    this.sendStatus = 'sending';
    this.subscrManager.add(
      this.bugService
        .sendReport(
          this.profile.username,
          this.profile.email,
          this.bgdescr,
          this.sendProObj,
          this.screenshots
        )
        .subscribe(
          () => {
            this.sendStatus = 'success';
            this.bugsent = true;
            this.update();
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
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
}
