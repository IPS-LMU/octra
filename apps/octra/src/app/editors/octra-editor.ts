import { AudioSelection, SampleUnit } from '@octra/media';
import { AudioViewerComponent } from '@octra/ngx-components';
import { DefaultComponent } from '../core/component/default.component';
import { EventEmitter } from '@angular/core';
import { AudioChunk, AudioManager } from '@octra/web-media';
import {
  ASRContext,
  OctraAnnotationAnyLevel,
  OctraAnnotationSegment,
} from '@octra/annotation';

export interface OctraEditorRequirements {
  afterFirstInitialization(): void;

  disableAllShortcuts(): void;

  enableAllShortcuts(): void;

  initialized: EventEmitter<void>;
}

export abstract class OCTRAEditor extends DefaultComponent {
  protected shortcutsEnabled = true;

  protected doPlayOnHover(
    audioManager: AudioManager,
    isPlayingOnhover: boolean,
    audioChunk: AudioChunk,
    mouseCursor: SampleUnit
  ) {
    if (!audioManager.isPlaying && isPlayingOnhover) {
      // play audio on hover

      // it's very important to use a seperate chunk for the hover playback!
      const audioChunkHover = audioChunk.clone();
      audioChunkHover.volume = 1;
      audioChunkHover.playbackRate = 1;
      audioChunkHover.selection.start = mouseCursor.clone();
      audioChunkHover.selection.end = mouseCursor.add(
        audioManager.createSampleUnit(audioManager.sampleRate / 10)
      );
      audioChunkHover.startPlayback(true).catch((error) => {
        // ignore
      });
    }
  }

  abstract enableAllShortcuts(): void;
  abstract disableAllShortcuts(): void;

  protected changeArea(
    loupe: AudioViewerComponent,
    signalDisplay: AudioViewerComponent,
    audioManager: AudioManager,
    audioChunkLoupe: AudioChunk,
    cursorTime: SampleUnit,
    factor: number
  ): Promise<AudioChunk | undefined> {
    return new Promise<AudioChunk | undefined>((resolve) => {
      const cursorLocation = signalDisplay.mouseCursor;
      if (cursorLocation && cursorTime) {
        const halfRate = Math.round(audioManager.sampleRate / factor);
        const start =
          cursorTime.samples > halfRate
            ? audioManager.createSampleUnit(cursorTime.samples - halfRate)
            : audioManager.createSampleUnit(0);

        const end =
          cursorTime.samples <
          audioManager.resource.info.duration.samples - halfRate
            ? audioManager.createSampleUnit(cursorTime.samples + halfRate)
            : audioManager.resource.info.duration.clone();

        loupe.av.zoomY = factor;
        if (start && end) {
          audioChunkLoupe.destroy();
          resolve(new AudioChunk(new AudioSelection(start, end), audioManager));
        } else {
          resolve(undefined);
        }
      } else {
        resolve(undefined);
      }
    });
  }

  abstract openSegment(index: number): void;

  protected checkIfSmallAudioChunk(
    audioChunk: AudioChunk,
    currentLevel: OctraAnnotationAnyLevel<OctraAnnotationSegment<ASRContext>>
  ) {
    const emptySegmentIndex = currentLevel.items.findIndex((a) => {
      return a instanceof OctraAnnotationSegment
        ? a.getFirstLabelWithoutName('Speaker')?.value === undefined ||
            a.getFirstLabelWithoutName('Speaker')?.value === ''
        : false;
    });

    if (audioChunk.time.duration.seconds <= 35) {
      if (emptySegmentIndex > -1) {
        this.openSegment(emptySegmentIndex);
      } else if (currentLevel.items.length === 1) {
        this.openSegment(0);
      }
    }
  }
}
