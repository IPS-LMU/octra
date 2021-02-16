import {ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {TranscriptionFeedbackComponent} from '../../component/transcription-feedback/transcription-feedback.component';
import {isFunction, isUnset, ShortcutEvent, ShortcutGroup, SubscriptionManager} from '@octra/utilities';
import {KeymappingService, SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {LoginMode} from '../../store';
import {NavbarService} from '../../component/navbar/navbar.service';

declare var validateAnnotation: ((string, any) => any);
declare var tidyUpAnnotation: ((string, any) => any);

@Component({
  selector: 'octra-overview-modal',
  templateUrl: './overview-modal.component.html',
  styleUrls: ['./overview-modal.component.css']
})

export class OverviewModalComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  public visible = false;

  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  };

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('feedback', {static: false}) feedback: TranscriptionFeedbackComponent;
  @Output() transcriptionSend = new EventEmitter<void>();

  protected data = null;
  private shortcutID = -1;
  private subscrmanager = new SubscriptionManager();
  private actionperformed: Subject<void> = new Subject<void>();

  public get feedBackComponent(): TranscriptionFeedbackComponent {
    return this.feedback;
  }

  public get sendValidTranscriptOnly(): boolean {
    return (
      !(this.settingsService.projectsettings.octra === null || this.settingsService.projectsettings.octra === undefined)
      && !(
        this.settingsService.projectsettings.octra.sendValidatedTranscriptionOnly === null
        || this.settingsService.projectsettings.octra.sendValidatedTranscriptionOnly === undefined
      )
      && this.settingsService.projectsettings.octra.sendValidatedTranscriptionOnly
    );
  }

  public selectedError: any = '';
  public shownSegments: {
    transcription: {
      html: string,
      text: string
    }
  }[] = [];

  public trnEditorswitch = new EventEmitter<void>();

  constructor(public transcrService: TranscriptionService,
              public ms: BsModalService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService,
              private keyService: KeymappingService,
              private uiService: UserInteractionsService,
              private cd: ChangeDetectorRef,
              private navbarService: NavbarService) {
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

  public open(validate = true): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);

      this.keyService.unregister('overview');

      const shortcuts: ShortcutGroup = {
        name: 'overview',
        items: []
      };
      if (this.settingsService.isTheme('shortAudioFiles')) {
        shortcuts.items = [
          {
            name: 'good',
            title: 'good',
            keys: {
              mac: 'CTRL + 1',
              pc: 'CTRL + 1'
            },
            focusonly: false
          },
          {
            name: 'middle',
            title: 'middle',
            keys: {
              mac: 'CTRL + 2',
              pc: 'CTRL + 2'
            },
            focusonly: false
          },
          {
            name: 'bad',
            title: 'bad',
            keys: {
              mac: 'CTRL + 3',
              pc: 'CTRL + 3'
            },
            focusonly: false
          }
        ];

        this.keyService.register(shortcuts);

        this.shortcutID = this.subscrmanager.add(this.keyService.onShortcutTriggered.subscribe((keyObj: ShortcutEvent) => {
          if (!isUnset(keyObj)) {
            keyObj.event.preventDefault();
            this.sendTranscriptionForShortAudioFiles(keyObj.shortcutName as any);
          }
        }));
      }

      if (this.settingsService.isTheme('korbinian')) {
        shortcuts.items = [
          {
            name: 'NO',
            title: 'NO',
            keys: {
              mac: 'CTRL + 1',
              pc: 'CTRL + 1'
            },
            focusonly: false
          },
          {
            name: 'VE',
            title: 'VE',
            keys: {
              mac: 'CTRL + 2',
              pc: 'CTRL + 2'
            },
            focusonly: false
          },
          {
            name: 'EE',
            title: 'EE',
            keys: {
              mac: 'CTRL + 3',
              pc: 'CTRL + 3'
            },
            focusonly: false
          },
          {
            name: 'AN',
            title: 'AN',
            keys: {
              mac: 'CTRL + 4',
              pc: 'CTRL + 4'
            },
            focusonly: false
          }
        ];

        this.keyService.register(shortcuts);

        this.shortcutID = this.subscrmanager.add(this.keyService.onShortcutTriggered.subscribe((keyObj: ShortcutEvent) => {
          if (!isUnset(keyObj)) {
            keyObj.event.preventDefault();
            this.sendTranscriptionForKorbinian(keyObj.shortcutName as any);
          }
        }));
      }

      if (validate && this.appStorage.useMode !== LoginMode.URL) {
        this.transcrService.validateAll();
      }

      this.visible = true;

      if (this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO) {
        this.feedback.feedbackData = (this.appStorage.feedback === null) ? {} : this.appStorage.feedback;
      }

      const subscr = this.actionperformed.subscribe(
        (action) => {
          resolve(action);
          subscr.unsubscribe();
        },
        (err) => {
          reject(err);
        }
      );

      this.uiService.addElementFromEvent('overview', {value: 'opened'},
        Date.now(), null, null, null, null, 'overview');

      this.updateView();
    });
  }

  public close(fromModal = false) {
    if (this.visible) {
      this.modal.hide();
      this.visible = false;
      this.actionperformed.next();

      // unsubscribe shortcut listener
      if (this.shortcutID > -1) {
        this.subscrmanager.removeById(this.shortcutID);
        this.shortcutID = -1;
      }

      if (this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO) {
        this.feedback.saveFeedbackform();
      }

      if (fromModal) {
        this.uiService.addElementFromEvent('overview', {value: 'closed'},
          Date.now(), null, null, null, null, 'overview');
      }
    }
  }

  onSegmentInOverviewClicked(segnumber: number) {
    this.transcrService.requestSegment(segnumber);
    this.close();
  }

  sendTranscription() {
    if (this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.DEMO) {
      this.feedback.saveFeedbackform();
    }
    this.transcriptionSend.emit();
  }

  public sendTranscriptionForShortAudioFiles(type: 'bad' | 'middle' | 'good') {
    switch (type) {
      case('bad'):
        this.appStorage.feedback = 'SEVERE';
        break;
      case('middle'):
        this.appStorage.feedback = 'SLIGHT';
        break;
      case('good'):
        this.appStorage.feedback = 'OK';
        break;
      default:
    }

    if (this.sendValidTranscriptOnly && this.transcrService.transcriptValid || !this.sendValidTranscriptOnly) {
      this.sendTranscription();
    }
  }

  public sendTranscriptionForKorbinian(type: 'NO' | 'VE' | 'EE' | 'AN') {
    this.transcrService.feedback.comment = this.transcrService.feedback.comment.replace(/(((?:NO)|(?:VE)|(?:EE)|(?:AN))(\s*;\s*)*)/g, '');

    if (this.appStorage.servercomment !== '' && this.transcrService.feedback.comment === '') {
      this.transcrService.feedback.comment = type + '; ' + this.appStorage.servercomment;
    } else if ((this.appStorage.servercomment === '' && this.transcrService.feedback.comment !== '')
      || (this.appStorage.servercomment !== '' && this.transcrService.feedback.comment !== '')) {
      this.transcrService.feedback.comment = type + '; ' + this.transcrService.feedback.comment;
    } else {
      this.transcrService.feedback.comment = type;
    }

    if (this.sendValidTranscriptOnly && this.transcrService.transcriptValid || !this.sendValidTranscriptOnly) {
      this.sendTranscription();
    }
  }

  public get numberOfSegments(): number {
    return (!isUnset(this.transcrService.currentlevel) && this.transcrService.currentlevel.segments) ? this.transcrService.currentlevel.segments.length : 0;
  }

  public get transcrSegments(): number {
    return (!isUnset(this.transcrService.currentlevel) && this.transcrService.currentlevel.segments) ? this.transcrService.statistic.transcribed : 0;
  }

  public get pauseSegments(): number {
    return (!isUnset(this.transcrService.currentlevel) && this.transcrService.currentlevel.segments) ? this.transcrService.statistic.pause : 0;
  }

  public get emptySegments(): number {
    return (!isUnset(this.transcrService.currentlevel) && this.transcrService.currentlevel.segments) ? this.transcrService.statistic.empty : 0;
  }

  public get foundErrors(): number {
    let found = 0;

    if (this.shownSegments.length > 0) {
      let resultStr = '';
      for (const shownSegment of this.shownSegments) {
        resultStr += shownSegment.transcription.html;
      }

      found = (resultStr.match(/<span class='val-error'/) || []).length;
    }

    return found;
  }

  public get validationFound() {
    return ((typeof validateAnnotation !== 'undefined') && isFunction(validateAnnotation) &&
      (typeof tidyUpAnnotation !== 'undefined') && isFunction(tidyUpAnnotation));
  }

  updateView() {
    this.updateSegments();
    this.transcrService.analyse();

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  getShownSegment(startSamples: number, endSamples: number, rawText: string, i: number): {
    start: number,
    end: number,
    transcription: {
      text: string,
      html: string
    },
    validation: string
  } {
    const obj = {
      start: startSamples,
      end: endSamples,
      transcription: {
        text: rawText,
        html: rawText
      },
      validation: ''
    };

    if (this.appStorage.useMode !== LoginMode.URL) {
      if (typeof validateAnnotation !== 'undefined' && typeof validateAnnotation === 'function'
        && !isUnset(this.transcrService.validationArray[i])) {
        obj.transcription.html = this.transcrService.underlineTextRed(obj.transcription.text,
          this.transcrService.validationArray[i].validation);
      }

      obj.transcription.html = this.transcrService.rawToHTML(obj.transcription.html);
      obj.transcription.html = obj.transcription.html.replace(/((?:\[\[\[)|(?:]]]))/g, (g0, g1) => {
        if (g1 === '[[[') {
          return '<';
        }
        return '>';
      });
    } else {
      obj.transcription.html = this.transcrService.rawToHTML(obj.transcription.html);
      obj.transcription.html = obj.transcription.html.replace(/((?:\[\[\[)|(?:]]]))/g, (g0, g1) => {
        if (g1 === '[[[') {
          return '<';
        }
        return '>';
      });
    }

    obj.transcription.html = obj.transcription.html.replace(/(<p>)|(<\/p>)/g, '');
    return obj;
  }

  private updateSegments() {
    if (this.transcrService.validationArray.length > 0 || this.appStorage.useMode === LoginMode.URL
      || !this.settingsService.projectsettings.octra.validationEnabled) {
      if (!this.transcrService.currentlevel.segments || !this.transcrService.guidelines) {
        this.shownSegments = [];
      }

      let startTime = 0;
      const result = [];

      for (let i = 0; i < this.transcrService.currentlevel.segments.length; i++) {
        const segment = this.transcrService.currentlevel.segments.segments[i];

        const obj = this.getShownSegment(startTime, segment.time.samples, segment.transcript, i);

        result.push(obj);

        startTime = segment.time.samples;
      }

      this.shownSegments = result;
    }
  }

  switchToTRNEditor($event) {
    this.navbarService.interfacechange.emit('TRN-Editor');
    this.close(false);
  }
}
