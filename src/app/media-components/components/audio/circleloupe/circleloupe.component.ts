import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {LoupeComponent} from '../loupe';
import {CircleLoupeService} from './circleloupe.service';
import {AudioChunk} from '../../../obj/media/audio/AudioManager';
import {AudioviewerConfig} from '../audioviewer';

declare var window: any;

@Component({
  selector: 'app-circleloupe',
  templateUrl: './circleloupe.component.html',
  styleUrls: ['./circleloupe.component.css'],
  providers: [CircleLoupeService]
})

export class CircleLoupeComponent implements AfterViewInit, OnChanges, OnInit {
  @ViewChild('loupe', {static: true}) loupe: LoupeComponent;

  @Input() audiochunk: AudioChunk;
  @Input() height: number;
  @Input() width: number;
  public pos: any = {
    x: 0,
    y: 0
  };
  private initialized = false;

  public get zoomY(): number {
    return this.loupe.zoomY;
  }

  public set zoomY(value: number) {
    this.loupe.zoomY = value;
  }

  get Settings(): any {
    return this.settings;
  }

  set Settings(newSettings: any) {
    this.settings = newSettings;
  }

  private settings: AudioviewerConfig = new AudioviewerConfig();

  constructor() {
    this.height = 80;
    this.width = 80;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('height')) {
      if (!(this.loupe === null || this.loupe === undefined)) {
        this.settings.lineheight = changes.height.currentValue;
        if ((this.settings.lineheight === null || this.settings.lineheight === undefined)
          || this.settings.lineheight < 1) {
          this.settings.lineheight = 80;
        }
        if (this.initialized) {
          this.loupe.update();
        }
      }
    }
  }

  ngAfterViewInit() {

  }

  ngOnInit() {
    this.settings.multiLine = false;
    this.settings.justifySignalHeight = true;
    this.settings.disabledKeys = [];
    this.settings.type = 'line';
    this.settings.backgroundcolor = 'white';
    this.settings.frame.color = 'transparent';
    this.settings.cropping = 'circle';
    this.settings.margin.left = 0;
    this.settings.margin.top = 0;
    this.settings.margin.right = 0;
    this.settings.margin.bottom = 0;
    this.settings.lineheight = this.height;
    this.settings.selection.enabled = false;
    this.settings.shortcutsEnabled = false;
    this.settings.boundaries.enabled = true;
    this.settings.timeline.enabled = false;
    this.settings.roundValues = false;
    this.loupe.name = 'circleloupe';

    // this.loupe.update();

    this.initialized = true;
  }

  public updateSegments() {
    this.loupe.update();
  }
}
