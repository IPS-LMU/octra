import {AudioChunk, AudioManager, AudioSelection, SampleUnit} from '@octra/media';
import {AudioViewerComponent} from '@octra/components';
import {Level} from '@octra/annotation';

export abstract class OCTRAEditor {
  public abstract afterFirstInitialization();

  public abstract disableAllShortcuts();

  public abstract enableAllShortcuts();

  protected doPlayOnHover(audioManager: AudioManager, isPlayingOnhover: boolean, audioChunk: AudioChunk, mouseCursor: SampleUnit) {
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

  protected changeArea(
    loupe: AudioViewerComponent, signalDisplay: AudioViewerComponent, audioManager: AudioManager,
    audioChunkLoupe: AudioChunk, cursorTime: SampleUnit, factor: number): Promise<AudioChunk | null> {
    return new Promise<AudioChunk>((resolve) => {
      const cursorLocation = signalDisplay.mouseCursor;
      if (cursorLocation && cursorTime) {
        const halfRate = Math.round(audioManager.sampleRate / factor);
        const start = (cursorTime.samples > halfRate)
          ? audioManager.createSampleUnit(cursorTime.samples - halfRate)
          : audioManager.createSampleUnit(0);

        const end = (cursorTime.samples < audioManager.ressource.info.duration.samples - halfRate)
          ? audioManager.createSampleUnit(cursorTime.samples + halfRate)
          : audioManager.ressource.info.duration.clone();

        loupe.av.zoomY = factor;
        if (start && end) {
          audioChunkLoupe.destroy();
          resolve(new AudioChunk(new AudioSelection(start, end), audioManager));
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }

  abstract openSegment(index: number);

  protected checkIfSmallAudioChunk(audioChunk: AudioChunk, currentLevel: Level) {
    const emptySegmentIndex = currentLevel.segments.segments.findIndex((a) => {
      return a.transcript === '';
    });

    if (audioChunk.time.duration.seconds <= 35) {
      if (emptySegmentIndex > -1) {
        this.openSegment(emptySegmentIndex);
      } else if (currentLevel.segments.length === 1) {
        this.openSegment(0);
      }
    }
  }
}

