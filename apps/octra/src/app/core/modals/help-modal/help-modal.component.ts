import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {MdbModalConfig, MdbModalRef} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss']
})
export class HelpModalComponent implements OnDestroy {
  public static config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true,
    modalClass: 'modal-lg'
  };

  public visible = false;

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('content', {static: false}) contentElement: ElementRef;

  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager<Subscription>();

  constructor(public modalRef: MdbModalRef<HelpModalComponent>) {
  }

  public close() {
    this.modal.hide();

    this.actionperformed.next();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onHidden() {
    this.visible = false;
    this.subscrmanager.destroy();
  }
}
