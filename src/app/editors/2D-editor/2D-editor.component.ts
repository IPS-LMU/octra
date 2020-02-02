import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';

import {
  AppStorageService,
  AudioService,
  KeymappingService,
  MessageService,
  SettingsService,
  TranscriptionService,
  UserInteractionsService
} from '../../core/shared/service';

import {
  AudioSelection,
  BrowserAudioTime,
  BrowserSample,
  OriginalAudioTime,
  OriginalSample,
  PraatTextgridConverter,
  Segment
} from '../../core/shared';
import {SubscriptionManager} from '../../core/obj/SubscriptionManager';
import {TranscrWindowComponent} from './transcr-window';
import {PlayBackState} from '../../media-components/obj/media';
import {interval, Subscription} from 'rxjs';
import {TranscrEditorComponent} from '../../core/component';
import {AudioviewerComponent} from '../../media-components/components/audio/audioviewer';
import {CircleLoupeComponent} from '../../media-components/components/audio/circleloupe';
import {AudioNavigationComponent} from '../../media-components/components/audio/audio-navigation';
import {Line} from '../../media-components/obj';
import {AudioChunk, AudioManager} from '../../media-components/obj/media/audio/AudioManager';
import {Functions, isNullOrUndefined} from '../../core/shared/Functions';
import {OCTRAEditor} from '../octra-editor';
import {ASRProcessStatus, ASRQueueItem, ASRQueueItemType, AsrService} from '../../core/shared/service/asr.service';
import {TranslocoService} from '@ngneat/transloco';
import {OAudiofile, OSegment} from '../../core/obj/Annotation';

