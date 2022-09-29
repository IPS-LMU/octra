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
import {AudioplayerSettings} from './audioplayer-settings';
import {SubscriptionManager} from '@octra/utilities';
import {AudioChunk, PlayBackStatus, SampleUnit} from '@octra/media';
import {Subscription, timer} from 'rxjs';
import KonvaEventObject = Konva.KonvaEventObject;

@Component({
  selector: 'octra-audioplayer',
  templateUrl: './audioplayer.component.html',
  styleUrls: ['./audioplayer.component.css']
})
export class AudioplayerComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() audioChunk: AudioChunk | undefined;
  @ViewChild('konvaContainer', {static: true}) konvaContainer: ElementRef | undefined;

  private stage: Konva.Stage | undefined;
  private animation: {
    playHead: Konva.Animation | undefined
  } = {
    playHead: undefined
  };
  private subscrmanager = new SubscriptionManager();
  private bufferedSubscr = -1;
  private backgroundLayer: Konva.Layer | undefined;
  private canvasElements: {
    panel: Konva.Shape | undefined,
    sliderBar: Konva.Shape | undefined,
    playHead: Konva.Shape | undefined
  } = {
    panel: undefined,
    sliderBar: undefined,
    playHead: undefined
  };
  private audiochunkSubscription: Subscription | undefined;

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

  public get width(): number | undefined {
    return this.konvaContainer?.nativeElement.offsetWidth;
  }

  public get getPlayHeadX(): number {
    if (this.audioChunk !== undefined && this.canvasElements?.sliderBar !== undefined && this.audioChunk.relativePlayposition !== undefined) {
      const relativePlayPosition = this.audioChunk.relativePlayposition.samples / this.audioChunk.time.duration.samples;
      return this._settings.slider.margin.left +
        (relativePlayPosition * this.canvasElements.sliderBar?.width()) - this._settings.playHead.width / 2;
    }
    return this._settings.slider.margin.left - this._settings.playHead.width / 2;
  }

  public get timeLeft(): number {
    if (!(this.audioChunk === undefined) && this.audioChunk.relativePlayposition !== undefined) {
      return (this.audioChunk.time.duration.unix - this.audioChunk.relativePlayposition.unix);
    }
    return 0;
  }

  ngOnInit() {
    this.afterChunkUpdated();
    this.subscrmanager = new SubscriptionManager();
    // this.subscrmanager.add(this.keyMap.onkeydown.subscribe(this.onKeyDown), 'keypress');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['audioChunk'] && changes['audioChunk'].currentValue !== undefined) {
      this.afterChunkUpdated();
    }
  }

  afterChunkUpdated() {
    if (!(this.audioChunk === undefined)) {
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

    if (this.konvaContainer !== undefined && this.width !== undefined) {
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
        userName: 'panel',
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
        userName: 'sliderBar',
        width: this.canvasElements.panel.width() - settings.slider.margin.left - settings.slider.margin.right,
        height: settings.slider.height,
        fill: '#84d5d3'
      });

      this.canvasElements.sliderBar.on('click', this.onSliderClick);
      this.canvasElements.sliderBar.on('mousemove', this.onPanelMouseMove);

      this.canvasElements.playHead = new Konva.Rect({
        x: settings.slider.margin.left - (this._settings.playHead.width / 2),
        y: settings.slider.margin.top + this._settings.slider.height / 2 - this._settings.playHead.height / 2,
        userName: 'playHead',
        draggable: true,
        dragBoundFunc: this.onPlayHeadDragging,
        width: this._settings.playHead.width,
        height: this._settings.playHead.height,
        fill: this._settings.playHead.backgroundColor
      });
      this.canvasElements.playHead.on('mouseover', this.onPlayHeadMouseMove);
      this.canvasElements.playHead.on('mouseleave', this.onPlayHeadMouseMove);
      this.canvasElements.playHead.on('dragmove', (event: KonvaEventObject<MouseEvent>) => {
        this.onPlayHeadDragging({
          x: event.evt.x,
          y: event.evt.y
        });
      });

      // add the shape to the layer
      this.backgroundLayer.add(this.canvasElements.panel);
      this.backgroundLayer.add(this.canvasElements.sliderBar);
      this.backgroundLayer.add(this.canvasElements.playHead);

      window.onresize = () => {
        this.onResize();
      };
      this.onResize();
    }
  }

  onPlayHeadDragging = (pos: { x: number, y: number }) => {
    if (this.canvasElements.panel !== undefined && this.audioChunk !== undefined) {
      const maxWidth = this.canvasElements.panel.width() - this._settings.slider.margin.left - (this._settings.playHead.width / 2);
      let xCoord = Math.min(Math.max(this._settings.slider.margin.left, pos.x) - (this._settings.playHead.width / 2), maxWidth);

      const samples = this.pxToSample(xCoord - this._settings.slider.margin.left + (this._settings.playHead.width / 2));

      if (samples !== undefined && !isNaN(samples.samples)) {
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

    return {
      x: 0,
      y: 0
    };
  }

  onResize() {
    if (this.stage !== undefined && this.canvasElements?.panel !== undefined && this.canvasElements?.sliderBar !== undefined
      && this.canvasElements?.playHead !== undefined && this.width !== undefined) {
      this.stage.width(this.width);
      this.stage.height((this._settings.height + this._settings.border.width));

      this.canvasElements.panel.width(this.width - this._settings.border.width * 2);

      this.canvasElements.sliderBar.width(this.canvasElements.panel.width() - this._settings.slider.margin.left
        - this._settings.slider.margin.right);

      this.canvasElements.playHead.x(this.getPlayHeadX);

      this.stage.draw();
    }
  }

  public ngOnDestroy(): void {
    if (this.audiochunkSubscription !== undefined) {
      this.audiochunkSubscription.unsubscribe();
    }
    this.subscrmanager.destroy();
  }

  public pxToSample(px: number): SampleUnit | undefined {
    if (this.audioChunk !== undefined && this.canvasElements?.sliderBar !== undefined) {
      return new SampleUnit(px * this.audioChunk.time.duration.samples / this.canvasElements.sliderBar.width(),
        this.audioChunk.audioManager.sampleRate);
    }
    return undefined;
  }

  private onPlaybackStarted() {
    if (this.stage !== undefined && this.canvasElements?.playHead !== undefined) {
      const playHead = this.canvasElements.playHead;
      const layer = this.stage.getLayers()[0];

      if (this.animation.playHead === undefined) {
        this.animation.playHead = new Konva.Animation(this.doPlayHeadAnimation, layer);
      }
      this.animation.playHead.start();
      playHead.x(this.getPlayHeadX);
    }
  }

  private onPlaybackPaused() {
    if (this.stage !== undefined && this.animation?.playHead !== undefined) {
      const layer = this.stage.getLayers()[0];
      this.animation.playHead.stop();
      layer.draw();
    }
  }

  private onPlaybackEnded() {
    if (this.canvasElements?.playHead !== undefined && this.animation?.playHead !== undefined &&
      this.stage !== undefined) {
      const playHead = this.canvasElements.playHead;
      this.animation.playHead.stop();
      playHead.x(this.getPlayHeadX);
      this.stage.draw();
    }
  }

  private onPlaybackStopped() {
    if (this.animation.playHead !== undefined && this.stage !== undefined) {
      this.animation.playHead.stop();
      this.stage.draw();
    }
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
    if (this.canvasElements?.playHead !== undefined) {
      this.canvasElements.playHead.x(this.getPlayHeadX);
    }
  }

  private onSliderClick = (event: KonvaEventObject<MouseEvent>) => {
    this.onPanelClick(event);
  }

  private onPlayHeadMouseMove = (event: KonvaEventObject<MouseEvent>) => {
    if (this.konvaContainer !== undefined) {
      if (event.evt.type === 'mouseover') {
        this.konvaContainer.nativeElement.style.cursor = 'grab';
      } else {
        this.konvaContainer.nativeElement.style.cursor = 'pointer';
      }
    }
  }

  private onPanelMouseMove = (event: KonvaEventObject<MouseEvent>) => {
    if (event.evt.type === 'mouseover' && this.konvaContainer !== undefined) {
      this.konvaContainer.nativeElement.style.cursor = 'pointer';
    }
  }

  private onPanelClick = (event: KonvaEventObject<MouseEvent>) => {
    if (this.canvasElements?.panel !== undefined && this.audioChunk !== undefined && this.canvasElements.playHead !== undefined
      && this.stage !== undefined) {
      const maxWidth = this.canvasElements.panel.width() - this._settings.slider.margin.left;
      const xCoord = Math.min(Math.max(this._settings.slider.margin.left, event.evt.x), maxWidth)
        - (this._settings.playHead.width / 2);
      this.canvasElements.playHead.x(xCoord);
      // hide bufferedBar
      this.stage.draw();

      if (this.audioChunk.status === PlayBackStatus.PLAYING) {
        this.audioChunk.stopPlayback().then(() => {
          if (this.audioChunk !== undefined) {
            this.setPlayPosition(xCoord);
            this.subscrmanager.add(timer(200).subscribe(() => {
              if (this.audioChunk !== undefined) {
                this.audioChunk.startPlayback().catch((error) => {
                  console.error(error);
                });
              }
            }));
          }
        }).catch((error) => {
          console.error(error);
        });
      } else {
        this.setPlayPosition(xCoord);
      }
    }
  }

  public update() {
    if (this.canvasElements.playHead !== undefined && this.stage !== undefined) {
      this.canvasElements.playHead.x(this.getPlayHeadX);
      this.stage.draw();
    }
  }

  private setPlayPosition = (xCoord: number) => {
    if (this.audioChunk !== undefined) {
      this.audioChunk.relativePlayposition = this.pxToSample(xCoord - this._settings.slider.margin.left + this._settings.playHead.width / 2);
      this.audioChunk.startpos = this.audioChunk.absolutePlayposition;
    }
  }
}
