import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {TranslocoService} from '@ngneat/transloco';
import {contains, hasProperty, scrollTo, ShortcutEvent, ShortcutGroup, SubscriptionManager} from '@octra/utilities';
import {interval, Subscription, timer} from 'rxjs';
import {AuthenticationNeededComponent} from '../../core/alerts/authentication-needed/authentication-needed.component';
import {ErrorOccurredComponent} from '../../core/alerts/error-occurred/error-occurred.component';
import {TranscrEditorComponent} from '../../core/component';


import {
  AlertService,
  AlertType,
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {AppStorageService} from '../../core/shared/service/appstorage.service';
import {ASRProcessStatus, ASRQueueItem, AsrService, ASRTimeInterval} from '../../core/shared/service/asr.service';
import {OCTRAEditor} from '../octra-editor';
import {TranscrWindowComponent} from './transcr-window';
import {
  AudioNavigationComponent,
  AudioViewerComponent,
  AudioviewerConfig,
  AudioViewerShortcutEvent
} from '@octra/components';
import {AudioChunk, AudioManager, AudioSelection, PlayBackStatus, SampleUnit} from '@octra/media';
import {ASRQueueItemType, OAudiofile, OSegment, PraatTextgridConverter, Segment} from '@octra/annotation';
import {ApplicationState} from '../../core/store';
import {Store} from '@ngrx/store';

@Component({
  selector: 'octra-overlay-gui',
  templateUrl: './2D-editor.component.html',
  styleUrls: ['./2D-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoDEditorComponent extends OCTRAEditor implements OnInit, AfterViewInit, OnDestroy {

  public static editorname = '2D-Editor';
  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer', {static: true}) viewer: AudioViewerComponent;
  @ViewChild('window', {static: false}) window: TranscrWindowComponent;
  @ViewChild('loupe', {static: false}) loupe: AudioViewerComponent;
  @ViewChild('audionav', {static: true}) audionav: AudioNavigationComponent;
  @Output() public openModal = new EventEmitter();

  public showWindow = false;
  public loupeHidden = true;
  public selectedIndex: number;
  public miniloupe = {
    size: {
      width: 160,
      height: 160
    },
    location: {
      x: 0,
      y: 0
    }
  };

  public audioManager: AudioManager;
  public audioChunkLines: AudioChunk;
  public audioChunkWindow: AudioChunk;
  public audioChunkLoupe: AudioChunk;
  public miniLoupeSettings: AudioviewerConfig;
  private;
  public;
  private subscrmanager: SubscriptionManager<Subscription>;
  private mousestate = 'initiliazied';
  private intervalID = undefined;
  private factor = 8;
  private scrolltimer: Subscription = undefined;
  private shortcuts: any = {};
  private authWindow: Window = undefined;
  private windowShortcuts: ShortcutGroup = {
    name: 'transcription window',
    enabled: true,
    items: [
      {
        name: 'jump_left',
        keys: {
          mac: 'ALT + ARROWLEFT',
          pc: 'ALT + ARROWLEFT'
        },
        focusonly: false,
        title: 'jump_last_segment'
      },
      {
        name: 'jump_right',
        keys: {
          mac: 'ALT + ARROWRIGHT',
          pc: 'ALT + ARROWRIGHT'
        },
        focusonly: false,
        title: 'jump_next_segment'
      },
      {
        name: 'close_save',
        keys: {
          mac: 'ALT + ARROWDOWN',
          pc: 'ALT + ARROWDOWN'
        },
        focusonly: false,
        title: 'close_save'
      }
    ]
  };

  private audioShortcuts: ShortcutGroup = {
    name: '2D-Editor',
    enabled: true,
    items: [
      {
        name: 'play_pause',
        keys: {
          mac: 'TAB',
          pc: 'TAB'
        },
        title: 'play pause',
        focusonly: false
      },
      {
        name: 'stop',
        keys: {
          mac: 'ESC',
          pc: 'ESC'
        },
        title: 'stop playback',
        focusonly: false
      },
      {
        name: 'step_backward',
        keys: {
          mac: 'SHIFT + BACKSPACE',
          pc: 'SHIFT + BACKSPACE'
        },
        title: 'step backward',
        focusonly: false
      },
      {
        name: 'step_backwardtime',
        keys: {
          mac: 'SHIFT + TAB',
          pc: 'SHIFT + TAB'
        },
        title: 'step backward time',
        focusonly: false
      }
    ]
  };

  private shortcutsEnabled = true;

  public get editor(): TranscrEditorComponent {
    if ((this.window === undefined || this.window === undefined)) {
      return undefined;
    }
    return this.window.editor;
  }

  public get getHeight(): number {
    return window.innerHeight - 350;
  }

  public get app_settings(): any {
    return this.settingsService.appSettings;
  }

  public get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  constructor(public transcrService: TranscriptionService,
              public keyMap: KeymappingService,
              public audio: AudioService,
              public uiService: UserInteractionsService,
              public alertService: AlertService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService,
              private asrService: AsrService,
              private cd: ChangeDetectorRef,
              private langService: TranslocoService,
              private store: Store<ApplicationState>) {
    super();
    this.miniLoupeSettings = new AudioviewerConfig();
    this.subscrmanager = new SubscriptionManager<Subscription>();
  }

  ngOnInit() {
    console.log(`2D-EDITOR INIT!`);
    this.audioManager = this.audio.audiomanagers[0];
    this.audioChunkLines = this.audioManager.mainchunk.clone();
    this.audioChunkWindow = this.audioManager.mainchunk.clone();
    this.shortcuts = this.keyMap.register({
      name: '2D-Editor viewer',
      enabled: true,
      items: this.viewer.settings.shortcuts.items
    });
    this.shortcuts = this.keyMap.register({
      name: '2D-Editor audio',
      enabled: true,
      items: this.audioShortcuts.items
    });
    this.keyMap.register(this.windowShortcuts);
    this.subscrmanager.add(this.keyMap.onShortcutTriggered.subscribe(this.onShortCutTriggered));
    this.viewer.settings.multiLine = true;
    this.viewer.settings.lineheight = 70;
    this.viewer.settings.margin.top = 5;
    this.viewer.settings.margin.right = 0;
    this.viewer.settings.justifySignalHeight = true;
    this.viewer.settings.scrollbar.enabled = true;
    this.viewer.settings.roundValues = false;
    this.viewer.settings.stepWidthRatio = (this.viewer.settings.pixelPerSec / this.audioManager.ressource.info.sampleRate);
    this.viewer.settings.showTimePerLine = true;
    this.viewer.settings.showTranscripts = true;
    this.viewer.settings.asr.enabled = this.settingsService.isASREnabled;
    this.viewer.settings.showProgressBars = true;
    this.viewer.name = 'multiline viewer';

    this.viewer.secondsPerLine = this.appStorage.secondsPerLine;

    this.miniLoupeSettings.roundValues = false;
    this.miniLoupeSettings.shortcutsEnabled = false;
    this.miniLoupeSettings.selection.enabled = false;
    this.miniLoupeSettings.boundaries.readonly = true;
    this.miniLoupeSettings.asr.enabled = false;
    this.miniLoupeSettings.cropping = 'circle';
    this.miniLoupeSettings.cursor.fixed = true;

    this.audioChunkLoupe = this.audioManager.mainchunk.clone();

    this.subscrmanager.add(this.viewer.alert.subscribe(
      (result) => {
        this.alertService.showAlert(result.type as AlertType, result.message).catch((error) => {
          console.error(error);
        });
      }
    ));

    this.subscrmanager.add(this.transcrService.annotationChanged.subscribe(() => {
      this.cd.markForCheck();
    }));

    this.subscrmanager.add(this.transcrService.levelchanged.subscribe(() => {
      this.cd.markForCheck();
    }));

    this.subscrmanager.add(this.transcrService.currentLevelSegmentChange.subscribe(() => {
      this.cd.markForCheck();
    }));

    this.subscrmanager.add(this.audioChunkLines.statuschange.subscribe(
      (state: PlayBackStatus) => {
        if (state === PlayBackStatus.PLAYING) {
          if (this.appStorage.followPlayCursor !== undefined && this.appStorage.followPlayCursor === true) {

            if (this.scrolltimer !== undefined) {
              this.scrolltimer.unsubscribe();
            }

            this.scrolltimer = interval(1000).subscribe(() => {
              const absx = this.viewer.av.audioTCalculator.samplestoAbsX(this.audioChunkLines.relativePlayposition);

              const lines = Math.floor(absx / this.viewer.av.innerWidth);
              const y = lines * (this.viewer.settings.lineheight + this.viewer.settings.margin.bottom);

              this.viewer.scrollToAbsY(y);
            });
          }
        } else {
          if (this.scrolltimer !== undefined) {
            this.scrolltimer.unsubscribe();
          }
        }
      }
    ));

    this.subscrmanager.add(this.appStorage.settingschange.subscribe(
      (event) => {
        switch (event.key) {
          case('secondsPerLine'):
            this.viewer.onSecondsPerLineChanged(event.value);
            break;
        }
      }
    ));

    this.subscrmanager.add(this.asrService.queue.itemChange.subscribe((item: ASRQueueItem) => {
        const checkUndoRedo = () => {
          if (this.asrService.queue.statistics.running === 0) {
            this.appStorage.enableUndoRedo();
          } else {
            this.appStorage.disableUndoRedo();
          }
        };

        if (item.status !== ASRProcessStatus.IDLE) {
          const segmentBoundary = new SampleUnit(item.time.sampleStart + item.time.sampleLength, this.audioManager.sampleRate);
          let segmentIndex = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(segmentBoundary);

          if (segmentIndex > -1) {
            let segment = this.transcrService.currentlevel.segments.get(segmentIndex);
            segment.progressInfo = {
              progress: item.progress,
              statusLabel: item.type
            };
            this.viewer.redraw();

            if (item.status !== ASRProcessStatus.STARTED && item.status !== ASRProcessStatus.RUNNING) {
              if (segment !== undefined) {
                segment = segment.clone();
                segment.isBlockedBy = undefined;

                if (item.status === ASRProcessStatus.NOQUOTA) {
                  this.alertService.showAlert('danger', this.langService.translate('asr.no quota')).catch((error) => {
                    console.error(error);
                  });
                  this.uiService.addElementFromEvent(item.type.toLowerCase(), {
                    value: 'failed'
                  }, Date.now(), undefined, undefined, undefined, {
                    start: item.time.sampleStart,
                    length: item.time.sampleLength
                  }, 'automation');
                } else if (item.status === ASRProcessStatus.NOAUTH) {
                  console.log(`NO AUTH`);
                  this.uiService.addElementFromEvent(item.type.toLowerCase(), {
                    value: 'no_auth'
                  }, Date.now(), undefined, undefined, undefined, {
                    start: item.time.sampleStart,
                    length: item.time.sampleLength
                  }, 'automation');

                  this.alertService.showAlert('warning', AuthenticationNeededComponent, true, -1).then((alertItem) => {
                    const auth = alertItem.component as AuthenticationNeededComponent;
                    this.subscrmanager.add(auth.authenticateClick.subscribe(() => {
                      this.openAuthWindow();
                    }));
                    this.subscrmanager.add(auth.confirmationClick.subscribe(() => {
                      this.resetQueueItemsWithNoAuth();
                      this.alertService.closeAlert(alertItem.id);
                    }));
                  });
                } else {
                  if (item.status === ASRProcessStatus.FINISHED) {
                    this.uiService.addElementFromEvent(item.type.toLowerCase(), {
                      value: 'finished'
                    }, Date.now(), undefined, undefined, undefined, {
                      start: item.time.sampleStart,
                      length: item.time.sampleLength
                    }, 'automation');
                    if (item.type === ASRQueueItemType.ASR) {
                      segment.transcript = item.result.replace(/(<\/p>)/g, '');

                      const index = this.transcrService.currentlevel.segments.segments.findIndex((a) => {
                        return a.time.samples === segment.time.samples;
                      });
                      if (index > -1) {
                        this.transcrService.currentlevel.segments.change(index, segment);
                      }
                    } else if (item.type === ASRQueueItemType.ASRMAUS || item.type === ASRQueueItemType.MAUS) {
                      const converter = new PraatTextgridConverter();

                      const audiofile = new OAudiofile();
                      const audioInfo = this.audioManager.ressource.info;
                      audiofile.duration = audioInfo.duration.samples;
                      audiofile.name = `OCTRA_ASRqueueItem_${item.id}.wav`;
                      audiofile.sampleRate = this.audioManager.sampleRate;
                      audiofile.size = this.audioManager.ressource.info.size;
                      audiofile.type = this.audioManager.ressource.info.type;

                      const convertedResult = converter.import({
                        name: `OCTRA_ASRqueueItem_${item.id}.TextGrid`,
                        content: item.result,
                        type: 'text',
                        encoding: 'utf-8'
                      }, audiofile);

                      const wordsTier = convertedResult.annotjson.levels.find((a) => {
                        return a.name === 'ORT-MAU';
                      });

                      if (wordsTier !== undefined) {
                        let counter = 0;

                        if (segmentIndex < 0) {
                          console.error(`could not find segment to be precessed by ASRMAUS!`);
                        } else {
                          for (const wordItem of wordsTier.items) {
                            const itemEnd = item.time.sampleStart + item.time.sampleLength;
                            if (item.time.sampleStart + wordItem.sampleStart + wordItem.sampleDur <= itemEnd) {
                              const readSegment = Segment.fromObj(this.transcrService.currentlevel.name,
                                new OSegment(1, wordItem.sampleStart, wordItem.sampleDur, wordItem.labels),
                                this.audioManager.sampleRate);
                              if (readSegment.transcript === '<p:>' || readSegment.transcript === '') {
                                readSegment.transcript = this.transcrService.breakMarker.code;
                              }

                              if (counter === wordsTier.items.length - 1) {
                                // the processed segment is now the very right one. Replace its content with
                                // the content of the last word item.
                                segmentIndex = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(segmentBoundary);

                                this.transcrService.currentlevel.segments.segments[segmentIndex].transcript = readSegment.transcript;
                                this.transcrService.currentlevel.segments.segments[segmentIndex].isBlockedBy = undefined;
                              } else {
                                const origTime = new SampleUnit(item.time.sampleStart + readSegment.time.samples,
                                  this.audioManager.sampleRate);
                                this.transcrService.currentlevel.addSegment(origTime, '', readSegment.transcript, false);
                              }
                            } else {
                              console.error(`wordItem samples are out of the correct boundaries.`);
                              // tslint:disable-next-line:max-line-length
                              console.error(`${wordItem.sampleStart} + ${wordItem.sampleDur} <= ${item.time.sampleStart} + ${item.time.sampleLength}`);
                            }
                            counter++;
                          }

                          this.transcrService.currentLevelSegmentChange.emit();
                        }
                      } else {
                        console.error(`word tier not found!`);
                      }
                    }
                  } else if (item.status === ASRProcessStatus.FAILED) {
                    if (item.result.indexOf('[Error]') === 0) {
                      const errorMessage = item.result.replace('[Error] ', '');
                      const translatedError = this.langService.translate(`asr.${errorMessage}`, {
                        asrProvider: item.selectedLanguage.asr,
                        maxDuration: item.selectedASRInfo.maxSignalDuration,
                        maxSignalSize: item.selectedASRInfo.maxSignalSize
                      });
                      this.alertService.showAlert('danger', translatedError, true, 30).catch((error) => {
                        console.error(error);
                      });
                    } else {
                      this.alertService.showAlert('danger', ErrorOccurredComponent, true, -1).catch((error) => {
                        console.error(error);
                      });
                    }
                    console.error(item.result);
                    this.transcrService.currentlevel.segments.segments[segmentIndex].isBlockedBy = undefined;
                    this.transcrService.currentLevelSegmentChange.emit();
                    this.cd.markForCheck();
                  } else if (item.status === ASRProcessStatus.STOPPED) {
                    this.cd.markForCheck();
                  }
                }
              } else {
                console.error(`can't start ASR because segment not found!`);
              }
            } else if (item.status === ASRProcessStatus.STARTED) {
              // item started
              this.uiService.addElementFromEvent(item.type.toLowerCase(), {
                value: 'started'
              }, Date.now(), undefined, undefined, undefined, {
                start: item.time.sampleStart,
                length: item.time.sampleLength
              }, 'automation');
            }
          } else {
            console.error(new Error(`couldn't find segment number`));
          }
        }
        checkUndoRedo();
      }));
  }

  ngOnDestroy() {
    this.audioManager.stopPlayback().catch(() => {
      console.error(`could not stop audio on editor switched`);
    });

    clearInterval(this.intervalID);
    this.subscrmanager.destroy();
    if (this.scrolltimer !== undefined) {
      this.scrolltimer.unsubscribe();
    }

    this.subscrmanager.add(
      this.transcrService.segmentrequested.subscribe(
        (segnumber: number) => {
          this.openSegment(segnumber);
        }
      )
    );

    this.keyMap.unregisterAll();
  }

  ngAfterViewInit() {
    if (this.appStorage.showLoupe) {
      this.loupe.av.zoomY = this.factor;
    }
    const subscr = this.viewer.onInitialized.subscribe(
      () => {
        subscr.unsubscribe();
        TwoDEditorComponent.initialized.emit();
      });
  }

  onSegmentEntered(selected: any) {
    if (this.transcrService.currentlevel.segments && selected.index > -1 &&
      selected.index < this.transcrService.currentlevel.segments.length) {
      const segment = this.transcrService.currentlevel.segments.get(selected.index);

      if (segment !== undefined) {
        if (segment.isBlockedBy !== ASRQueueItemType.ASRMAUS && segment.isBlockedBy !== ASRQueueItemType.MAUS) {
          const start: SampleUnit = (selected.index > 0) ? this.transcrService.currentlevel.segments.get(selected.index - 1).time.clone()
            : this.audioManager.createSampleUnit(0);
          this.selectedIndex = selected.index;
          this.audioChunkWindow = new AudioChunk(new AudioSelection(start, segment.time.clone()), this.audioManager);
          this.shortcutsEnabled = false;

          this.viewer.disableShortcuts();
          this.showWindow = true;

          this.uiService.addElementFromEvent('segment', {
            value: 'entered'
          }, Date.now(), this.audioManager.playposition, -1, undefined, {
            start: start.samples,
            length: this.transcrService.currentlevel.segments.get(selected.index).time.samples - start.samples
          }, TwoDEditorComponent.editorname);
          this.cd.markForCheck();
          this.cd.detectChanges();
        } else {

          // tslint:disable-next-line:max-line-length
          this.alertService.showAlert('danger', 'You can\'t open this segment while processing segmentation. If you need to open it, cancel segmentation first.')
            .catch((error) => {
              console.error(error);
            });
        }
      } else {
        console.error(`couldn't find segment with index ${selected.index}`);
      }
    }
  }

  onWindowAction(state) {
    if (state === 'close') {
      this.showWindow = false;
      this.viewer.enableShortcuts();
      this.shortcutsEnabled = true;
      this.selectedIndex = this.window.segmentIndex;
      this.viewer.selectSegment(this.selectedIndex);

      const segment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
      const absx = this.viewer.av.audioTCalculator.samplestoAbsX(segment.time);

      let y = Math.floor(absx / this.viewer.av.innerWidth) * this.viewer.settings.lineheight;
      y += 10 + (Math.floor(absx / this.viewer.av.innerWidth) * this.viewer.settings.margin.bottom);
      scrollTo(y, '#special');

    } else if (state === 'overview') {
      this.shortcutsEnabled = false;
      this.openModal.emit('overview');
    }
  }

  onMouseOver($event: {
    event: MouseEvent | undefined
    time: SampleUnit
  }) {
    this.subscrmanager.removeByTag('mouseTimer');
    this.mousestate = 'moving';

    this.doPlayOnHover(this.audioManager, this.appStorage.playonhover, this.audioChunkLines, this.viewer.av.mouseCursor);

    if (this.appStorage.showLoupe) {
      if (this.viewer.audioChunk.time.duration.seconds !== this.viewer.av.mouseCursor.seconds) {
        this.loupeHidden = false;
        this.subscrmanager.add(timer(20).subscribe(() => {
          this.changeLoupePosition($event.event, $event.time);
          this.mousestate = 'ended';
        }), 'mouseTimer');
      } else {
        this.loupeHidden = true;
      }
    }
  }

  public changeLoupePosition(mouseEvent: MouseEvent, cursorTime: SampleUnit) {
    const fullY = mouseEvent.offsetY + 20 + this.miniloupe.size.height;
    const x = mouseEvent.offsetX - ((this.miniloupe.size.width - 10) / 2) - 2;

    if (fullY < this.viewer.height) {
      // loupe is fully visible
      this.miniloupe.location.y = mouseEvent.offsetY + 20;
    } else {
      // loupe out of the bottom border of view rectangle
      this.miniloupe.location.y = mouseEvent.offsetY - 20 - this.miniloupe.size.height;
    }
    this.miniloupe.location.x = x;

    this.loupeHidden = false;
    this.changeArea(this.loupe, this.viewer, this.audioManager, this.audioChunkLoupe, cursorTime, this.factor)
      .then((newLoupeChunk) => {
        if (newLoupeChunk !== undefined) {
          this.audioChunkLoupe = newLoupeChunk;
        }
        this.cd.detectChanges();
      });
  }

  onShortCutViewerTriggered($event: AudioViewerShortcutEvent) {
    this.triggerUIAction($event);

    if ($event.shortcutName === 'undo' || $event.shortcutName === 'redo') {
      if (this.appStorage.undoRedoDisabled) {
        this.alertService.showAlert('danger', this.langService.translate('alerts.undo deactivated'));
      }
      if ($event.shortcutName === 'undo') {
        this.appStorage.undo();
      } else if ($event.shortcutName === 'redo') {
        this.appStorage.redo();
      }
    }
  }

  onShortCutTriggered = ($event: ShortcutEvent) => {
    if (this.shortcutsEnabled) {
      if (this.audioChunkLines !== undefined) {
        let shortcutTriggered = false;
        switch ($event.shortcutName) {
          case('play_pause'):
            this.triggerUIAction({
              shortcut: $event.shortcut,
              shortcutName: $event.shortcutName,
              value: $event.shortcutName,
              type: 'audio',
              timestamp: $event.timestamp
            });
            if (this.audioChunkLines.isPlaying) {
              this.audioChunkLines.pausePlayback().catch((error) => {
                console.error(error);
              });
            } else {
              this.audioChunkLines.startPlayback(false).catch((error) => {
                console.error(error);
              });
            }
            shortcutTriggered = true;
            break;
          case('stop'):
            this.triggerUIAction({
              shortcut: $event.shortcut,
              shortcutName: $event.shortcutName,
              value: $event.shortcutName,
              type: 'audio',
              timestamp: $event.timestamp
            });
            this.audioChunkLines.stopPlayback().catch((error) => {
              console.error(error);
            });
            shortcutTriggered = true;
            break;
          case('step_backward'):
            console.log(`step backward`);
            this.triggerUIAction({
              shortcut: $event.shortcut,
              shortcutName: $event.shortcutName,
              value: $event.shortcutName,
              type: 'audio',
              timestamp: $event.timestamp
            });
            this.audioChunkLines.stepBackward().catch((error) => {
              console.error(error);
            });
            break;
          case('step_backwardtime'):
            console.log(`step backward time`);
            this.triggerUIAction({
              shortcut: $event.shortcut,
              shortcutName: $event.shortcutName,
              value: $event.shortcutName,
              type: 'audio',
              timestamp: $event.timestamp
            });
            this.audioChunkLines.stepBackwardTime(0.5).catch((error) => {
              console.error(error);
            });
            shortcutTriggered = true;
            break;
        }

        if (shortcutTriggered) {
          $event.event.preventDefault();
          this.cd.detectChanges();
        }
      }

      if (this.appStorage.showLoupe) {
        const event = $event.event;

        if (event.key === '+' || event.key === '-') {
          if (event.key === '+') {
            this.factor = Math.min(20, this.factor + 1);
          } else if (event.key === '-') {
            if (this.factor > 3) {
              this.factor = Math.max(1, this.factor - 1);
            }
          }

          this.changeArea(this.loupe, this.viewer, this.audioManager, this.audioChunkLoupe, this.viewer.av.mouseCursor, this.factor)
            .then((newLoupeChunk) => {
              if (newLoupeChunk !== undefined) {
                this.audioChunkLoupe = newLoupeChunk;
                this.cd.detectChanges();
              }
            });

          $event.event.preventDefault();
        }
      }
    }
  }

  private triggerUIAction($event: AudioViewerShortcutEvent) {
    if (($event.value === 'do_asr' || $event.value === 'cancel_asr'
      || $event.value === 'do_asr_maus' || $event.value === 'cancel_asr_maus'
      || $event.value === 'do_maus' || $event.value === 'cancel_maus'
    ) && $event.type === 'segment') {
      const timePosition: SampleUnit = ($event.timePosition !== undefined) ? $event.timePosition : this.viewer.av.mouseCursor;

      const segmentNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(timePosition);

      if (segmentNumber > -1) {
        if (this.asrService.selectedLanguage !== undefined) {
          const segment = this.transcrService.currentlevel.segments.get(segmentNumber);

          if (segment !== undefined) {

            const sampleStart = (segmentNumber > 0)
              ? this.transcrService.currentlevel.segments.get(segmentNumber - 1).time.samples
              : 0;

            this.uiService.addElementFromEvent('shortcut', $event, $event.timestamp,
              this.audioManager.playposition, -1, undefined, {
                start: sampleStart,
                length: segment.time.samples - sampleStart
              }, 'multi-lines-viewer');

            const selection: ASRTimeInterval = {
              sampleStart,
              sampleLength: segment.time.samples - sampleStart
            };

            if (segment.isBlockedBy === undefined) {
              if ($event.value === 'do_asr' || $event.value === 'do_asr_maus' || $event.value === 'do_maus') {
                this.viewer.selectSegment(segmentNumber);

                if ($event.value === 'do_asr') {
                  this.asrService.addToQueue(selection, ASRQueueItemType.ASR);
                  segment.isBlockedBy = ASRQueueItemType.ASR;
                } else if ($event.value === 'do_asr_maus') {
                  this.asrService.addToQueue(selection, ASRQueueItemType.ASRMAUS);
                  segment.isBlockedBy = ASRQueueItemType.ASRMAUS;
                } else if ($event.value === 'do_maus') {
                  if (segment.transcript.trim() === '' || segment.transcript.split(' ').length < 2) {
                    this.alertService.showAlert('danger', this.langService.translate('asr.maus empty text'), false)
                      .catch((error) => {
                        console.error(error);
                      });
                  } else {
                    this.asrService.addToQueue(selection, ASRQueueItemType.MAUS, segment.transcript);
                    segment.isBlockedBy = ASRQueueItemType.MAUS;
                  }
                }
              }
              this.asrService.startASR();
            } else {
              const item = this.asrService.queue.getItemByTime(selection.sampleStart, selection.sampleLength);
              this.asrService.stopASROfItem(item);
              segment.isBlockedBy = undefined;
            }
          }
        } else {
          // open transcr window
          this.openSegment(segmentNumber);
          this.alertService.showAlert('warning', this.langService.translate('asr.no asr selected').toString())
            .catch((error) => {
              console.error(error);
            });
        }
      }
    }

    if ($event.value === undefined || !(
      // cursor move by keyboard events are note saved because this would be too much
      contains($event.value, 'cursor') ||
      contains($event.value, 'segment_enter') ||
      contains($event.value, 'playonhover') ||
      contains($event.value, 'asr')
    )) {
      $event.value = `${$event.type}:${$event.value}`;

      let selection = {
        start: -1,
        length: -1
      };

      if (hasProperty($event, "selection") && $event.selection !== undefined) {
        selection.start = $event.selection.start.samples;
        selection.length = $event.selection.duration.samples;
      } else {
        selection = undefined;
      }

      const caretpos = (!(this.editor === undefined || this.editor === undefined)) ? this.editor.caretpos : -1;
      let playPosition = this.audioManager.playposition;
      if (!this.audioChunkLines.isPlaying) {
        if ($event.type === 'boundary') {
          playPosition = this.viewer.av.MouseClickPos;
        }
      }

      this.uiService.addElementFromEvent('shortcut', $event, $event.timestamp,
        playPosition, caretpos, selection, undefined, 'multi-lines-viewer');

    } else if ($event.value !== undefined && contains($event.value, 'playonhover')) {
      this.appStorage.playonhover = !this.appStorage.playonhover;
    }
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    this.appStorage.audioSpeed = event.new_value;

    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === undefined || this.editor === undefined)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audioManager.playposition, caretpos, undefined, undefined, 'audio_speed');
    }
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    this.appStorage.audioVolume = event.new_value;

    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === undefined || this.editor === undefined)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audioManager.playposition, caretpos, undefined, undefined, 'audio_volume');
    }
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    this.selectedIndex = -1;
    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === undefined || this.editor === undefined)) ? this.editor.caretpos : -1;

      const selection = {
        start: this.viewer.av.drawnSelection.start.samples,
        length: this.viewer.av.drawnSelection.duration.samples
      };

      this.uiService.addElementFromEvent('mouseclick', {value: 'click:' + event.type},
        event.timestamp,
        this.audioManager.playposition, caretpos, selection, undefined, 'audio_buttons');
    }
  }

  public openSegment(segnumber: number) {
    this.onSegmentEntered({index: segnumber});
  }

  public update() {
    this.audioChunkLines.startpos = this.audioChunkLines.time.start.clone();
  }

  onScrollbarMouse(event) {
    if (event.state === 'mousemove') {
      this.loupeHidden = true;
    }
  }

  onScrolling(event) {
    if (event.state === 'scrolling') {
      this.loupeHidden = true;
    }
  }

  onCircleLoupeMouseOver($event) {
    // TODO important what about focus?
    // this.viewer.focus();

    const fullY = this.miniloupe.location.y + 20 + this.miniloupe.size.height;
    if (fullY < this.viewer.height) {
      // loupe is fully visible
      this.miniloupe.location.y = this.miniloupe.location.y + 20;
    } else {
      // loupe out of the bottom border of view rectangle
      this.miniloupe.location.y = this.miniloupe.location.y - 20 - this.miniloupe.size.height;
    }
  }

  afterFirstInitialization() {
    this.checkIfSmallAudioChunk(this.audioChunkLines, this.transcrService.currentlevel);
    this.cd.detectChanges();
  }

  openAuthWindow = () => {
    const url = document.location.href.replace('transcr/', '').replace('transcr', '');
    const left = (window.innerHeight - 200) / 2;
    // tslint:disable-next-line:max-line-length
    const tempWindow = window.open(url + 'auth', '_blank', 'toolbar=false,scrollbars=yes,resizable=true,top=100,left=' + left + ',width=760,height=550');

    if (tempWindow !== undefined) {
      console.log('window opened');
      this.authWindow = tempWindow;
    } else {
      console.log('window can\'t be opened!');
    }
  }

  resetQueueItemsWithNoAuth = () => {
    for (const asrQueueItem of this.asrService.queue.queue) {
      if (asrQueueItem.status === ASRProcessStatus.NOAUTH) {
        // reset
        asrQueueItem.changeStatus(ASRProcessStatus.IDLE);
      }
    }
    this.asrService.queue.start();
  }

  public enableAllShortcuts() {
    this.shortcutsEnabled = true;
    this.viewer.enableShortcuts();
    if (this.window !== undefined && this.window.loupe !== undefined) {
      this.window.loupe.enableShortcuts();
    }
  }

  public disableAllShortcuts() {
    this.shortcutsEnabled = false;
    this.viewer.disableShortcuts();
    if (this.window !== undefined && this.window.loupe !== undefined) {
      this.window.loupe.disableShortcuts();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize($event) {
    // this.viewer.height = this.linesViewHeight;
  }
}
