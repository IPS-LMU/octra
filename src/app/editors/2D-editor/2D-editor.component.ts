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

import {PraatTextgridConverter, Segment} from '../../core/shared';
import {SubscriptionManager} from '../../core/obj/SubscriptionManager';
import {TranscrWindowComponent} from './transcr-window';
import {Subscription} from 'rxjs';
import {TranscrEditorComponent} from '../../core/component';
import {AudioNavigationComponent} from '../../media-components/components/audio/audio-navigation';
import {Functions, isNullOrUndefined} from '../../core/shared/Functions';
import {OCTRAEditor} from '../octra-editor';
import {ASRProcessStatus, ASRQueueItem, ASRQueueItemType, AsrService} from '../../core/shared/service/asr.service';
import {TranslocoService} from '@ngneat/transloco';
import {OAudiofile, OSegment} from '../../core/obj/Annotation';
import {AudioViewerComponent} from '../../media-components/components/audio/audio-viewer/audio-viewer.component';
import {AudioChunk, AudioManager} from '../../media-components/obj/audio/AudioManager';
import {AudioSelection, PlayBackStatus, SampleUnit} from '../../media-components/obj/audio';

@Component({
  selector: 'app-overlay-gui',
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
    this.audioManager = this.audio.audiomanagers[0];
    this.audioChunkLines = this.audioManager.mainchunk.clone();
    this.audioChunkLoupe = this.audioManager.mainchunk.clone();
    this.audioChunkWindow = this.audioManager.mainchunk.clone();
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
    this.viewer.settings.scrollbar.enabled = true;
    this.viewer.settings.margin.right = 20;
    this.viewer.settings.roundValues = false;
    this.viewer.settings.stepWidthRatio = (this.viewer.settings.pixelPerSec / this.audioManager.ressource.info.sampleRate);
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

          // TODO IMPORTANT!
          /*
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
          }*/
        }
      }
    ));

    this.subscrmanager.add(this.audioChunkLines.statuschange.subscribe(
      (state: PlayBackStatus) => {
        if (state === PlayBackStatus.PLAYING) {
          if (!(this.appStorage.followplaycursor === null || this.appStorage.followplaycursor === undefined)
            && this.appStorage.followplaycursor === true) {

            /* TODO important!
            this.scrolltimer = interval(1000).subscribe(() => {
              const absx = this.viewer.av.audioTCalculator.samplestoAbsX(this.audioChunkLines.playposition.samples);
              let y = Math.floor(absx / this.viewer.av.innerWidth) * this.viewer.settings.lineheight;
              y += 10 + (Math.floor(absx / this.viewer.av.innerWidth) * this.viewer.settings.margin.bottom);

              if (y > this.viewer.viewRect.size.height) {
                this.viewer.scrollTo(y);
              }
            });
             */
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
            // TODO important!
            // this.viewer.onSecondsPerLineUpdated(event.value);
            break;
        }
      }
    ));

    this.subscrmanager.add(this.asrService.queue.itemChange.subscribe((item: ASRQueueItem) => {
        if (item.status !== ASRProcessStatus.IDLE) {
          // TODO important change to original sample!
          const segmentBoundary = new SampleUnit(item.time.browserSampleEnd, this.audioManager.sampleRate);
          const segNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
            segmentBoundary, true
          );
          if (segNumber > -1) {
            if (item.status !== ASRProcessStatus.STARTED) {
              console.log(`change segnumber ${segNumber}, ${segmentBoundary.samples}`);
              console.log(`${item.status}`);
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
                  } else if (item.type === ASRQueueItemType.ASRMAUS) {
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

                    const maxWords = 5;
                    const wordsTier = convertedResult.annotjson.levels.find((a) => {
                      return a.name === 'ORT-MAU';
                    });

                    if (!isNullOrUndefined(wordsTier)) {
                      console.log(wordsTier);
                      for (const wordItem of wordsTier.items) {
                        if (wordItem.sampleStart + wordItem.sampleDur <= item.time.sampleStart + item.time.sampleLength) {
                          const readSegment = Segment.fromObj(new OSegment(1, wordItem.sampleStart, wordItem.sampleDur, wordItem.labels),
                            this.audioManager.sampleRate, this.audioManager.sampleRate);
                          if (readSegment.transcript === '<p:>' || readSegment.transcript === '') {
                            readSegment.transcript = this.transcrService.breakMarker.code;
                          }

                          // TODO important check this code with old browser sample values!
                          let origTime = new SampleUnit(item.time.sampleStart + readSegment.time.samples, this.audioManager.sampleRate);
                          const segmentExists = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(origTime, true);
                          if (segmentExists > -1) {
                            this.transcrService.currentlevel.segments.segments[segmentExists].transcript = readSegment.transcript;
                          } else {
                            this.transcrService.currentlevel.segments.add(origTime, readSegment.transcript);
                          }
                        }
                      }
                    } else {
                      console.error(`word tier not found!`);
                    }
                  }
                }

                const index = this.transcrService.currentlevel.segments.segments.findIndex((a) => {
                  return a.time.samples === segment.time.samples;
                });
                if (index > -1) {
                  this.transcrService.currentlevel.segments.change(index, segment);
                }
                // TODO important update?
                // this.viewer.update(true);
              }
              // STOPPED status is ignored because OCTRA should do nothing


              // update GUI
              // TODO important update?
              // this.viewer.update();
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
      this.loupe.av.zoomY = this.factor;
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
        const start: SampleUnit = (selected.index > 0) ? this.transcrService.currentlevel.segments.get(selected.index - 1).time.clone()
          : this.audioManager.createSampleUnit(0);
        if (segment) {
          this.selectedIndex = selected.index;
          this.audioChunkWindow = new AudioChunk(new AudioSelection(start, segment.time.clone()), this.audioManager);

          this.viewer.settings.shortcutsEnabled = false;

          // TODO important?
          // this.viewer.focused = false;
          this.showWindow = true;

          this.uiService.addElementFromEvent('segment', {
            value: 'entered'
          }, Date.now(), this.audioManager.playposition, -1, null, {
            start: start.samples,
            length: this.transcrService.currentlevel.segments.get(selected.index).time.samples - start.samples
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
      this.viewer.settings.shortcutsEnabled = true;
      this.selectedIndex = this.window.segmentIndex;
      this.viewer.selectSegment(this.selectedIndex);
      // important update needed?
      // this.viewer.drawSegments();

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

  onSegmentSelected() {
  }

  onMouseOver(event) {
    if (!(this.mouseTimer === null || this.mouseTimer === undefined)) {
      window.clearTimeout(this.mouseTimer);
    }
    this.mousestate = 'moving';

    if (!this.audioManager.isPlaying && this.appStorage.playonhover) {
      // play audio
      /*
      this.audioChunkLines.selection.start.samples = this.viewer.av.Mousecursor.timePos.samples;
      this.audioChunkLines.selection.end.samples = this.viewer.av.Mousecursor.timePos.samples +
        this.audioManager.sampleRate / 10;
      this.audioChunkLines.startPlayback(() => {
      });*/
    }

    // TODO important CHANGE?
    /*
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
    }*/
  }

  public changePosition(x: number, y: number) {
    const fullY = y + this.miniloupe.size.height;

    // TODO important change?
    /*
    if (fullY < this.viewer.size.height) {
      // loupe is fully visible
      this.miniloupe.location.y = y + 20;
      this.miniloupe.location.x = x - (this.miniloupe.size.width / 2);
    } else {
      // loupe out of the bottom border of view rectangle
      this.miniloupe.location.y = y - 20 - this.miniloupe.size.height;
      this.miniloupe.location.x = x - (this.miniloupe.size.width / 2);
    }
     */
    this.cd.detectChanges();
  }

  onShortCutTriggered($event, type) {
    if (($event.value === 'do_asr' || $event.value === 'cancel_asr' || $event.value === 'do_asr_maus' || $event.value === 'cancel_asr_maus') && $event.type === 'segment') {
      const segmentNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(this.viewer.av.MouseClickPos.timePos);

      if (segmentNumber > -1) {
        if (!isNullOrUndefined(this.asrService.selectedLanguage)) {
          const segment = this.transcrService.currentlevel.segments.get(segmentNumber);

          const sampleStart = (segmentNumber > 0)
            ? this.transcrService.currentlevel.segments.get(segmentNumber - 1).time.samples
            : 0;

          this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
            this.audioManager.playposition, -1, null, {
              start: sampleStart,
              length: segment.time.samples - sampleStart
            }, 'multi-lines-viewer');

          const selection = {
            sampleStart: sampleStart,
            sampleLength: segment.time.samples - sampleStart,
            browserSampleEnd: segment.time.samples
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

          // TODO update needed?
          // this.viewer.update();
        } else {
          // open transcr window
          this.openSegment(segmentNumber);
          this.msg.showMessage('warning', this.langService.translate('asr.no asr selected').toString());
        }
      }
    }

    console.log($event);
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
      let playPosition = this.audioManager.playposition;
      if (!this.audioChunkLines.isPlaying) {
        if ($event.type === 'boundary') {
          playPosition = this.viewer.av.MouseClickPos.timePos
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
    // TODO important where to set speed?
    // this.audioChunkLines.speed = event.new_value;
    this.appStorage.audioSpeed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audioManager.playposition, caretpos, null, null, 'audio_speed');
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
        this.audioManager.playposition, caretpos, null, null, 'audio_volume');
    }
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    this.selectedIndex = -1;
    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;

      let selection = {
        start: this.viewer.av.drawnSelection.start.samples,
        length: this.viewer.av.drawnSelection.duration.samples
      };

      this.uiService.addElementFromEvent('mouseclick', {value: 'click:' + event.type},
        event.timestamp,
        this.audioManager.playposition, caretpos, selection, null, 'audio_buttons');
    }

    switch (event.type) {
      case('play'):
        this.audioChunkLines.startPlayback(false);
        break;
      case('pause'):
        this.audioChunkLines.pausePlayback();
        break;
      case('stop'):
        this.audioChunkLines.stopPlayback();
        break;
      case('replay'):
        this.audioChunkLines.toggleReplay();
        break;
      case('backward'):
        this.audioChunkLines.stepBackward();
        break;
      case('backward time'):
        this.audioChunkLines.stepBackwardTime(0.5);
        break;
      case('default'):
        break;
    }
  }

  public openSegment(segnumber: number) {
    this.onSegmentEntered({index: segnumber});
  }

  public update() {
    // TODO important update needed?
    // this.viewer.update();
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
    this.miniloupe.location.y += $event.layerY + 20;
  }

  private changeArea(loup: AudioViewerComponent, coord: {
    size: {
      width: number,
      height: number
    },
    location: {
      x: number,
      y: number
    }
  }, factor: number) {
    const cursor = this.viewer.av.MouseClickPos;

    if (cursor && cursor.timePos) {
      const halfRate = Math.round(this.audioManager.sampleRate / factor);
      const start = (cursor.timePos.samples > halfRate)
        ? this.audioManager.createSampleUnit(cursor.timePos.samples - halfRate)
        : this.audioManager.createSampleUnit(0);

      const end = (cursor.timePos.samples < this.audioManager.ressource.info.duration.samples - halfRate)
        ? this.audioManager.createSampleUnit(cursor.timePos.samples + halfRate)
        : this.audioManager.ressource.info.duration.clone();

      loup.av.zoomY = factor;
      if (start && end) {
        this.audioChunkLoupe.destroy();
        this.audioChunkLoupe = new AudioChunk(new AudioSelection(start, end), this.audioManager);
      }
    }
    this.cd.detectChanges();
  }

  public afterFirstInitialization() {
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
}
