import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { timer } from 'rxjs';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { BugReportService } from '../../shared/service/bug-report.service';
import { OctraModal } from '../types';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationStoreService } from '../../store/authentication';
import { JoditConfig, NgxJoditComponent } from 'ngx-jodit';
import { RootState } from '../../store';
import { Store } from '@ngrx/store';
import { UserActions } from '../../store/user/user.actions';

@Component({
  selector: 'octra-bugreport-modal',
  templateUrl: './bugreport-modal.component.html',
  styleUrls: ['./bugreport-modal.component.scss'],
})
export class BugreportModalComponent
  extends OctraModal
  implements OnInit, AfterViewInit
{
  get profileEmail(): string {
    return this._profileEmail;
  }

  get profileName(): string {
    return this._profileName;
  }

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
  public screenshots: {
    blob: Blob;
    previewURL: string;
  }[] = [];
  protected data = undefined;

  _profile = {
    email: '',
    name: '',
  };
  private _profileEmail = '';
  private _profileName = '';

  set profileEmail(value: string) {
    this._profileEmail = value;
    this.store.dispatch(
      UserActions.setUserProfile({
        email: this._profileEmail,
        name: this._profileName,
      })
    );
  }

  set profileName(value: string) {
    this._profileName = value;
    this.store.dispatch(
      UserActions.setUserProfile({
        email: this._profileEmail,
        name: this._profileName,
      })
    );
  }

  public get isvalid(): boolean {
    return this.sendProObj || this.bgdescr !== '';
  }

  ngAfterViewInit() {
    if (
      this.appStorage.useMode === 'online' ||
      (this.profileEmail && this.profileName)
    ) {
      setTimeout(() => {
        this.editor?.jodit?.focus();
      }, 0);
    }
  }

  constructor(
    public appStorage: AppStorageService,
    public bugService: BugReportService,
    public authStoreService: AuthenticationStoreService,
    public store: Store<RootState>,
    private cd: ChangeDetectorRef,
    protected override activeModal: NgbActiveModal
  ) {
    super('bugreportModal', activeModal);
  }

  ngOnInit() {
    if (this.appStorage.useMode !== 'online') {
      this._profileName = this.appStorage.snapshot.user.name ?? '';
      this._profileEmail = this.appStorage.snapshot.user.email ?? '';
    } else {
      this._profileName =
        this.appStorage.snapshot.authentication.me?.username ?? '';
      this._profileEmail =
        this.appStorage.snapshot.authentication.me?.email ?? '';
    }

    setTimeout(() => {
      this.bugService.getPackage();
    }, 1000);
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
    this.subscribe(
      this.bugService.sendReport(
        this.profileName,
        this.profileEmail,
        this.bgdescr,
        this.sendProObj,
        this.screenshots
      ),
      {
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
      }
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
