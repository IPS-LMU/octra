import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';

import {AudioNavigationComponent, LoupeComponent, TranscrEditorComponent} from '../../component';
import {AudioService, KeymappingService, TranscriptionService, UserInteractionsService} from '../../service';
import {AudioTime, Functions, Segment, SubscriptionManager} from '../../shared';
import {SettingsService} from '../../service/settings.service';

@Component({
  selector: 'app-transcr-window',
  templateUrl: './transcr-window.component.html',
  styleUrls: ['./transcr-window.component.css']
})
export class TranscrWindowComponent implements OnInit, AfterContentInit, AfterViewInit, OnDestroy {
  @ViewChild('loupe') loupe: LoupeComponent;
  @ViewChild('editor') editor: TranscrEditorComponent;
  @ViewChild('audionav') audionav: AudioNavigationComponent;
  @ViewChild('window') window: ElementRef;

  @Output('act') act: EventEmitter<string> = new EventEmitter<string>();
  @Input('easymode') easymode = false;

  @Output('shortcuttriggered') get shortcuttriggered(): EventEmitter<string> {
    return this.loupe.shortcuttriggered;
  }

  @Output('marker_insert') get marker_insert(): EventEmitter<string> {
    return this.editor.marker_insert;
  }

  @Output('marker_click') get marker_click(): EventEmitter<string> {
    return this.editor.marker_click;
  }

  private showWindow = false;
  public pos_y = 0;
  private subscrmanager: SubscriptionManager;

  get app_settings(): any {
    return this.settingsService.app_settings;
  }

  get projectsettings(): any {
    return this.settingsService.projectsettings;
  }

  get responsive(): boolean {
    return this.settingsService.responsive.enabled;
  }

  get SelectedSegment(): Segment {
    if (this.transcrService.selectedSegment.index > -1) {
      return this.transcrService.annotation.levels[0].segments.get(this.transcrService.selectedSegment.index);
    }

    return null;
  }

  set SelectedSegment(segment: Segment) {
    this.transcrService.annotation.levels[0].segments.get(this.transcrService.selectedSegment.index).transcript;
  }

  constructor(public keyMap: KeymappingService,
              public transcrService: TranscriptionService,
              public audio: AudioService,
              public uiService: UserInteractionsService,
              public settingsService: SettingsService) {

    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.editor.Settings.markers = this.transcrService.guidelines.markers;
    this.editor.Settings.responsive = this.settingsService.responsive.enabled;

    this.subscrmanager.add(this.editor.loaded.subscribe(
      () => {
        const index = this.transcrService.selectedSegment.index;
        if (index > -1 && this.transcrService.annotation.levels[0].segments &&
          index < this.transcrService.annotation.levels[0].segments.length) {
          this.editor_rawText(this.transcrService.annotation.levels[0].segments.get(this.transcrService.selectedSegment.index).transcript);
        }
      }
    ));

    this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown));
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  ngAfterViewInit() {
    this.pos_y = this.transcrService.selectedSegment.pos.Y2;
    const segment: Segment = this.transcrService.annotation.levels[0].segments.get(this.transcrService.selectedSegment.index);

    let begin = new AudioTime(0, this.audio.samplerate);

    if (this.transcrService.selectedSegment.index > 0) {
      begin = this.transcrService.annotation.levels[0].segments.get(this.transcrService.selectedSegment.index - 1).time.clone();
    }

    this.loupe.Settings.boundaries.readonly = true;
    this.changeArea(begin, segment.time);
    setTimeout(() => {
      this.loupe.viewer.startPlayback();
    }, 500);
  }

  ngAfterContentInit() {
    this.act.emit('open');
  }

  public close() {
    this.showWindow = false;
    this.act.emit('close');
  }

  public open() {
    this.showWindow = true;
  }

  save() {
    const index = this.transcrService.selectedSegment.index;
    if (index > -1 && this.transcrService.annotation.levels[0].segments &&
      index < this.transcrService.annotation.levels[0].segments.length) {
      const segment = this.transcrService.annotation.levels[0].segments.get(index);
      segment.transcript = this.editor.rawText;
      this.transcrService.annotation.levels[0].segments.change(index, segment);
    }
  }

  public changeArea(absStart: AudioTime, absEnd: AudioTime) {
    this.loupe.changeArea(absStart, absEnd);
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('mouse_click', {}, event.timestamp, event.type + '_button');
    }

    if (event.type === 'replay') {
      this.audionav.replay = !this.audionav.replay;
    }

    this.loupe.onButtonClick(event);
  }

  /**
   * selects the next segment on the left or on the right side
   * @param direction
   */
  goToSegment(direction: string) {
    const index = this.transcrService.selectedSegment.index;
    if (index > -1 && this.transcrService.annotation.levels[0].segments &&
      index < this.transcrService.annotation.levels[0].segments.length) {
      let segment: Segment = this.transcrService.annotation.levels[0].segments.get(index);

      if (direction === 'right' &&
        this.transcrService.selectedSegment.index < this.transcrService.annotation.levels[0].segments.length - 1) {
        segment = this.transcrService.annotation.levels[0].segments.get(++this.transcrService.selectedSegment.index);
      } else if (direction === 'left' && this.transcrService.selectedSegment.index > 0) {
        segment = this.transcrService.annotation.levels[0].segments.get(--this.transcrService.selectedSegment.index);
      }

      let begin = new AudioTime(0, this.audio.samplerate);

      if (this.transcrService.selectedSegment.index > 0) {
        begin = this.transcrService.annotation.levels[0].segments.get(this.transcrService.selectedSegment.index - 1).time.clone();
      }

      this.editor.rawText = this.transcrService.annotation.levels[0].segments.get(this.transcrService.selectedSegment.index).transcript;
      this.changeArea(begin, segment.time);
    }
  }

  public editor_rawText(text: string) {
    this.editor.rawText = text;
  }

  onShortCutTriggered($event, type) {
    this.uiService.addElementFromEvent('shortcut', $event, Date.now(), type);
  }

  onMarkerInsert(marker_code: string) {
    this.uiService.addElementFromEvent('marker_insert', {value: marker_code}, Date.now(), 'editor');
  }

  onMarkerClick(marker_code: string) {
    this.uiService.addElementFromEvent('marker_click', {value: marker_code}, Date.now(), 'editor');
  }

  onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audio.speed = event.new_value;
  }

  afterSpeedChange(event: { new_value: number, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('slider', event, event.timestamp, 'speed_change');
    }
  }

  onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
    this.audio.volume = event.new_value;
  }

  afterVolumeChange(event: { new_value: number, timestamp: number }) {
    if (this.projectsettings.logging.forced === true) {
      this.uiService.addElementFromEvent('slider', event, event.timestamp, 'volume_change');
    }
  }

  onKeyDown = ($event) => {
    // TODO search better solution!
    const doit = (direction: string) => {
      if (this.audio.audioplaying) {
        this.loupe.viewer.stopPlayback();
      }
      this.save();
      if (direction !== 'down') {
        this.goToSegment(direction);
        setTimeout(() => {
          this.loupe.viewer.startPlayback();
        }, 500);
      } else {
        this.save();
        this.close();
      }
    };

    switch ($event.comboKey) {
      case ('SHIFT + ARROWRIGHT'):
        doit('right');
        break;
      case ('SHIFT + ARROWLEFT'):
        doit('left');
        break;
      case ('SHIFT + ARROWDOWN'):
        doit('down');
        break;
      case ('ESC'):
        doit('down');
        break;
    }
  }
}
