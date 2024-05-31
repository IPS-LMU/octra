# @octra/media - Audio

# AudioManager

The AudioManager is a class that controls an audio file and all of its chunks (audio sequences that should be played separately). It decodes WAV files parallel using web workers and uses HTMLAudio for playback. While HTML Audio doesn't allow precise audio playback using samples the AudioManager offers to play audio files using samples and converts it to seconds by the audio file's sampling rate.

## Example

```Typescript
import { AudioManager, AudioSelection, SampleUnit, WavFormat } from "@octra/media";

const xhr = new XMLHttpRequest();
xhr.responseType = "arraybuffer";
xhr.open("get", "http://127.0.0.1:8080/Bahnauskunft.wav");

xhr.onloadend = () => {
  // finished loading array buffer from server
  AudioManager.decodeAudio("Bahnauskunft.wav", "audio/wav", xhr.response, [
    new WavFormat()
  ]).subscribe({
    next: async (event) => {
      if (event.decodeProgress === 1) {
        const audioManager = event.audioManager;

        const selection = new AudioSelection(
          SampleUnit.fromSeconds(3.53445, audioManager.sampleRate),
          SampleUnit.fromSeconds(6, audioManager.sampleRate)
        );

        // starts the audio playback (user needs to interact with the website before)
        await audioManager.startPlayback(selection, 1, 1);

        audioManager.destroy();
      }
    }
  });
};

xhr.send();
```

### Functions

See comments in [AudioManager.ts](audio-manager.ts).
