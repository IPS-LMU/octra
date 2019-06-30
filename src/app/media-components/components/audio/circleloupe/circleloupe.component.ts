import {AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {LoupeComponent} from '../loupe';
import {CircleLoupeService} from './circleloupe.service';
import {AudioChunk} from '../../../obj/media/audio/AudioManager';

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
    return this.loupe.Settings;
  }

  set Settings(newSettings: any) {
    this.loupe.Settings = newSettings;
  }

  constructor() {
    this.height = 80;
    this.width = 80;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('height')) {
      if (!(this.loupe === null || this.loupe === undefined)) {
        this.loupe.Settings.lineheight = changes.height.currentValue;
        if ((this.loupe.Settings.lineheight === null || this.loupe.Settings.lineheight === undefined)
          || this.loupe.Settings.lineheight < 1) {
          this.loupe.Settings.lineheight = 80;
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
    this.loupe.Settings.multiLine = false;
    this.loupe.Settings.justifySignalHeight = false;
    this.loupe.Settings.boundaries.enabled = true;
    this.loupe.Settings.disabledKeys = [];
    this.loupe.Settings.type = 'line';
    this.loupe.Settings.backgroundcolor = 'white';
    this.loupe.Settings.frame.color = 'transparent';
    this.loupe.Settings.cropping = 'circle';
    this.loupe.Settings.margin.left = 0;
    this.loupe.Settings.margin.top = 0;
    this.loupe.Settings.margin.right = 0;
    this.loupe.Settings.margin.bottom = 0;
    this.loupe.Settings.lineheight = this.height;
    this.loupe.Settings.selection.enabled = false;
    this.loupe.Settings.shortcutsEnabled = false;
    this.loupe.Settings.boundaries.enabled = true;
    this.loupe.Settings.timeline.enabled = false;
    this.loupe.viewer.roundValues = false;
    this.loupe.name = 'circleloupe';

    // this.loupe.update();

    this.initialized = true;
  }

  public updateSegments() {
    this.loupe.update();
  }
}
