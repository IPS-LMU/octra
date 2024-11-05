/**
 * @author Klaus Jänsch
 * Original: https://github.com/IPS-LMU/WebSpeechRecorderNg/blob/master/projects/speechrecorderng/src/lib/audio/impl/wavreader.ts
 * Extracted: 2024-11-04
 */

export class WavFileFormat {
    static readonly RIFF_KEY: string = 'RIFF';
    static readonly WAV_KEY: string = 'WAVE';
    static readonly PCM: number = 0x0001;
    static readonly WAVE_FORMAT_IEEE_FLOAT: number = 0x0003;
}




