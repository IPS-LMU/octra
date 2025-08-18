import { Component, inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  NgbActiveModal,
  NgbModalOptions,
  NgbTooltip,
} from '@ng-bootstrap/ng-bootstrap';
import { OctraAnnotationSegmentLevel } from '@octra/annotation';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import {
  fadeInExpandOnEnterAnimation,
  fadeOutCollapseOnLeaveAnimation,
} from 'angular-animations';
import { AppInfo } from '../../../../app.info';
import {
  AlertService,
  AudioService,
  SettingsService,
} from '../../../shared/service';
import { AnnotationStoreService } from '../../../store/login-mode/annotation/annotation.store.service';
import { OctraModal } from '../../types';

@Component({
  selector: 'octra-combine-phrases-modal',
  templateUrl: './combine-phrases-modal.component.html',
  styleUrls: ['./combine-phrases-modal.component.scss'],
  animations: [
    fadeOutCollapseOnLeaveAnimation(),
    fadeInExpandOnEnterAnimation(),
  ],
  imports: [FormsModule, NgbTooltip, TranslocoPipe, OctraUtilitiesModule],
  encapsulation: ViewEncapsulation.None,
})
export class CombinePhrasesModalComponent
  extends OctraModal
  implements OnDestroy
{
  annotationStoreService = inject(AnnotationStoreService);
  audio = inject(AudioService);
  transloco = inject(TranslocoService);
  protected settings = inject(SettingsService);
  protected alertService = inject(AlertService);
  protected override activeModal: NgbActiveModal;

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
    scrollable: true,
    size: 'xl',
    fullscreen: 'md',
  };

  protected state: {
    status: string;
    message: string;
    showOptions: boolean;
    options: {
      minSilenceLength: number;
      maxWordsPerSegment: number;
    };
  } = {
    status: 'idle',
    message: '',
    showOptions: false,
    options: {
      minSilenceLength: 100,
      maxWordsPerSegment: 10,
    },
  };

  protected data = undefined;

  public get manualURL(): string {
    return AppInfo.manualURL;
  }

  get isCombinePhrasesSettingsValid(): boolean {
    return (
      Number.isInteger(this.state.options.minSilenceLength) &&
      Number.isInteger(this.state.options.maxWordsPerSegment) &&
      this.state.options.minSilenceLength >= 20 &&
      this.state.options.maxWordsPerSegment >= 0
    );
  }

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('toolsModal', activeModal);

    this.activeModal = activeModal;
  }

  onCombinePhrasesClick() {
    if (!this.isSomethingBlocked()) {
      this.combinePhrases();
    } else {
      this.alertService.showAlert(
        'warning',
        "Can't run combine phrases. There are some automatic processes running",
      );
    }
  }

  isSomethingBlocked(): boolean {
    return (
      this.annotationStoreService.currentLevel &&
      this.annotationStoreService.currentLevel instanceof
        OctraAnnotationSegmentLevel &&
      this.annotationStoreService.currentLevel.items.find((a) => {
        return a.context?.asr?.isBlockedBy !== undefined;
      }) !== undefined
    );
  }

  private combinePhrases() {
    this.annotationStoreService.combinePhrases(this.state.options);
    this.close();
  }
}
