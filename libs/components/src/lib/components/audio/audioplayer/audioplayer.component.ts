import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import Konva from 'konva';
import {Subscription, timer} from 'rxjs';
import {AudioplayerSettings} from './audioplayer-settings';
import {isUnset, SubscriptionManager} from '@octra/utilities';
import {AudioChunk, PlayBackStatus, SampleUnit} from '@octra/media';

@Component({
  selector: 'octra-audioplayer',
  templateUrl: './audioplayer.component.html',
  styleUrls: ['./audioplayer.component.css']
})
export class AudioplayerComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() audioChunk: AudioChunk;
  @ViewChild('konvaContainer', {static: true}) konvaContainer: ElementRef;

  private stage: Konva.Stage;
  private animation: {
    playHead: Konva.Animation
  } = {
    playHead: null
  };
  private subscrmanager = new SubscriptionManager();
  private bufferedSubscr = -1;
  private backgroundLayer: Konva.Layer;
  private canvasElements = {
    panel: null,
    sliderBar: null,
    playHead: null
  };
  private audiochunkSubscription: Subscription;

  private _settings: AudioplayerSettings = {
    slider: {
      margin: {
        left: 20,
        top: 20,
        right: 20,
        bottom: 0
      },
      height: 5
    },
    bufferedBar: {
      height: 2
    },
    playHead: {
      height: 20,
      backgroundColor: '#56a09e',
      width: 10
    },
    height: 60,
    border: {
      width: 1,
      color: '#b5b5b5'
    },
    background: {
      color: '#e2e6ff'
    }
  };

  get settings(): AudioplayerSettings {
    return this._settings;
  }

  set settings(value: AudioplayerSettings) {
    this._settings = value;
  }

  public get width(): number {
    return this.konvaContainer.nativeElement.offsetWidth;
  }

  public get getPlayHeadX(): number {
    if (!(this.audioChunk === null || this.audioChunk === undefined)) {
      const relativePlayPosition = this.audioChunk.relativePlayposition.samples / this.audioChunk.time.duration.samples;
      return this._settings.slider.margin.left +
        (relativePlayPosition * this.canvasElements.sliderBar.width()) - this._settings.playHead.width / 2;
    }
    return this._settings.slider.margin.left - this._settings.playHead.width / 2;
  }

  public get timeLeft(): number {
    if (!(this.audioChunk === null || this.audioChunk === undefined)) {
      return (this.audioChunk.time.duration.unix - this.audioChunk.relativePlayposition.unix);
    }
    return 0;
  }

  constructor() {
  }

  ngOnInit() {
    this.afterChunkUpdated();
    this.subscrmanager = new SubscriptionManager();
    // this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown), 'keypress');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['audioChunk'] && changes.audioChunk.currentValue !== null) {
      this.afterChunkUpdated();
    }
  }

  afterChunkUpdated() {
    if (!(this.audioChunk === null || this.audioChunk === undefined)) {
      if (this.bufferedSubscr > -1) {
        this.subscrmanager.removeById(this.bufferedSubscr);
      }

      if (this.audiochunkSubscription !== undefined) {
        this.audiochunkSubscription.unsubscribe();
      }

      this.audiochunkSubscription = this.audioChunk.statuschange.subscribe(
        this.onAudioChunkStatusChanged
        , (error) => {
          console.error(error);
        });
    }
  }

  ngAfterViewInit(): void {
    const settings = this._settings;

    this.stage = new Konva.Stage({
      container: this.konvaContainer.nativeElement,   // id of container <div>,
      width: this.width,
      height: this._settings.height
    });

    // then create layer
    this.backgroundLayer = new Konva.Layer();

    // add the layer to the stage
    this.stage.add(this.backgroundLayer);

    // create our shape
    // noinspection JSSuspiciousNameCombination
    this.canvasElements.panel = new Konva.Rect({
      x: this._settings.border.width,
      y: this._settings.border.width,
      width: this.width - this._settings.border.width * 2,
      id: 'panel',
      height: this._settings.height - this._settings.border.width * 2,
      fill: this._settings.background.color,
      stroke: this._settings.border.color,
      strokeWidth: this._settings.border.width,
      cornerRadius: 5
    });
    this.canvasElements.panel.on('click', this.onPanelClick);
    this.canvasElements.panel.on('mouseover', this.onPanelMouseMove);
    this.canvasElements.panel.on('mouseleave', this.onPanelMouseMove);

    this.canvasElements.sliderBar = new Konva.Rect({
      x: settings.slider.margin.left,
      y: settings.slider.margin.top,
      id: 'sliderBar',
      width: this.canvasElements.panel.width() - settings.slider.margin.left - settings.slider.margin.right,
      height: settings.slider.height,
      fill: '#84d5d3'
    });

    this.canvasElements.sliderBar.on('click', this.onSliderClick);
    this.canvasElements.sliderBar.on('mousemove', this.onPanelMouseMove);

    this.canvasElements.playHead = new Konva.Rect({
      x: settings.slider.margin.left - (this._settings.playHead.width / 2),
      y: settings.slider.margin.top + this._settings.slider.height / 2 - this._settings.playHead.height / 2,
      id: 'playHead',
      draggable: true,
      dragBoundFunc: this.onPlayHeadDragging,
      width: this._settings.playHead.width,
      height: this._settings.playHead.height,
      fill: this._settings.playHead.backgroundColor
    });
    this.canvasElements.playHead.on('mouseover', this.onPlayHeadMouseMove);
    this.canvasElements.playHead.on('mouseleave', this.onPlayHeadMouseMove);
    this.canvasElements.playHead.on('dragmove', this.onPlayHeadDragging);

    // add the shape to the layer
    this.backgroundLayer.add(this.canvasElements.panel);
    this.backgroundLayer.add(this.canvasElements.sliderBar);
    this.backgroundLayer.add(this.canvasElements.playHead);

    window.onresize = () => {
      this.onResize();
    };
    this.onResize();
  }

  onPlayHeadDragging = (pos) => {
    const maxWidth = this.canvasElements.panel.width() - this._settings.slider.margin.left - (this._settings.playHead.width / 2);
    let xCoord = Math.min(Math.max(this._settings.slider.margin.left, pos.x) - (this._settings.playHead.width / 2), maxWidth);

    const samples = this.pxToSample(xCoord - this._settings.slider.margin.left + (this._settings.playHead.width / 2));

    if (!isNaN(samples.samples)) {
      if (this.audioChunk.status === PlayBackStatus.PLAYING) {
        this.audioChunk.stopPlayback().then(() => {
          this.setPlayPosition(xCoord);
        });
      } else {
        this.setPlayPosition(xCoord);
      }
    } else {
      xCoord = pos.x;
    }

    return {
      x: xCoord,
      y: this._settings.slider.margin.top + this._settings.slider.height / 2 - this._settings.playHead.height / 2
    };
  }

  onResize() {
    this.stage.width(this.width);
    this.stage.height((this._settings.height + this._settings.border.width));

    this.canvasElements.panel.width(this.width - this._settings.border.width * 2);

    this.canvasElements.sliderBar.width(this.canvasElements.panel.width() - this._settings.slider.margin.left
      - this._settings.slider.margin.right);

    this.canvasElements.playHead.x(this.getPlayHeadX);

    this.stage.draw();
  }

  public ngOnDestroy(): void {
    if (this.audiochunkSubscription !== undefined) {
      this.audiochunkSubscription.unsubscribe();
    }
    this.subscrmanager.destroy();
  }

  public pxToSample(px: number): SampleUnit {
    return new SampleUnit(px * this.audioChunk.time.duration.samples / this.canvasElements.sliderBar.width(),
      this.audioChunk.audioManager.sampleRate);
  }

  private onPlaybackStarted() {
    const playHead = this.canvasElements.playHead;
    const layer = this.stage.getLayers()[0];

    if (this.animation.playHead === undefined) {
      this.animation.playHead = new Konva.Animation(this.doPlayHeadAnimation, layer);
    }
    this.animation.playHead.start();
    playHead.x(this.getPlayHeadX);
  }

  private onPlaybackPaused() {
    const layer = this.stage.getLayers()[0];
    this.animation.playHead.stop();
    layer.draw();
  }

  private onPlaybackEnded() {
    const playHead = this.canvasElements.playHead;
    this.animation.playHead.stop();
    playHead.x(this.getPlayHeadX);
    this.stage.draw();
  }

  private onPlaybackStopped() {
    this.animation.playHead.stop();
    this.stage.draw();
  }

  private onAudioChunkStatusChanged = (status: PlayBackStatus) => {
    switch (status) {
      case PlayBackStatus.INITIALIZED:
        break;
      case PlayBackStatus.PREPARE:
        break;
      case PlayBackStatus.STARTED:
        this.onPlaybackStarted();
        break;
      case PlayBackStatus.PLAYING:
        break;
      case PlayBackStatus.PAUSED:
        this.onPlaybackPaused();
        break;
      case PlayBackStatus.STOPPED:
        this.onPlaybackStopped();
        break;
      case PlayBackStatus.ENDED:
        this.onPlaybackEnded();
        break;
    }
  }

  private doPlayHeadAnimation = () => {
    this.canvasElements.playHead.x(this.getPlayHeadX);
  }

  private onSliderClick = (event) => {
    this.onPanelClick(event);
  }

  private onPlayHeadMouseMove = (event) => {
    if (event.type === 'mouseover') {
      this.konvaContainer.nativeElement.style.cursor = 'grab';
    } else {
      this.konvaContainer.nativeElement.style.cursor = 'pointer';
    }
  }

  private onPanelMouseMove = (event) => {
    if (event.type === 'mouseover') {
      this.konvaContainer.nativeElement.style.cursor = 'pointer';
    }
  }

  private onPanelClick = (event) => {
    const maxWidth = this.canvasElements.panel.width() - this._settings.slider.margin.left;
    const xCoord = Math.min(Math.max(this._settings.slider.margin.left, event.evt.x), maxWidth)
      - (this._settings.playHead.width / 2);
    this.canvasElements.playHead.x(xCoord);
    // hide bufferedBar
    this.stage.draw();

    if (this.audioChunk.status === PlayBackStatus.PLAYING) {
      this.audioChunk.stopPlayback().then(() => {
        this.setPlayPosition(xCoord);
        this.subscrmanager.add(timer(200).subscribe(() => {
          this.audioChunk.startPlayback().catch((error) => {
            console.error(error);
          });
        }));
      }).catch((error) => {
        console.error(error);
      });
    } else {
      this.setPlayPosition(xCoord);
    }
  }

  public update() {
    this.canvasElements.playHead.x(this.getPlayHeadX);
    this.stage.draw();
  }

  private setPlayPosition = (xCoord: number) => {
    this.audioChunk.relativePlayposition = this.pxToSample(xCoord - this._settings.slider.margin.left + this._settings.playHead.width / 2);
    this.audioChunk.startpos = this.audioChunk.absolutePlayposition;
  }
}
