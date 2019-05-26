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

import {AudioSelection, BrowserAudioTime} from '../../core/shared';
import {SubscriptionManager} from '../../core/obj/SubscriptionManager';
import {AudioChunk} from '../../media-components/obj/media/audio';
import {TranscrWindowComponent} from './transcr-window';
import {PlayBackState} from '../../media-components/obj/media';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {TranscrEditorComponent} from '../../core/component';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/interval';
import {AudioviewerComponent} from '../../media-components/components/audio/audioviewer';
import {CircleLoupeComponent} from '../../media-components/components/audio/circleloupe';
import {AudioNavigationComponent} from '../../media-components/components/audio/audio-navigation';
import {Line} from '../../media-components/obj';
import {AudioManager} from '../../media-components/obj/media/audio/AudioManager';
import {Functions, isNullOrUndefined} from '../../core/shared/Functions';
import {OCTRAEditor} from '../octra-editor';

@Component({
  selector: 'app-overlay-gui',
  templateUrl: './2D-editor.component.html',
  styleUrls: ['./2D-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoDEditorComponent extends OCTRAEditor implements OnInit, AfterViewInit, OnDestroy {
  public static editorname = '2D-Editor';

  public static initialized: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('viewer') viewer: AudioviewerComponent;
  @ViewChild('window') window: TranscrWindowComponent;
  @ViewChild('loupe') loupe: CircleLoupeComponent;
  @ViewChild('audionav') audionav: AudioNavigationComponent;

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
              private cd: ChangeDetectorRef) {
    super();

    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.audiomanager = this.audio.audiomanagers[0];
    this.audioChunkLines = this.audiomanager.mainchunk.clone();
    this.audioChunkLoupe = this.audiomanager.mainchunk.clone();
    this.audioChunkWindow = this.audiomanager.mainchunk.clone();
    this.shortcuts = this.keyMap.register('2D-Editor', this.viewer.Settings.shortcuts);
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

    this.viewer.Settings.multiLine = true;
    this.viewer.Settings.lineheight = 70;
    this.viewer.Settings.margin.bottom = 5;
    this.viewer.Settings.margin.right = 0;
    this.viewer.Settings.justifySignalHeight = true;
    this.viewer.Settings.scrollable = true;
    this.viewer.Settings.margin.right = 20;
    this.viewer.Settings.roundValues = false;
    this.viewer.Settings.stepWidthRatio = (this.viewer.Settings.pixelPerSec / this.audiomanager.ressource.info.samplerate);
    this.viewer.Settings.showTimePerLine = true;
    this.viewer.Settings.showTranscripts = true;
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

            this.scrolltimer = Observable.interval(1000).subscribe(() => {
              const absx = this.viewer.av.audioTCalculator.samplestoAbsX(this.audioChunkLines.playposition.browserSample.value);
              let y = Math.floor(absx / this.viewer.innerWidth) * this.viewer.Settings.lineheight;
              y += 10 + (Math.floor(absx / this.viewer.innerWidth) * this.viewer.Settings.margin.bottom);

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
      const start: any = (selected.index > 0) ? this.transcrService.currentlevel.segments.get(selected.index - 1).time.clone()
        : this.audiomanager.createBrowserAudioTime(0);
      if (segment) {
        this.selectedIndex = selected.index;
        this.audioChunkWindow = new AudioChunk(new AudioSelection(start, segment.time.clone()), this.audiomanager);

        this.viewer.deactivateShortcuts = true;
        this.viewer.focused = false;
        this.showWindow = true;
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

      let y = Math.floor(absx / this.viewer.innerWidth) * this.viewer.Settings.lineheight;
      y += 10 + (Math.floor(absx / this.viewer.innerWidth) * this.viewer.Settings.margin.bottom);
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
      this.audioChunkLines.selection.start.browserSample.value = this.viewer.av.Mousecursor.timePos.browserSample.value;
      this.audioChunkLines.selection.end.browserSample.value = this.viewer.av.Mousecursor.timePos.browserSample.value +
        this.audiomanager.browserSampleRate / 10;
      this.audioChunkLines.startPlayback(() => {
      }, true);
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
    if (
      $event.value === null || !(
        // cursor move by keyboard events are note saved because this would be too much
        Functions.contains($event.value, 'cursor') ||
        Functions.contains($event.value, 'segment_enter') ||
        Functions.contains($event.value, 'playonhover')
      )
    ) {
      $event.value = `${$event.type}:${$event.value}`;

      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.selectedIndex > -1 && this.selectedIndex < this.transcrService.currentlevel.segments.length) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.originalSample.value;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.originalSample.value
          - annoSegment.time.originalSample.value
          : this.audiomanager.originalInfo.duration.originalSample.value - annoSegment.time.originalSample.value;

        segment.textlength = annoSegment.transcript.length;
      }

      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;

      this.uiService.addElementFromEvent('shortcut', $event, Date.now(),
        this.audiomanager.playposition, caretpos, 'multi-lines-viewer', segment);

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
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.selectedIndex > -1 && this.selectedIndex < this.transcrService.currentlevel.segments.length) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.originalSample.value;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.originalSample.value
          - annoSegment.time.originalSample.value
          : this.audiomanager.originalInfo.duration.originalSample.value - annoSegment.time.originalSample.value;

        segment.textlength = annoSegment.transcript.length;
      }

      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audiomanager.playposition, caretpos, 'audio_speed', segment);
    }
  }

  onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audioChunkLines.volume = event.new_value;
    this.appStorage.audioVolume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    if (this.appStorage.logging) {
      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.selectedIndex > -1 && this.selectedIndex < this.transcrService.currentlevel.segments.length) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.originalSample.value;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.originalSample.value
          - annoSegment.time.originalSample.value
          : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

        segment.textlength = annoSegment.transcript.length;
      }

      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;
      this.uiService.addElementFromEvent('slider', event, event.timestamp,
        this.audiomanager.playposition, caretpos, 'audio_volume', segment);
    }
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    if (this.appStorage.logging) {
      const caretpos = (!(this.editor === null || this.editor === undefined)) ? this.editor.caretpos : -1;

      const segment = {
        start: -1,
        length: -1,
        textlength: -1
      };

      if (this.selectedIndex > -1 && this.selectedIndex < this.transcrService.currentlevel.segments.length) {
        const annoSegment = this.transcrService.currentlevel.segments.get(this.selectedIndex);
        segment.start = annoSegment.time.originalSample.value;
        segment.length = (this.selectedIndex < this.transcrService.currentlevel.segments.length - 1)
          ? this.transcrService.currentlevel.segments.get(this.selectedIndex + 1).time.originalSample.value
          - annoSegment.time.originalSample.value
          : this.audiomanager.ressource.info.duration.originalSample.value - annoSegment.time.originalSample.value;

        segment.textlength = annoSegment.transcript.length;
      }

      this.uiService.addElementFromEvent('mouseclick', {value: 'click:' + event.type},
        event.timestamp,
        this.audiomanager.playposition, caretpos, 'audio_buttons', segment);
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
