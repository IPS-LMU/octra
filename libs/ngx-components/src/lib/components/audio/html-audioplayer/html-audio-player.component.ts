import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { OctraHTMLAudioPlayerStatus } from './types';

@Component({
  selector: 'octra-html-audio-player',
  templateUrl: './html-audio-player.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./html-audio-player.component.css'],
  imports: [NgClass],
})
export class HtmlAudioPlayerComponent implements AfterViewInit, OnChanges, OnDestroy, OnInit {
  private cd = inject(ChangeDetectorRef);
  private renderer = inject(Renderer2);

  @Input() url?: string;
  @Input() type?: string;
  @Input() preload?: 'metadata' | 'auto' | 'none' = "metadata"

  protected state: {
    status: OctraHTMLAudioPlayerStatus;
    speed: string;
  } = {
    status: 'initialized',
    speed: '1.0',
  };

  get audioElement(): HTMLAudioElement | undefined {
    return this._audioElement?.nativeElement as HTMLAudioElement;
  }

  get buffered(): HTMLDivElement | undefined {
    return this._buffered?.nativeElement as HTMLDivElement;
  }

  get progress(): HTMLDivElement | undefined {
    return this._progress?.nativeElement as HTMLDivElement;
  }

  get currentTimeElement(): HTMLSpanElement | undefined {
    return this._currentTimeEl?.nativeElement as HTMLSpanElement;
  }

  get currentDurationElement(): HTMLSpanElement | undefined {
    return this._currentDurEl?.nativeElement as HTMLSpanElement;
  }

  get progressContainerElement(): HTMLDivElement | undefined {
    return this._progressContainerEl?.nativeElement as HTMLDivElement;
  }

  @ViewChild('audioElement') _audioElement?: ElementRef;
  @ViewChild('progress') _progress?: ElementRef;
  @ViewChild('buffered') _buffered?: ElementRef;
  @ViewChild('currentTimeEl') _currentTimeEl?: ElementRef;
  @ViewChild('currentDurEl') _currentDurEl?: ElementRef;
  @ViewChild('progressContainer') _progressContainerEl?: ElementRef;

  ngOnInit() {}

  ngAfterViewInit() {}

  ngOnChanges(changes: SimpleChanges) {}

  ngOnDestroy() {}

  protected togglePlay() {
    if (this.state.status === 'playing') {
      this.pause();
    } else {
      this.play();
    }
  }

  protected updateProgress() {
    if (this._progress && this._buffered && this._currentDurEl && this._currentTimeEl) {
      const { duration, currentTime } = this.audioElement;
      const percent = (currentTime / duration) * 100;
      this.renderer.setStyle(this.progress, 'width', `${percent}%`);
      this.renderer.setProperty(this.currentTimeElement, 'textContent', this.formatTime(currentTime));
      this.renderer.setProperty(this.currentDurationElement, 'textContent', this.formatTime(duration - currentTime));
      this.cd.markForCheck();
    }
  }

  protected updateBuffered() {
    if (this.audioElement && this.audioElement.buffered.length > 0) {
      const bufferedEnd = this.audioElement.buffered.end(this.audioElement.buffered.length - 1);
      const duration = this.audioElement.duration;
      const percent = (bufferedEnd / duration) * 100;
      this.renderer.setStyle(this.buffered, 'width', `${percent}%`);
      this.cd.markForCheck();
    }
  }

  private formatTime(time: number) {
    if (isNaN(time)) return '00:00:00.000';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor(time / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  async play() {
    try {
      this.audioElement?.play();
      this.state.status = 'playing';
    } catch (error) {
      console.error(error);
      this.state.status = 'failed';
    }
    this.cd.markForCheck();
  }

  async pause() {
    this.audioElement?.pause();
    this.state.status = 'paused';
    this.cd.markForCheck();
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.state.status = 'stopped';
    }
  }

  updateGUI() {
    this.updateProgress();
  }

  progressBarClick($event: MouseEvent) {
    if (this.progressContainerElement && this.audioElement) {
      const width = this.progressContainerElement.clientWidth;
      const clickX = $event.offsetX;
      const duration = this.audioElement.duration;
      this.audioElement.currentTime = (clickX / width) * duration;
    }
  }

  volumeChange($event: Event) {
    if (this.audioElement) {
      this.audioElement.volume = ($event.target as HTMLInputElement).valueAsNumber;
      this.cd.markForCheck();
    }
  }

  speedChange($event: Event) {
    if (this.audioElement) {
      this.audioElement.playbackRate = ($event.target as HTMLInputElement).valueAsNumber;
      console.log(this.audioElement.playbackRate);
      this.state.speed = (this.audioElement.playbackRate * 100).toString();
      this.state.speed = this.state.speed.length < 3 ? `0.${this.state.speed}` : `${this.state.speed[0]}.${this.state.speed.slice(1)}`;
    }
    this.cd.markForCheck();
  }
}
