import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {TranslocoService} from '@ngneat/transloco';
import {
  ASRQueueItemType,
  AudioChunk,
  AudioManager,
  AudioNavigationComponent,
  AudioSelection,
  AudioViewerComponent,
  AudioviewerConfig,
  OAudiofile,
  OSegment,
  PlayBackStatus,
  SampleUnit,
  Segment
} from 'octra-components';
import {interval, Subscription} from 'rxjs';
import {AuthenticationNeededComponent} from '../../core/alerts/authentication-needed/authentication-needed.component';
import {ErrorOccurredComponent} from '../../core/alerts/error-occurred/error-occurred.component';
import {TranscrEditorComponent} from '../../core/component';
import {SubscriptionManager} from '../../core/obj/SubscriptionManager';

import {PraatTextgridConverter} from '../../core/shared';
import {Functions, isUnset} from '../../core/shared/Functions';

import {
  AlertService,
  AppStorageService,
  AudioService,
  KeymappingService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';
import {ASRProcessStatus, ASRQueueItem, AsrService} from '../../core/shared/service/asr.service';
import {OCTRAEditor} from '../octra-editor';
import {TranscrWindowComponent} from './transcr-window';

@Component({
  selector: 'octra-overlay-gui',
  templateUrl: './2D-editor.component.html',
  styleUrls: ['./2D-editor.component.css']
})
export class TwoDEditorComponent extends OCTRAEditor implements OnInit, AfterViewInit, OnDestroy {

  public static editorname = '2D-Editor';
  public static initialized: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('viewer', {static: true}) viewer: AudioViewerComponent;
  @ViewChild('linesView', {static: true}) linesView: ElementRef;
  @ViewChild('window', {static: false}) window: TranscrWindowComponent;
  @ViewChild('loupe', {static: false}) loupe: AudioViewerComponent;
  @ViewChild('audionav', {static: true}) audionav: AudioNavigationComponent;
  @Output() public openModal = new EventEmitter();
  public showWindow = false;
  public loupeHidden = true;
  public selectedIndex: number;
  public miniloupe: {
    size: {
      width: number,
      height: number
    },
    location: {
      x: number,
      y: number
    }
  } = {
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
  private subscrmanager: SubscriptionManager;
  private mousestate = 'initiliazied';
  private intervalID = null;
  private mouseTimer;
  private factor = 8;
  private scrolltimer: Subscription = null;
  private shortcuts: any = {};
  private authWindow: Window = null;
  private windowShortcuts = {
    jump_left: {
      keys: {
        mac: 'ALT + ARROWLEFT',
        pc: 'ALT + ARROWLEFT'
      },
      focusonly: false,
      title: 'jump_last_segment'
    },
    jump_right: {
      keys: {
        mac: 'ALT + ARROWRIGHT',
        pc: 'ALT + ARROWRIGHT'
      },
      focusonly: false,
      title: 'jump_next_segment'
    },
    close_save: {
      keys: {
        mac: 'ALT + ARROWDOWN',
        pc: 'ALT + ARROWDOWN'
      },
      focusonly: false,
      title: 'close_save'
    }
  };

  public get editor(): TranscrEditorComponent {
    if ((this.window === null || this.window === undefined)) {
      return null;
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

  public get linesViewHeight(): number {
    if (!isUnset(this.linesView) && !isUnset(this.linesView.nativeElement)) {
      return this.linesView.nativeElement.clientHeight;
    }
    return 0;
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
              private langService: TranslocoService) {
    super();
    this.miniLoupeSettings = new AudioviewerConfig();

    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    console.log(`2D-EDITOR INIT!`);
    this.audioManager = this.audio.audiomanagers[0];
    this.audioChunkLines = this.audioManager.mainchunk.clone();
    this.audioChunkWindow = this.audioManager.mainchunk.clone();
    this.shortcuts = this.keyMap.register('2D-Editor', this.viewer.settings.shortcuts);
    this.keyMap.register('Transcription Window', this.windowShortcuts);

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
    this.viewer.name = 'multiline viewer';
    this.viewer.height = this.linesViewHeight;

    this.viewer.secondsPerLine = this.appStorage.secondsPerLine;

    this.miniLoupeSettings.roundValues = false;
    this.miniLoupeSettings.shortcutsEnabled = false;
    this.miniLoupeSettings.selection.enabled = false;
    this.miniLoupeSettings.boundaries.readonly = true;
    this.miniLoupeSettings.asr.enabled = false;
    this.miniLoupeSettings.cropping = 'circle';
    this.miniLoupeSettings.cursor.fixed = true;

    this.audioChunkLoupe = this.audioManager.mainchunk.clone();

    this.viewer.alerttriggered.subscribe(
      (result) => {
        this.alertService.showAlert(result.type, result.message);
      }
    );

    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(
      (obj) => {
        if (this.appStorage.showLoupe) {
          const event = obj.event;

          if (event.key === '+') {
            this.factor = Math.min(20, this.factor + 1);
            this.changeArea(this.loupe, this.miniloupe, this.viewer.av.mouseCursor, this.factor);
          } else if (event.key === '-') {
            if (this.factor > 3) {
              this.factor = Math.max(1, this.factor - 1);
              this.changeArea(this.loupe, this.miniloupe, this.viewer.av.mouseCursor, this.factor);
            }
          }
        }
      }
    ));

    this.subscrmanager.add(this.audioChunkLines.statuschange.subscribe(
      (state: PlayBackStatus) => {
        if (state === PlayBackStatus.PLAYING) {
          if (!(this.appStorage.followplaycursor === null || this.appStorage.followplaycursor === undefined)
            && this.appStorage.followplaycursor === true) {

            if (this.scrolltimer !== null) {
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
          if (this.scrolltimer !== null) {
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
        if (item.status !== ASRProcessStatus.IDLE) {
          // TODO important change to original sample!
          const segmentBoundary = new SampleUnit(item.time.browserSampleEnd, this.audioManager.sampleRate);
          const segNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(segmentBoundary);
          if (segNumber > -1) {
            if (item.status !== ASRProcessStatus.STARTED) {
              let segment = this.transcrService.currentlevel.segments.get(segNumber);

              if (!isUnset(segment)) {
                segment = segment.clone();
                segment.isBlockedBy = null;

                if (item.status === ASRProcessStatus.NOQUOTA) {
                  this.alertService.showAlert('danger', this.langService.translate('asr.no quota'));
                  this.uiService.addElementFromEvent(item.type.toLowerCase(), {
                    value: 'failed'
                  }, Date.now(), null, null, null, {
                    start: item.time.sampleStart,
                    length: item.time.sampleLength
                  }, 'automation');
                } else if (item.status === ASRProcessStatus.NOAUTH) {
                  this.uiService.addElementFromEvent(item.type.toLowerCase(), {
                    value: 'no_auth'
                  }, Date.now(), null, null, null, {
                    start: item.time.sampleStart,
                    length: item.time.sampleLength
                  }, 'automation');

                  this.alertService.showAlert('warning', AuthenticationNeededComponent, true, -1).then((item) => {
                    const auth = item.component as AuthenticationNeededComponent;
                    this.subscrmanager.add(auth.authenticateClick.subscribe(() => {
                      this.openAuthWindow();
                    }));
                    this.subscrmanager.add(auth.confirmationClick.subscribe(() => {
                      this.resetQueueItemsWithNoAuth();
                      this.alertService.closeAlert(item.id);
                    }));
                  });
                } else {
                  if (item.status === ASRProcessStatus.FINISHED && item.result !== '') {
                    this.uiService.addElementFromEvent(item.type.toLowerCase(), {
                      value: 'finished'
                    }, Date.now(), null, null, null, {
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

                      if (!isUnset(wordsTier)) {
                        let counter = 0;
                        const segmentEndBrowserTime = new SampleUnit(item.time.browserSampleEnd, this.audioManager.sampleRate);
                        let segmentIndex = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(segmentEndBrowserTime);

                        if (segmentIndex < 0) {
                          console.error(`could not find segment to be precessed by ASRMAUS!`);
                        } else {
                          for (const wordItem of wordsTier.items) {
                            if (wordItem.sampleStart + wordItem.sampleDur <= item.time.sampleStart + item.time.sampleLength) {
                              const readSegment = Segment.fromObj(new OSegment(1, wordItem.sampleStart, wordItem.sampleDur, wordItem.labels),
                                this.audioManager.sampleRate);
                              if (readSegment.transcript === '<p:>' || readSegment.transcript === '') {
                                readSegment.transcript = this.transcrService.breakMarker.code;
                              }

                              if (counter === wordsTier.items.length - 1) {
                                segmentIndex = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(segmentEndBrowserTime);

                                // the processed segment is now the very right one. Replace its content with the content of the last word item.
                                this.transcrService.currentlevel.segments.segments[segmentIndex].transcript = readSegment.transcript;
                                this.transcrService.currentlevel.segments.change(segmentIndex, this.transcrService.currentlevel.segments.segments[segmentIndex].clone());
                              } else {
                                const origTime = new SampleUnit(item.time.sampleStart + readSegment.time.samples, this.audioManager.sampleRate);
                                this.transcrService.currentlevel.segments.add(origTime, readSegment.transcript);
                              }
                            } else {
                              console.error(`wordItem samples are out of the correct boundaries.`);
                              console.error(`${wordItem.sampleStart} + ${wordItem.sampleDur} <= ${item.time.sampleStart} + ${item.time.sampleLength}`);
                            }
                            counter++;
                          }
                        }
                      } else {
                        console.error(`word tier not found!`);
                      }
                    }
                  } else if (item.status === ASRProcessStatus.FAILED) {
                    this.alertService.showAlert('danger', ErrorOccurredComponent, true, -1);
                    segment.isBlockedBy = null;
                    this.transcrService.currentlevel.segments.change(segNumber, segment);
                  }

                  // this.viewer.update(true);
                }
                // STOPPED status is ignored because OCTRA should do nothing

                // update GUI
                // TODO important update?
                // this.viewer.update();
              } else {
                console.error(`can't start ASR because segment not found!`);
              }
            } else {
              // item started
              this.uiService.addElementFromEvent(item.type.toLowerCase(), {
                value: 'started'
              }, Date.now(), null, null, null, {
                start: item.time.sampleStart,
                length: item.time.sampleLength
              }, 'automation');
            }
          } else {
            console.error(new Error(`couldn't find segment number`));
          }
        }
      },
      (error) => {
      },
      () => {
      }));
  }

  ngOnDestroy() {
    this.audioManager.stopPlayback().catch(() => {
      console.error(`could not stop audio on editor switched`);
    });

    clearInterval(this.intervalID);
    this.subscrmanager.destroy();
    if (this.scrolltimer !== null) {
      this.scrolltimer.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.subscrmanager.add(
      this.transcrService.segmentrequested.subscribe(
        (segnumber: number) => {
          this.openSegment(segnumber);
        }
      )
    );

    if (this.appStorage.showLoupe) {
      this.loupe.av.zoomY = this.factor;
    }
    const subscr = this.viewer.onInitialized.subscribe(
      () => {
        subscr.unsubscribe();
        this.viewer.height = this.linesViewHeight;
        TwoDEditorComponent.initialized.emit();
      }, () => {
      }, () => {
      });
  }

  onSegmentEntered(selected: any) {
    if (this.transcrService.currentlevel.segments && selected.index > -1 &&
      selected.index < this.transcrService.currentlevel.segments.length) {
      const segment = this.transcrService.currentlevel.segments.get(selected.index);

      if (!isUnset(segment)) {
        if (segment.isBlockedBy !== ASRQueueItemType.ASRMAUS && segment.isBlockedBy !== ASRQueueItemType.MAUS) {
          const start: SampleUnit = (selected.index > 0) ? this.transcrService.currentlevel.segments.get(selected.index - 1).time.clone()
            : this.audioManager.createSampleUnit(0);
          this.selectedIndex = selected.index;
          this.audioChunkWindow = new AudioChunk(new AudioSelection(start, segment.time.clone()), this.audioManager);

          this.viewer.settings.shortcutsEnabled = false;
          this.showWindow = true;

          this.uiService.addElementFromEvent('segment', {
            value: 'entered'
          }, Date.now(), this.audioManager.playposition, -1, null, {
            start: start.samples,
            length: this.transcrService.currentlevel.segments.get(selected.index).time.samples - start.samples
          }, TwoDEditorComponent.editorname);
          this.cd.markForCheck();
          this.cd.detectChanges();
        } else {
          this.alertService.showAlert('danger', 'You can\'t open this segment while processing segmentation. If you need to open it, cancel segmentation first.');
        }
      } else {
        console.error(`couldn't find segment with index ${selected.index}`);
      }
    }
  }

  onWindowAction(state) {
    if (state === 'close') {
      this.showWindow = false;
      this.viewer.settings.shortcutsEnabled = true;
      this.selectedIndex = this.window.segmentIndex;
      this.viewer.selectSegment(this.selectedIndex);

      const segment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
      const absx = this.viewer.av.audioTCalculator.samplestoAbsX(segment.time);

      let y = Math.floor(absx / this.viewer.av.innerWidth) * this.viewer.settings.lineheight;
      y += 10 + (Math.floor(absx / this.viewer.av.innerWidth) * this.viewer.settings.margin.bottom);
      Functions.scrollTo(y, '#special');

    } else if (state === 'open') {
    } else if (state === 'overview') {
      this.openModal.emit('overview');
    }
  }

  onMouseOver($event: {
    event: MouseEvent | null
    time: SampleUnit
  }) {
    if (!(this.mouseTimer === null || this.mouseTimer === undefined)) {
      window.clearTimeout(this.mouseTimer);
    }
    this.mousestate = 'moving';

    if (!this.audioManager.isPlaying && this.appStorage.playonhover) {
      // play audio on hover

      // it's very important to use a seperate chunk for the hover playback!
      const audioChunkHover = this.audioChunkLines.clone();
      audioChunkHover.volume = 1;
      audioChunkHover.playbackRate = 1;
      audioChunkHover.selection.start = this.viewer.av.mouseCursor.clone();
      audioChunkHover.selection.end = this.viewer.av.mouseCursor.add(
        this.audioManager.createSampleUnit(this.audioManager.sampleRate / 10)
      );
      audioChunkHover.startPlayback(true);
    }

    if (this.appStorage.showLoupe) {
      this.loupeHidden = false;
      this.mouseTimer = window.setTimeout(() => {
        this.changeLoupePosition($event.event, $event.time);
        this.mousestate = 'ended';
      }, 20);
    }
  }

  public changeLoupePosition(mouseEvent: MouseEvent, cursorTime: SampleUnit) {

    const fullY = mouseEvent.offsetY + 20 + this.miniloupe.size.height;
    const x = mouseEvent.offsetX - ((this.miniloupe.size.width - 10) / 2) - 2;

    if (fullY < this.viewer.height) {
      // loupe is fully visible
      this.miniloupe.location.y = mouseEvent.offsetY + 20;
      this.miniloupe.location.x = x;
    } else {
      // loupe out of the bottom border of view rectangle
      this.miniloupe.location.y = mouseEvent.offsetY - 20 - this.miniloupe.size.height;
      this.miniloupe.location.x = x;
    }

    this.loupeHidden = false;
    this.changeArea(this.loupe, this.miniloupe, cursorTime, this.factor);
    this.cd.detectChanges();
  }

  onShortCutTriggered($event, type) {
    if (($event.value === 'do_asr' || $event.value === 'cancel_asr'
      || $event.value === 'do_asr_maus' || $event.value === 'cancel_asr_maus'
      || $event.value === 'do_maus' || $event.value === 'cancel_maus'
    ) && $event.type === 'segment') {
      const segmentNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(this.viewer.av.MouseClickPos);

      if (segmentNumber > -1) {
        if (!isUnset(this.asrService.selectedLanguage)) {
          const segment = this.transcrService.currentlevel.segments.get(segmentNumber);

          if (!isUnset(segment)) {

            const sampleStart = (segmentNumber > 0)
              ? this.transcrService.currentlevel.segments.get(segmentNumber - 1).time.samples
              : 0;

            this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
              this.audioManager.playposition, -1, null, {
                start: sampleStart,
                length: segment.time.samples - sampleStart
              }, 'multi-lines-viewer');

            const selection = {
              sampleStart,
              sampleLength: segment.time.samples - sampleStart,
              browserSampleEnd: segment.time.samples
            };

            if (segment.isBlockedBy === null) {
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
                    this.alertService.showAlert('danger', this.langService.translate('asr.maus empty text'), false);
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
              segment.isBlockedBy = null;
            }
          } else {

          }
        }

        // TODO update needed?
        // this.viewer.update().catch((error) => {
        //             console.error(`could not update GUI for multiline-viewer`);
        //             console.error(error);
        //           });
      } else {
        // open transcr window
        this.openSegment(segmentNumber);
        this.alertService.showAlert('warning', this.langService.translate('asr.no asr selected').toString());
      }
    }

    if ($event.value === null || !(
      // cursor move by keyboard events are note saved because this would be too much
      Functions.contains($event.value, 'cursor') ||
      Functions.contains($event.value, 'segment_enter') ||
      Functions.contains($event.value, 'playonhover') ||
      Functions.contains($event.value, 'asr')
    )) {
      $event.value = `${$event.type}:${$event.value}`;

      let selection = {
        start: -1,
        length: -1
      };

      if ($event.hasOwnProperty('selection') && !isUnset($event.selection)) {
        selection.start = $event.selection.start;
        selection.length = $event.selection.length;
      } else {
        selection = null;
      }

      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;
      let playPosition = this.audioManager.playposition;
      if (!this.audioChunkLines.isPlaying) {
        if ($event.type === 'boundary') {
          playPosition = this.viewer.av.MouseClickPos;
        }
      }

      this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
        playPosition, caretpos, selection, null, 'multi-lines-viewer');

    } else if ($event.value !== null && Functions.contains($event.value, 'playonhover')) {
      this.appStorage.playonhover = !this.appStorage.playonhover;
    }

    this.cd.detectChanges();
  }

  afterSpeedChange(event
                     :
                     {
                       new_value: number, timestamp
                         :
                         number
                     }
  ) {
    this.appStorage.audioSpeed = event.new_value;

    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audioManager.playposition, caretpos, null, null, 'audio_speed');
    }
  }

  afterVolumeChange(event
                      :
                      {
                        new_value: number, timestamp
                          :
                          number
                      }
  ) {
    this.appStorage.audioVolume = event.new_value;

    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audioManager.playposition, caretpos, null, null, 'audio_volume');
    }
  }

  onButtonClick(event: { type: string, timestamp: number }
  ) {
    this.selectedIndex = -1;
    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;

      const selection = {
        start: this.viewer.av.drawnSelection.start.samples,
        length: this.viewer.av.drawnSelection.duration.samples
      };

      this.uiService.addElementFromEvent('mouseclick', {value: 'click:' + event.type},
        event.timestamp,
        this.audioManager.playposition, caretpos, selection, null, 'audio_buttons');
    }
  }

  public openSegment(segnumber
                       :
                       number
  ) {
    this.onSegmentEntered({index: segnumber});
  }

  public update() {
    // TODO important update needed?
    // this.viewer.update().catch((error) => {
    //       console.error(`could not update GUI for multiline-viewer`);
    //       console.error(error);
    //     });
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

  changeArea(loup
               :
               AudioViewerComponent, coord
               :
               {
                 size: {
                   width: number,
                   height
                     :
                     number
                 },
                 location: {
                   x: number,
                   y
                     :
                     number
                 }
               }
    ,
             cursorTime: SampleUnit, factor
               :
               number
  ) {
    const cursorLocation = this.viewer.mouseCursor;
    if (cursorLocation && cursorTime) {
      const halfRate = Math.round(this.audioManager.sampleRate / factor);
      const start = (cursorTime.samples > halfRate)
        ? this.audioManager.createSampleUnit(cursorTime.samples - halfRate)
        : this.audioManager.createSampleUnit(0);

      const end = (cursorTime.samples < this.audioManager.ressource.info.duration.samples - halfRate)
        ? this.audioManager.createSampleUnit(cursorTime.samples + halfRate)
        : this.audioManager.ressource.info.duration.clone();

      loup.av.zoomY = factor;
      if (start && end) {
        this.audioChunkLoupe.destroy();
        this.audioChunkLoupe = new AudioChunk(new AudioSelection(start, end), this.audioManager);
      }
    }
    this.cd.detectChanges();
  }

  afterFirstInitialization() {
    const emptySegmentIndex = this.transcrService.currentlevel.segments.segments.findIndex((a) => {
      return a.transcript === '';
    });
    if (this.audioChunkLines.time.duration.seconds <= 35) {
      if (emptySegmentIndex > -1) {
        this.openSegment(emptySegmentIndex);
      } else if (this.transcrService.currentlevel.segments.length === 1) {
        this.openSegment(0);
      }
    }
    this.cd.detectChanges();
  }

  openAuthWindow = () => {
    const url = document.location.href.replace('transcr/', '').replace('transcr', '');
    const left = (window.innerHeight - 200) / 2;
    const tempWindow = window.open(url + 'auth', '_blank', 'toolbar=false,scrollbars=yes,resizable=true,top=100,left=' + left + ',width=760,height=550');

    if (tempWindow !== null) {
      console.log('window opened');
      this.authWindow = tempWindow;
    } else {
      console.log('window can\'t be opened!');
    }
  };

  resetQueueItemsWithNoAuth = () => {
    for (const asrQueueItem of this.asrService.queue.queue) {
      if (asrQueueItem.status === ASRProcessStatus.NOAUTH) {
        // reset
        asrQueueItem.changeStatus(ASRProcessStatus.IDLE);
      }
    }
    this.asrService.queue.start();
  };

  public enableAllShortcuts() {
    this.viewer.enableShortcuts();
    if (!isUnset(this.window) && !isUnset(this.window.loupe)) {
      this.window.loupe.enableShortcuts();
    }
  }

  public disableAllShortcuts() {
    this.viewer.disableShortcuts();
    if (!isUnset(this.window) && !isUnset(this.window.loupe)) {
      this.window.loupe.disableShortcuts();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize($event) {
    this.viewer.height = this.linesViewHeight;
  }
}
