import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output,
  ViewChild
} from '@angular/core';
import {AudioviewerComponent, AudioviewerService} from '../audioviewer';
import {AudioTime, AVMousePos} from '../../shared';
import {SubscriptionManager} from '../../shared/SubscriptionManager';
declare var window: any;

@Component({
  selector: 'app-loupe',
  templateUrl: './loupe.component.html',
  styleUrls: ['./loupe.component.css'],
  providers: [AudioviewerService]
})

export class LoupeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewer') viewer: AudioviewerComponent;
  @ViewChild('loupe') loupe: ElementRef;

  @Output('mousecursorchange') mousecursorchange: EventEmitter<AVMousePos> = new EventEmitter<AVMousePos>();
  @Output('shortcuttriggered') shortcuttriggered: EventEmitter<string> = new EventEmitter<string>();
  @Output('segmententer') segmententer: EventEmitter<any> = new EventEmitter<any>();

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

  @Input() public set margin(value: any) {
    this.viewer.margin = value;
  }

  public pos: any = {
    x: 0,
    y: 0
  };

  public getLocation(): any {
    const rect = this.loupe.nativeElement.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top
    };
  }

  get Settings(): any {
    return this.viewer.Settings;
  }

  set Settings(new_settings: any) {
    this.viewer.Settings = new_settings;
  }

  constructor() {
    this.subscrmanager = new SubscriptionManager();
  }

  ngOnInit() {
    this.viewer.Settings.multi_line = false;
    this.viewer.Settings.height = 150;
    this.viewer.Settings.justify_signal_height = true;
    this.viewer.Settings.boundaries.enabled = true;
    this.viewer.Settings.disabled_keys = [];
    this.viewer.Settings.type = 'line';
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

  public changeArea(start: AudioTime, end: AudioTime) {
    this.viewer.changeBuffer(start, end);
  }

  public updateSegments() {
    this.viewer.drawSegments();
  }

  public changeBuffer(start: AudioTime, end: AudioTime) {
    this.viewer.changeBuffer(start, end);
  }

  public update() {
    this.viewer.update();
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
      case('default'):
        break;
    }
  }

  public selectSegment(segnumber: number) {
    this.viewer.selectSegment(segnumber);
  }
}
