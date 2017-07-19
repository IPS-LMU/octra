import {AfterViewInit, Component, Input, OnChanges, ViewChild} from '@angular/core';
import {LoupeComponent} from '../loupe/loupe.component';
import {CircleLoupeService} from './service/circleloupe.service';
import {AudioChunk} from '../../obj/media/audio/AudioChunk';
declare var window: any;

@Component({
  selector: 'app-circleloupe',
  templateUrl: './circleloupe.component.html',
  styleUrls: ['./circleloupe.component.css'],
  providers: [CircleLoupeService]
})

export class CircleLoupeComponent implements AfterViewInit, OnChanges {
  @ViewChild('loupe') loupe: LoupeComponent;

  @Input() audiochunk: AudioChunk;

  public get zoomY(): number {
    return this.loupe.zoomY;
  }

  public set zoomY(value: number) {
    this.loupe.zoomY = value;
  }

  public pos: any = {
    x: 0,
    y: 0
  };

  get Settings(): any {
    return this.loupe.Settings;
  }

  set Settings(new_settings: any) {
    this.loupe.Settings = new_settings;
  }

  constructor() {
  }

  ngOnChanges(obj) {
    if (obj.hasOwnProperty('audiochunk')) {
          }
  }

  ngAfterViewInit() {
    this.loupe.Settings.multi_line = false;
    this.loupe.Settings.height = 80;
    this.loupe.Settings.justify_signal_height = false;
    this.loupe.Settings.boundaries.enabled = true;
    this.loupe.Settings.disabled_keys = [];
    this.loupe.Settings.type = 'line';
    this.loupe.Settings.width = 80;
    this.loupe.Settings.backgroundcolor = 'white';
    this.loupe.Settings.frame.color = 'transparent';
    this.loupe.Settings.cropping = 'circle';
    this.loupe.Settings.margin.left = 0;
    this.loupe.Settings.margin.top = 0;
    this.loupe.Settings.margin.right = 0;
    this.loupe.Settings.margin.bottom = 0;
    this.loupe.Settings.selection.enabled = false;
    this.loupe.Settings.shortcuts_enabled = false;
    this.loupe.Settings.boundaries.enabled = true;
    this.loupe.Settings.timeline.enabled = false;
    this.loupe.update();
  }

  public updateSegments() {
    this.loupe.update();
  }
}
