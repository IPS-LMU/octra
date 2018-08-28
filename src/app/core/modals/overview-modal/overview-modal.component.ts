import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {TranscriptionService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';

@Component({
  selector: 'app-overview-modal',
  templateUrl: './overview-modal.component.html',
  styleUrls: ['./overview-modal.component.css']
})

export class OverviewModalComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  public visible = false;
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal') modal: any;
  protected data = null;
  private subscrmanager = new SubscriptionManager();

  private actionperformed: Subject<void> = new Subject<void>();

  constructor(public transcrService: TranscriptionService, public ms: BsModalService) {
  }

  ngOnInit() {
    this.subscrmanager.add(this.modal.onHide.subscribe(
      () => {
        this.visible = false;
        this.actionperformed.next();
      }
    ));
    this.subscrmanager.add(this.modal.onHidden.subscribe(
      () => {
        this.visible = false;
        this.actionperformed.next();
      }
    ));
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
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

  public beforeDismiss() {
    this.actionperformed.next();
  }

  onSegmentInOverviewClicked(segnumber: number) {
    this.transcrService.requestSegment(segnumber);
    this.close();
  }
}
