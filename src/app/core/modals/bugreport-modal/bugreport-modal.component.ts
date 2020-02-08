import {Component, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs';
import {AppStorageService, SettingsService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {BugReportService} from '../../shared/service/bug-report.service';

@Component({
  selector: 'app-bugreport-modal',
  templateUrl: './bugreport-modal.component.html',
  styleUrls: ['./bugreport-modal.component.css']
})
export class BugreportModalComponent implements OnInit {
  modalRef: BsModalRef;
  public visible = false;
  public bgemail = '';
  public bgdescr = '';
  public sendProObj = true;
  public bugsent = false;
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: any;
  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  public sendStatus: 'pending' | 'success' | 'error' | 'sending' = 'pending';

  public screenshots: {
    blob: File,
    previewURL: string
  }[] = [];

  public get isvalid(): boolean {
    return this.sendProObj || this.bgdescr !== '';
  }

  constructor(private modalService: BsModalService, private appStorage: AppStorageService,
              public bugService: BugReportService, private settService: SettingsService) {
  }

  ngOnInit() {

  }

  public open(data: {
    text: string
  }): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.sendStatus = 'pending';
      this.visible = true;
      this.screenshots = [];

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
    jQuery('#bgDescr').focus();
  }

  onHidden() {
    this.visible = false;
    this.bgdescr = '';
    this.bugsent = false;
  }

  sendBugReport() {
    this.appStorage.email = this.bgemail;

    this.sendStatus = 'sending';
    this.subscrmanager.add(
      this.bugService.sendReport(this.bgemail, this.bgdescr, this.sendProObj, {
        auth_token: this.settService.appSettings.octra.bugreport.auth_token,
        url: this.settService.appSettings.octra.bugreport.url
      }, this.screenshots).subscribe(
        () => {
          this.sendStatus = 'pending';
          this.bugsent = true;
          console.log('Bugreport sent');

          setTimeout(() => {
            this.modal.hide();
          }, 2000);
        },
        (error) => {
          console.error(error);
          this.sendStatus = 'error';
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
        this.createPreviewFromFile(this.screenshots.length - 1);
      } else {
        alert('Only files with the extensions ".jpg, jpeg,.png" are supported.');
      }
    }
  }

  public createPreviewFromFile(index: number) {
    const reader = new FileReader();

    reader.onloadend = () => {
      this.screenshots[index].previewURL = reader.result as string;
    };

    reader.readAsDataURL(this.screenshots[index].blob);
  }

  public removeScreenshot(index: number) {
    this.screenshots.splice(index, 1);
  }
}
