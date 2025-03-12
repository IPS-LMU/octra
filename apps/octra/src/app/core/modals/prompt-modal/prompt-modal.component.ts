import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';
import { SettingsService } from '../../shared/service';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-prompt-modal',
  templateUrl: './prompt-modal.component.html',
  styleUrls: ['./prompt-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, TranslocoPipe],
})
export class PromptModalComponent extends OctraModal {
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: false,
    scrollable: true,
    size: 'lg',
  };

  public formatConverter: any;
  protected data = undefined;

  constructor(
    modalService: NgbModal,
    public annotationStoreService: AnnotationStoreService,
    private settService: SettingsService,
    private cd: ChangeDetectorRef,
    protected override activeModal: NgbActiveModal,
  ) {
    super('promptModal', activeModal);
  }

  public override close() {
    this.cd.markForCheck();
    this.cd.detectChanges();
    return super.close();
  }
}
