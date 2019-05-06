// Typings reference file, see links for more information
// https://github.com/typings/typings
// https://www.typescriptlang.org/docs/handbook/writing-declaration-files.html

declare var module: NodeModule;

interface NodeModule {
  id: string;
}

declare class TSOLA {
  constructor(frameSize: number, windowType: string);

  /**
   * given a (mono) frame, performs a time stretching iteration and pushes H s samples in the output CBuffer.
   */
  process: (frame: any[], outputArray: any[]) => void;

  /**
   * given the new stretching factor, it computes the new values for Hs , Ha (both integers) and invokes the function pointed by overlap_fn.
   */
    // tslint:disable-next-line:variable-name
  set_alpha: (alpha: number, overlap: number, beta: number) => void;

  /**
   * clears all internal buffers, like the overlapping buffer. This can be useful for audio players that need to create a noticeable
   * stop in the transition to the next file in a playlist, in order to avoid using the phase of the previous song to adjust the phase
   * of the next song.
   */
    // tslint:disable-next-line:variable-name
  clear_buffers: () => void;

  /**
   * changes the type of the window used within OLA. Available types are Lanczos, Triangular, Bartlett, BartlettHann, Blackman,
   * Cosine, Gauss, Hamming, Hann, Rectangular, SinBeta.
   */
    // tslint:disable-next-line:variable-name
  set_window_type: (windowType: string) => void;

  /**
   * public field pointing to a function that, given a stretching factor α, will return a new window exponent.
   */
    // tslint:disable-next-line:variable-name
  beta_fn: (alpha: number) => void;

  /**
   * public field pointing to a function that, given a stretching factor α, will return a new overlapping factor.
   */
    // tslint:disable-next-line:variable-name
  overlap_fn: (alpha: number) => void;

  /**
   * returns the last specified stretching factor.
   */
    // tslint:disable-next-line:variable-name
  get_alpha: () => number;

  /**
   * returns the current analysis hop size. This function calculates the increment to the “read head” of the input signal, when playing
   * an audio file.
   */
    // tslint:disable-next-line:variable-name
  get_ha: () => number;

  /**
   * get_hs(): returns the current synthesis hop size. This function calculates the increment to the output signal position which an be
   * used to guide the cursor in the UI of an audio player using OLA-TS.js as time stretcher.
   */
    // tslint:disable-next-line:variable-name
  get_hs: () => number;

  /**
   * get_overlap_factor(): returns the current overlapping factor.
   */
    // tslint:disable-next-line:variable-name
  get_overlap_factor: number;

  /**
   * get_beta(): returns the current window exponent.
   */
    // tslint:disable-next-line:variable-name
  get_beta: () => number;
}

declare var OLATS: any;
declare var BufferedOLA: any;
declare var CBuffer: any;

declare var System: any;
declare var jQuery: any;
declare var platform: any;
declare var tidyUpAnnotation: ((string, any) => any);
declare var videojs: any;
declare var navigator: Navigator;
declare var document: Document;
declare var Ajv: any;


