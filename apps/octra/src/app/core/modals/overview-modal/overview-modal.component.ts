import { AsyncPipe, NgClass } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { TranscrOverviewComponent } from '../../component/transcr-overview/transcr-overview.component';
import { TranscriptionFeedbackComponent } from '../../component/transcription-feedback/transcription-feedback.component';
import { SettingsService, UserInteractionsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { ShortcutService } from '../../shared/service/shortcut.service';
import { LoginMode } from '../../store';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-overview-modal',
  templateUrl: './overview-modal.component.html',
  styleUrls: ['./overview-modal.component.scss'],
  imports: [NgClass, TranscrOverviewComponent, TranscriptionFeedbackComponent, AsyncPipe, TranslocoPipe],
})
export class OverviewModalComponent extends OctraModal implements OnInit, OnDestroy, AfterViewInit {
  modalService = inject(NgbModal);
  settingsService = inject(SettingsService);
  annotationStoreService = inject(AnnotationStoreService);
  private shortcutsService = inject(ShortcutService);
  appStorage = inject(AppStorageService);
  private uiService = inject(UserInteractionsService);
  protected override activeModal: NgbActiveModal;

  public override name = 'OverviewModalComponent';
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
    scrollable: true,
    size: 'xl',
    fullscreen: 'xl',
  };

  @ViewChild('feedback', { static: false })
  feedback?: TranscriptionFeedbackComponent;

  protected data = undefined;
  private shortcutID = -1;
  visible = false;

  public get feedBackComponent(): TranscriptionFeedbackComponent | undefined {
    return this.feedback;
  }

  public get sendValidTranscriptOnly(): boolean {
    return this.settingsService.projectsettings.octra?.sendValidatedTranscriptionOnly;
  }

  public shownSegments: {
    transcription: {
      html: string;
      text: string;
    };
  }[] = [];

  public trnEditorswitch = new EventEmitter<void>();

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('overviewModal', activeModal);

    this.activeModal = activeModal;
  }

  ngOnInit() {
    if (this.settingsService.isTheme('shortAudioFiles') || this.settingsService.isTheme('secondSegmentFast')) {
      this.shortcutsService.registerShortcutGroup({
        name: 'overview modal',
        items: [
          {
            name: 'send good',
            title: 'overview modal.good',
            keys: {
              mac: 'CTRL + 1',
              pc: 'CTRL + 1',
            },
            callback: () => {
              this.sendTranscriptionForShortAudioFiles('good');
            },
          },
          {
            name: 'send middle',
            title: 'overview modal.middle',
            keys: {
              mac: 'CTRL + 2',
              pc: 'CTRL + 2',
            },
            callback: () => {
              this.sendTranscriptionForShortAudioFiles('middle');
            },
          },
          {
            name: 'send bad',
            title: 'overview modal.bad',
            keys: {
              mac: 'CTRL + 3',
              pc: 'CTRL + 3',
            },
            callback: () => {
              this.sendTranscriptionForShortAudioFiles('bad');
            },
          },
        ],
        enabled: true,
      });
    }

    this.uiService.addElementFromEvent('overview', { value: 'opened' }, Date.now(), undefined, undefined, undefined, undefined, 'overview');
  }

  ngAfterViewInit() {
    if (this.feedback) {
      this.feedback.comment = this.annotationStoreService.comment;
    }
  }

  public override close(fromModal = false) {
    if (this.feedback) {
      this.annotationStoreService.comment = this.feedback.comment;
    }

    // unsubscribe shortcut listener
    if (this.shortcutID > -1) {
      this.subscriptionManager.removeById(this.shortcutID);
      this.shortcutID = -1;
    }

    if ((this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO) && this.feedback) {
      this.feedback.saveFeedbackform();
    }

    if (fromModal) {
      this.uiService.addElementFromEvent('overview', { value: 'closed' }, Date.now(), undefined, undefined, undefined, undefined, 'overview');
    }
    return super.close();
  }

  onSegmentInOverviewClicked(segment: {
    levelID: number,
    itemID: number,
  }) {
    this.annotationStoreService.openSegment(segment.levelID, segment.itemID);
    this.close();
  }

  sendTranscription() {
    if (this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO) {
      // TODO implement feedback form
      // this.feedback.saveFeedbackform();
    }

    if (this.feedback) {
      this.annotationStoreService.comment = this.feedback.comment;
    }
    this.activeModal.close('send');
  }

  public sendTranscriptionForShortAudioFiles(type: 'bad' | 'middle' | 'good') {
    switch (type) {
      case 'bad':
        this.appStorage.feedback = 'SEVERE';
        break;
      case 'middle':
        this.appStorage.feedback = 'SLIGHT';
        break;
      case 'good':
        this.appStorage.feedback = 'OK';
        break;
      default:
    }

    if ((this.sendValidTranscriptOnly && this.annotationStoreService.transcriptValid) || !this.sendValidTranscriptOnly) {
      this.sendTranscription();
    }
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.shortcutsService.unregisterShortcutGroup('overview modal');
  }
}
