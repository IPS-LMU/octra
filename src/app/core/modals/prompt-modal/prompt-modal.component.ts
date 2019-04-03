import {Component, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {AppStorageService, SettingsService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';

@Component({
  selector: 'app-prompt-modal',
  templateUrl: './prompt-modal.component.html',
  styleUrls: ['./prompt-modal.component.css']
})

export class PromptModalComponent implements OnInit {
  modalRef: BsModalRef;
  public visible = false;
  public bgemail = '';
  public bgdescr = '';
  public sendpro_obj = true;
  public bugsent = false;
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal') modal: any;
  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  public get isvalid(): boolean {
    if (this.sendpro_obj || this.bgdescr !== '') {
      return true;
    } else {
      return false;
    }
  }

  constructor(private modalService: BsModalService, public appStorage: AppStorageService, private settService: SettingsService) {
  }

  ngOnInit() {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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

  public close() {
    this.modal.hide();
    this.visible = false;
    this.actionperformed.next();
  }
}