@Component({
  selector: 'app-overlay-gui',
  templateUrl: './2D-editor.component.html',
  styleUrls: ['./2D-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoDEditorComponent extends OCTRAEditor implements OnInit, AfterViewInit, OnDestroy {
  public static editorname = '2D-Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer', {static: true}) viewer: AudioviewerComponent;
  @ViewChild('window', {static: false}) window: TranscrWindowComponent;
  @ViewChild('loupe', {static: false}) loupe: CircleLoupeComponent;
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
  public audiomanager: AudioManager;
  public audioChunkLines: AudioChunk;
  public audioChunkWindow: AudioChunk;
  public audioChunkLoupe: AudioChunk;
  private subscrmanager: SubscriptionManager;
  private mousestate = 'initiliazied';
  private intervalID = null;
  private mouseTimer;
  private factor = 8;
  private scrolltimer: Subscription = null;
  private shortcuts: any = {};

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

  constructor(public transcrService: TranscriptionService,
              public keyMap: KeymappingService,
              public audio: AudioService,
              public uiService: UserInteractionsService,
              public msg: MessageService,
              public settingsService: SettingsService,
              public appStorage: AppStorageService,
              private asrService: AsrService,
              private cd: ChangeDetectorRef,
              private langService: TranslocoService) {
    super();

    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.audiomanager = this.audio.audiomanagers[0];
    this.audioChunkLines = this.audiomanager.mainchunk.clone();
    this.audioChunkLoupe = this.audiomanager.mainchunk.clone();
    this.audioChunkWindow = this.audiomanager.mainchunk.clone();
    this.shortcuts = this.keyMap.register('2D-Editor', this.viewer.settings.shortcuts);
    const windowShortcuts = {
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
    this.keyMap.register('Transcription Window', windowShortcuts);

    this.viewer.settings.multiLine = true;
    this.viewer.settings.lineheight = 70;
    this.viewer.settings.margin.bottom = 5;
    this.viewer.settings.margin.right = 0;
    this.viewer.settings.justifySignalHeight = true;
    this.viewer.settings.scrollable = true;
    this.viewer.settings.margin.right = 20;
    this.viewer.settings.roundValues = false;
    this.viewer.settings.stepWidthRatio = (this.viewer.settings.pixelPerSec / this.audiomanager.ressource.info.samplerate);
    this.viewer.settings.showTimePerLine = true;
    this.viewer.settings.showTranscripts = true;
    this.viewer.settings.asr.enabled = (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'demo' || this.appStorage.usemode === 'local')
      && this.settingsService.isASREnabled;
    this.viewer.name = 'multiline viewer';

    this.viewer.secondsPerLine = this.appStorage.secondsPerLine;

    this.viewer.alerttriggered.subscribe(
      (result) => {
        this.msg.showMessage(result.type, result.message);
      }
    );

    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(
      (obj) => {
        if (this.appStorage.showLoupe) {
          const event = obj.event;
          if (this.viewer.focused) {
            if (event.key === '+') {
              this.factor = Math.min(20, this.factor + 1);
              this.changeArea(this.loupe, this.miniloupe, this.factor);
            } else if (event.key === '-') {
              if (this.factor > 3) {
                this.factor = Math.max(1, this.factor - 1);
                this.changeArea(this.loupe, this.miniloupe, this.factor);
              }
            }
          }
        }
      }
    ));

    this.subscrmanager.add(this.audioChunkLines.statechange.subscribe(
      (state: PlayBackState) => {
        if (state === PlayBackState.PLAYING) {
          if (!(this.appStorage.followplaycursor === null || this.appStorage.followplaycursor === undefined)
            && this.appStorage.followplaycursor === true) {

            this.scrolltimer = interval(1000).subscribe(() => {
              const absx = this.viewer.av.audioTCalculator.samplestoAbsX(this.audioChunkLines.playposition.browserSample.value);
              let y = Math.floor(absx / this.viewer.innerWidth) * this.viewer.settings.lineheight;
              y += 10 + (Math.floor(absx / this.viewer.innerWidth) * this.viewer.settings.margin.bottom);

              if (y > this.viewer.viewRect.size.height) {
                this.viewer.scrollTo(y);
              }
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
            this.viewer.onSecondsPerLineUpdated(event.value);
            break;
        }
      }
    ));

    this.subscrmanager.add(this.asrService.queue.itemChange.subscribe((item: ASRQueueItem) => {
        if (item.status !== ASRProcessStatus.IDLE) {
          const segmentBoundary = new BrowserSample(item.time.browserSampleEnd, this.audiomanager.browserSampleRate);
          const segNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
            segmentBoundary, true
          );
          if (segNumber > -1) {
            if (item.status !== ASRProcessStatus.STARTED) {
              const segment = this.transcrService.currentlevel.segments.get(segNumber).clone();
              segment.isBlockedBy = null;

              if (item.status === ASRProcessStatus.NOQUOTA) {
                this.msg.showMessage('error', this.langService.translate('asr.no quota'));
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
                this.msg.showMessage('warning', this.langService.translate('asr.no auth'));
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
                      return a.time.browserSample.value === segment.time.browserSample.value;
                    });
                    if (index > -1) {
                      this.transcrService.currentlevel.segments.change(index, segment);
                    }
                  } else if (item.type === ASRQueueItemType.ASRMAUS) {
                    const converter = new PraatTextgridConverter();

                    const audiofile = new OAudiofile();
                    const audioInfo = this.audiomanager.ressource.info;
                    audiofile.duration = audioInfo.duration.originalSample.value;
                    audiofile.name = `OCTRA_ASRqueueItem_${item.id}.wav`;
                    audiofile.samplerate = this.audiomanager.originalSampleRate;
                    audiofile.size = this.audiomanager.ressource.info.size;
                    audiofile.type = this.audiomanager.ressource.info.type;

                    const convertedResult = converter.import({
                      name: `OCTRA_ASRqueueItem_${item.id}.TextGrid`,
                      content: item.result,
                      type: 'text',
                      encoding: 'utf-8'
                    }, audiofile);

                    const wordsTier = convertedResult.annotjson.levels.find((a) => {
                      return a.name === 'ORT-MAU';
                    });

                    if (!isNullOrUndefined(wordsTier)) {
                      let counter = 0;
                      const segmentEndBrowserTime = new BrowserAudioTime(
                        new BrowserSample(item.time.browserSampleEnd, this.audiomanager.browserSampleRate),
                        this.audiomanager.originalSampleRate);
                      let segmentIndex = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
                        segmentEndBrowserTime.browserSample, true);

                      if (segmentIndex < 0) {
                        console.error(`could not find segment to be precessed by ASRMAUS!`);
                      } else {
                        for (const wordItem of wordsTier.items) {
                          if (wordItem.sampleStart + wordItem.sampleDur <= item.time.sampleStart + item.time.sampleLength) {
                            const readSegment = Segment.fromObj(new OSegment(1, wordItem.sampleStart, wordItem.sampleDur, wordItem.labels),
                              this.audiomanager.originalSampleRate, this.audiomanager.browserSampleRate);
                            if (readSegment.transcript === '<p:>' || readSegment.transcript === '') {
                              readSegment.transcript = this.transcrService.breakMarker.code;
                            }

                            if (counter === wordsTier.items.length - 1) {
                              segmentIndex = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
                                segmentEndBrowserTime.browserSample, true);

                              // the processed segment is now the very right one. Replace its content with the content of the last word item.
                              this.transcrService.currentlevel.segments.segments[segmentIndex].transcript = readSegment.transcript;
                              this.transcrService.currentlevel.segments.change(segmentIndex, this.transcrService.currentlevel.segments.segments[segmentIndex].clone());
                            } else {
                              let origTime = new OriginalAudioTime(new OriginalSample(item.time.sampleStart + readSegment.time.originalSample.value, this.audiomanager.originalSampleRate),
                                this.audiomanager.browserSampleRate
                              );
                              let browserTime = origTime.convertToBrowserAudioTime();
                              this.transcrService.currentlevel.segments.add(browserTime, readSegment.transcript);
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
                }

                // this.viewer.update(true);
              }
              // STOPPED status is ignored because OCTRA should do nothing


              // update GUI
              this.viewer.update();
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
      this.loupe.zoomY = this.factor;
    }
    this.viewer.onInitialized.subscribe(
      () => {
      }, () => {
      }, () => {
        TwoDEditorComponent.initialized.emit();
      });
    // this.viewer.onSecondsPerLineUpdated(this.appStorage.secondsPerLine);
  }

  onSegmentEntered(selected: any) {
    if (this.transcrService.currentlevel.segments && selected.index > -1 &&
      selected.index < this.transcrService.currentlevel.segments.length) {
      const segment = this.transcrService.currentlevel.segments.get(selected.index);
      if (segment.isBlockedBy !== ASRQueueItemType.ASRMAUS) {
        const start: BrowserAudioTime | OriginalAudioTime = (selected.index > 0) ? this.transcrService.currentlevel.segments.get(selected.index - 1).time.clone()
          : this.audiomanager.createBrowserAudioTime(0);
        if (segment) {
          this.selectedIndex = selected.index;
          this.audioChunkWindow = new AudioChunk(new AudioSelection(start, segment.time.clone()), this.audiomanager);

          this.viewer.deactivateShortcuts = true;
          this.viewer.focused = false;
          this.showWindow = true;

          this.uiService.addElementFromEvent('segment', {
            value: 'entered'
          }, Date.now(), this.audiomanager.playposition, -1, null, {
            start: start.originalSample.value,
            length: this.transcrService.currentlevel.segments.get(selected.index).time.originalSample.value - start.originalSample.value
          }, TwoDEditorComponent.editorname);
          this.cd.markForCheck();
          this.cd.detectChanges();
        }
      } else {
        this.msg.showMessage('error', 'You can\'t open this segment while processing segmentation. If you need to open it, cancel segmentation first.');
      }
    }
  }

  onWindowAction(state) {
    if (state === 'close') {
      this.showWindow = false;
      this.viewer.deactivateShortcuts = false;
      this.selectedIndex = this.window.segmentIndex;
      this.viewer.selectSegment(this.selectedIndex);
      this.viewer.drawSegments();

      const segment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
      const absx = this.viewer.av.audioTCalculator.samplestoAbsX(segment.time.browserSample.value);

      let y = Math.floor(absx / this.viewer.innerWidth) * this.viewer.settings.lineheight;
      y += 10 + (Math.floor(absx / this.viewer.innerWidth) * this.viewer.settings.margin.bottom);
      Functions.scrollTo(y, '#special');

    } else if (state === 'open') {
    } else if (state === 'overview') {
      this.openModal.emit('overview');
    }
  }

  onSegmentSelected() {
  }

  onMouseOver(event) {
    if (!(this.mouseTimer === null || this.mouseTimer === undefined)) {
      window.clearTimeout(this.mouseTimer);
    }
    this.mousestate = 'moving';

    if (!this.audiomanager.isPlaying && this.appStorage.playonhover) {
      // play audio
      /*
      this.audioChunkLines.selection.start.browserSample.value = this.viewer.av.Mousecursor.timePos.browserSample.value;
      this.audioChunkLines.selection.end.browserSample.value = this.viewer.av.Mousecursor.timePos.browserSample.value +
        this.audiomanager.browserSampleRate / 10;
      this.audioChunkLines.startPlayback(() => {
      });*/
    }

    if (this.appStorage.showLoupe) {
      const lastlinevisible: Line = this.viewer.av.LinesArray[this.viewer.av.LinesArray.length - 1];
      if (!isNullOrUndefined(lastlinevisible) && this.miniloupe.location.y <= (lastlinevisible.Pos.y - this.viewer.viewRect.position.y +
        lastlinevisible.Size.height + this.viewer.margin.top + this.viewer.margin.bottom)) {
        this.loupeHidden = false;
        this.mouseTimer = window.setTimeout(() => {
          this.changeArea(this.loupe, this.miniloupe, this.factor);
          this.mousestate = 'ended';

        }, 50);
      } else {
        this.loupeHidden = true;
      }
    }
  }

  public changePosition(x: number, y: number) {
    const fullY = y + this.miniloupe.size.height;

    if (fullY < this.viewer.viewRect.size.height) {
      // loupe is fully visible
      this.miniloupe.location.y = y + 20;
      this.miniloupe.location.x = x - (this.miniloupe.size.width / 2);
    } else {
      // loupe out of the bottom border of view rectangle
      this.miniloupe.location.y = y - 20 - this.miniloupe.size.height;
      this.miniloupe.location.x = x - (this.miniloupe.size.width / 2);
    }
    this.cd.detectChanges();
  }

  onShortCutTriggered($event, type) {
    if (($event.value === 'do_asr' || $event.value === 'cancel_asr' || $event.value === 'do_asr_maus' || $event.value === 'cancel_asr_maus') && $event.type === 'segment') {
      const segmentNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(this.viewer.MouseCursor.timePos.browserSample);

      if (segmentNumber > -1) {
        if (!isNullOrUndefined(this.asrService.selectedLanguage)) {
          const segment = this.transcrService.currentlevel.segments.get(segmentNumber);

          const sampleStart = (segmentNumber > 0)
            ? this.transcrService.currentlevel.segments.get(segmentNumber - 1).time.originalSample.value
            : 0;

          this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
            this.audiomanager.playposition, -1, null, {
              start: sampleStart,
              length: segment.time.originalSample.value - sampleStart
            }, 'multi-lines-viewer');

          const selection = {
            sampleStart: sampleStart,
            sampleLength: segment.time.originalSample.value - sampleStart,
            browserSampleEnd: segment.time.browserSample.value
          };

          if (segment.isBlockedBy === null) {
            if ($event.value === 'do_asr') {
              this.asrService.addToQueue(selection, ASRQueueItemType.ASR);
              segment.isBlockedBy = ASRQueueItemType.ASR;
            } else if ($event.value === 'do_asr_maus') {
              this.asrService.addToQueue(selection, ASRQueueItemType.ASRMAUS);
              segment.isBlockedBy = ASRQueueItemType.ASRMAUS;
            }
            this.asrService.startASR();
          } else {
            const item = this.asrService.queue.getItemByTime(selection.sampleStart, selection.sampleLength);
            this.asrService.stopASROfItem(item);
            segment.isBlockedBy = null;
          }

          this.viewer.update();
        } else {
          // open transcr window
          this.openSegment(segmentNumber);
          this.msg.showMessage('warning', this.langService.translate('asr.no asr selected').toString());
        }
      }
    }

    if (
      $event.value === null || !(
        // cursor move by keyboard events are note saved because this would be too much
      Functions.contains($event.value, 'cursor') ||
      Functions.contains($event.value, 'segment_enter') ||
      Functions.contains($event.value, 'playonhover') ||
      Functions.contains($event.value, 'asr'))
    ) {
      $event.value = `${$event.type}:${$event.value}`;

      let selection = {
        start: -1,
        length: -1
      };

      if ($event.hasOwnProperty('selection') && !isNullOrUndefined($event.selection)) {
        selection.start = $event.selection.start;
        selection.length = $event.selection.length;
      } else {
        selection = null;
      }

      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;
      let playPosition = this.audiomanager.playposition;
      if (!this.audioChunkLines.isPlaying) {
        if ($event.type === 'boundary') {
          playPosition = this.viewer.MouseCursor.timePos
        }
      }

      this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
        playPosition, caretpos, selection, null, 'multi-lines-viewer');

    } else if ($event.value !== null && Functions.contains($event.value, 'playonhover')) {
      this.appStorage.playonhover = !this.appStorage.playonhover;
    }

    this.cd.detectChanges();
  }

  onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audioChunkLines.speed = event.new_value;
    this.appStorage.audioSpeed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audiomanager.playposition, caretpos, null, null, 'audio_speed');
    }
  }

  onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audioChunkLines.volume = event.new_value;
    this.appStorage.audioVolume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audiomanager.playposition, caretpos, null, null, 'audio_volume');
    }
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    this.selectedIndex = -1;
    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;

      let selection = {
        start: this.viewer.av.drawnselection.start.originalSample.value,
        length: this.viewer.av.drawnselection.duration.originalSample.value
      };

      this.uiService.addElementFromEvent('mouseclick', {value: 'click:' + event.type},
        event.timestamp,
        this.audiomanager.playposition, caretpos, selection, null, 'audio_buttons');
    }

    switch (event.type) {
      case('play'):
        this.viewer.startPlayback(() => {
        });
        break;
      case('pause'):
        this.viewer.pausePlayback(() => {
        });
        break;
      case('stop'):
        this.viewer.stopPlayback(() => {
        });
        break;
      case('replay'):
        this.viewer.rePlayback();
        this.audionav.replay = this.viewer.audiochunk.replay;
        break;
      case('backward'):
        this.viewer.stepBackward(() => {
        });
        break;
      case('backward time'):
        this.viewer.stepBackwardTime(() => {
        }, 0.5);
        break;
      case('default'):
        break;
    }
  }

  public openSegment(segnumber: number) {
    this.onSegmentEntered({index: segnumber});
  }

  public update() {
    this.viewer.update();
    this.audioChunkLines.startpos = this.audioChunkLines.time.start.clone() as BrowserAudioTime;
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
    this.viewer.focus();
    this.miniloupe.location.y += $event.layerY + 20;
  }

  private changeArea(loup: CircleLoupeComponent, coord: {
    size: {
      width: number,
      height: number
    },
    location: {
      x: number,
      y: number
    }
  }, factor: number) {
    const cursor = this.viewer.MouseCursor;

    if (cursor && cursor.timePos && cursor.relPos) {
      const halfRate = Math.round(this.audiomanager.browserSampleRate / factor);
      const start = (cursor.timePos.browserSample.value > halfRate)
        ? this.audiomanager.createBrowserAudioTime(cursor.timePos.browserSample.value - halfRate)
        : this.audiomanager.createBrowserAudioTime(0);

      const end = (cursor.timePos.browserSample.value < this.audiomanager.ressource.info.duration.browserSample.value - halfRate)
        ? this.audiomanager.createBrowserAudioTime(cursor.timePos.browserSample.value + halfRate)
        : this.audiomanager.ressource.info.duration.clone();

      loup.zoomY = factor;
      if (start && end) {
        this.audioChunkLoupe.destroy();
        this.audioChunkLoupe = new AudioChunk(new AudioSelection(start, end), this.audiomanager);
      }
    }
    this.cd.detectChanges();
  }

  public afterFirstInitialization() {
    const emptySegmentIndex = this.transcrService.currentlevel.segments.segments.findIndex((a) => {
      return a.transcript === '';
    });
    if (this.audioChunkLines.time.duration.browserSample.seconds <= 35) {
      if (emptySegmentIndex > -1) {
        this.openSegment(emptySegmentIndex);
      } else if (this.transcrService.currentlevel.segments.length === 1) {
        this.openSegment(0);
      }
    }
    this.cd.detectChanges();
  }
}
