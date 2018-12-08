import {Component, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {AppStorageService, SettingsService} from '../../shared/service';

@Component({
  selector: 'app-activity-timeout-modal',
  templateUrl: './inactivity-modal.component.html',
  styleUrls: ['./inactivity-modal.component.css']
})

export class InactivityModalComponent implements OnInit {
  modalRef: BsModalRef;
  public visible = false;
  public config: ModalOptions = {
    keyboard: false,
    backdrop: 'static',
    ignoreBackdropClick: true
  };
  @ViewChild('modal') modal: any;
  protected data = null;
  private actionperformed: Subject<string> = new Subject<string>();

  constructor(public appStorage: AppStorageService, public settService: SettingsService) {
  }

  ngOnInit() {
  }

  public open(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.visible = true;
      const subscr = this.actionperformed.subscribe(
        (action) => {
          resolve(action);
          subscr.unsubscribe();
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  public close(action: string) {
    this.modal.hide();
    this.visible = false;
    this.actionperformed.next(action);
  }
}
