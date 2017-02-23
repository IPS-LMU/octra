import { AudioTime } from "./AudioTime";
import { Chunk } from "./Chunk";
import { Functions } from "./Functions";
import { Logger } from "./Logger";
export class AudioTimeCalculator {
	constructor(public samplerate: number,
				public _duration: AudioTime,
				public audio_px_width: number
	) {
		if(this.audio_px_width == null ||this.audio_px_width < 1)
			console.error("audio px null");
	}

	set duration(value: AudioTime) {
		this._duration = value;
	}

	public samplestoAbsX(time_samples: number, duration?: AudioTime): number {
		let dur = (duration) ? duration : this._duration;
		return (time_samples / dur.samples) * this.audio_px_width;
	}

	public absXChunktoSamples(absX: number, chunk:Chunk): number {
		let start = (chunk.time.start) ? chunk.time.start.samples : 1;
		let duration = chunk.time.end.samples - start;
		if (absX >= 0 && absX <= this.audio_px_width) {
			let ratio = absX / this.audio_px_width;
			return AudioTimeCalculator.roundSamples((duration * ratio) + chunk.time.start.samples);
		}

		return -1;
	}

	public absXtoSamples2(absX: number, chunk:Chunk): number {
		let start = (chunk.time.start) ? chunk.time.start.samples : 1;
		let duration = chunk.time.end.samples - start;
		if (absX >= 0 && absX <= this.audio_px_width) {
			let ratio = absX / this.audio_px_width;

			return AudioTimeCalculator.roundSamples(duration * ratio);
		}

		return -1;
	}

	public samplesToSeconds(samples: number):number {
		return (this.samplerate > 0 && samples > -1) ? (samples / this.samplerate) : 0;
	}

	public secondsToSamples(seconds:number):number {
		return (this.samplerate > 0 && seconds > -1) ? AudioTimeCalculator.roundSamples(seconds * this.samplerate) : 0;
	}

	public static roundSamples(samples:number){
		return Math.round(samples);
	}
}