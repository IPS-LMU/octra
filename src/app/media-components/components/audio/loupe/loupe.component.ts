import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {AudioviewerComponent, AudioviewerConfig, AudioviewerService} from '../audioviewer';
import {AudioChunk} from '../../../obj/media/audio';
import {AVMousePos} from '../../../obj/AVMousePos';
import {SubscriptionManager} from '../../../../core/obj/SubscriptionManager';

declare var window: any;

@Component({
  selector: 'app-loupe',
  templateUrl: './loupe.component.html',
  styleUrls: ['./loupe.component.css'],
  providers: [AudioviewerService]
})
export class LoupeComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('viewer') viewer: AudioviewerComponent;
  @ViewChild('loupe') loupe: ElementRef;

  @Output('mousecursorchange') mousecursorchange: EventEmitter<AVMousePos> = new EventEmitter<AVMousePos>();
  @Output('shortcuttriggered') shortcuttriggered: EventEmitter<string> = new EventEmitter<string>();
  @Output('segmententer') segmententer: EventEmitter<any> = new EventEmitter<any>();
  @Output('alerttriggered') alerttriggered: EventEmitter<{ type: string, message: string }>
    = new EventEmitter<{ type: string, message: string }>();

  @Input('audiochunk') audiochunk: AudioChunk;
  @Input('height') height: number;
  public name: string;
  public pos: any = {
    x: 0,
    y: 0
  };
  private subscrmanager;

  public get zoomY(): number {
    return this.viewer.av.zoomY;
  }

  public set zoomY(value: number) {
    this.viewer.av.zoomY = value;
  }

  public get focused(): boolean {
    return this.viewer.focused;
  }

  public get MouseCursor(): AVMousePos {
    return this.viewer.MouseCursor;
  }

  public get margin(): any {
    return this.viewer.margin;
  }

  @Input()
  public set margin(value: any) {
    this.viewer.margin = value;
  }

  get Settings(): AudioviewerConfig {
    return this.viewer.Settings;
  }

  @Input()
  set Settings(new_settings: AudioviewerConfig) {
    this.viewer.Settings = new_settings;
  }

  constructor() {
    this.subscrmanager = new SubscriptionManager();
  }

  public getLocation(): any {
    const rect = this.loupe.nativeElement.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top
    };
  }

  ngOnChanges(obj: SimpleChanges) {
  }

  ngOnInit() {
    if (!(this.height === null || this.height === undefined)) {
      this.viewer.Settings.multi_line = false;
      this.viewer.Settings.lineheight = this.height;
      this.viewer.Settings.justify_signal_height = true;
      this.viewer.Settings.boundaries.enabled = true;
      this.viewer.Settings.disabled_keys = [];
      this.viewer.Settings.type = 'line';
    } else {
      throw new Error('you have to set [height] to the loupe component');
    }
  }

  ngAfterViewInit() {
    this.subscrmanager.add(this.viewer.mousecursorchange.subscribe(
      (mousepos) => {
        this.mousecursorchange.emit(mousepos);
      }
    ));
    this.subscrmanager.add(this.viewer.shortcuttriggered.subscribe(
      (str) => {
        this.shortcuttriggered.emit(str);
      }
    ));
    this.subscrmanager.add(this.viewer.segmententer.subscribe(
      (obj) => {
        this.segmententer.emit(obj);
      }
    ));
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  public updateSegments() {
    this.viewer.drawSegments();
  }

  public update(compute = true) {
    this.viewer.name = this.name;
    // this.viewer.initialize();
    this.viewer.update(compute);
  }

  onButtonClick(event: { type: string, timestamp: number }) {
    switch (event.type) {
      case('play'):
        this.viewer.startPlayback();
        break;
      case('pause'):
        this.viewer.pausePlayback();
        break;
      case('stop'):
        this.viewer.stopPlayback();
        break;
      case('replay'):
        this.viewer.rePlayback();
        break;
      case('backward'):
        this.viewer.stepBackward();
        break;
      case('backward time'):
        this.viewer.stepBackwardTime(0.5);
        break;
      case('default'):
        break;
    }
  }

  public selectSegment(segnumber: number) {
    this.viewer.selectSegment(segnumber);
  }
}
