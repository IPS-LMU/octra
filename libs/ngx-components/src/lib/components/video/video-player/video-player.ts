import { NgOptimizedImage } from '@angular/common';
import { Component, inject, Input, OnChanges, SimpleChange, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface LocalizedVideo {
  language: string;
  url: string;
  thumbnail?: string;
  safeVideoURL?: SafeUrl;
  safeThumbnailURL?: SafeUrl;
  provider: 'youtube';
}

@Component({
  selector: 'octra-video-player',
  imports: [NgOptimizedImage],
  templateUrl: './video-player.html',
  styleUrl: './video-player.scss',
})
export class VideoPlayer implements OnChanges {
  @Input() videos: LocalizedVideo[];
  @Input() activeLanguage = 'other';

  protected showVideo = false;
  protected sanitizer = inject(DomSanitizer);

  protected safeVideoURL?: SafeUrl;
  protected safeThumbnailURL?: SafeUrl;
  protected provider: 'youtube' = 'youtube';

  ngOnChanges(changes: SimpleChanges) {
    const videos: SimpleChange<LocalizedVideo[]> = changes['videos'];
    if (videos?.currentValue) {
      this.videos = videos.currentValue.map((video: LocalizedVideo) => ({
        ...video,
        // iframe is only rendered after click on thumbnail, so start playing immediately
        safeVideoURL: this.sanitizer.bypassSecurityTrustResourceUrl(this.withAutoplay(video.url)),
        safeThumbnailURL: video.thumbnail ? this.sanitizer.bypassSecurityTrustResourceUrl(video.thumbnail) : undefined,
      }));
    }

    if (this.activeLanguage) {
      let video = this.videos.find((a) => a.language === this.activeLanguage);
      if (!video) {
        // fallback to other
        video = this.videos.find((a) => a.language === 'other');
      }

      this.safeVideoURL = video?.safeVideoURL;
      this.safeThumbnailURL = video?.safeThumbnailURL;
      this.provider = video?.provider;
    }
  }

  private withAutoplay(url: string) {
    const result = new URL(url);
    result.searchParams.set('autoplay', '1');
    return result.toString();
  }
}
