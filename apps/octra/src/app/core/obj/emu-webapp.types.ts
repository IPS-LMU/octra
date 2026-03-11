import { IAnnotJSON, OAnnotJSON } from '@octra/annotation';

export interface EmuWebAppOutMessageEventData {
  trigger: 'autoSave' | 'manualSave' | 'listening';
  data?: {
    annotation?: OAnnotJSON;
    mediaFile?: {
      encoding: string;
      data: string;
    };
    session?: string;
    ssffFiles?: unknown[];
  };
}

export interface I_globalScss {
  colorBlack: string;
  colorWhite: string;
  colorBlue: string;
  colorRed: string;
  colorYellow: string;
  colorGreen: string;
  colorGrey: string;
  colorLightGrey: string;
  colorDarkGrey: string;
  colorTransparentGrey: string;
  colorTransparentLightGrey: string;
  colorTransparentBlack: string;
  colorTransparentRed: string;
  colorTransparentYellow: string;
  animationPeriod: string;
  fontSmallFamily: string;
  fontSmallSize: string;
  fontSmallWeight: string;
  fontLargeFamily: string;
  fontLargeSize: string;
  fontLargeWeight: string;
  fontInputFamily: string;
  fontInputSize: string;
  fontInputWeight: string;
  fontCodeFamily: string;
  fontCodeSize: string;
  fontCodeWeight: string;
}

export interface WindowMessageCommand<T> {
  type: 'command' | 'response';
  command: 'load' | 'set_style' | 'get_style' | 'get_version';
  params: T;
}

export interface WindowMessageCommandLoadParams {
  labelType?: string;
  saveToWindowParent?: boolean;
  disableBundleListSidebar?: boolean;
  audioGetUrl?: string;
  labelGetUrl?: string;
  audioArrayBuffer?: ArrayBuffer;
  annotation?: IAnnotJSON;
  styles?: WindowMessageCommandStyleParams;
}

/**
 * Command loads the EMU-webApp with given data.
 */
export interface WindowMessageCommandLoad extends WindowMessageCommand<WindowMessageCommandLoadParams> {
  command: 'load';
}

export interface WindowMessageCommandStyleParams extends Partial<I_globalScss> {
  spectrogram?: {
    heatMapColorAnchors?: number[][];
  };
}

/**
 * Command overwrites the styles for the EMU-webApp
 */
export interface WindowMessageCommandSetStyle extends WindowMessageCommand<WindowMessageCommandStyleParams> {
  command: 'set_style';
}

/**
 * Command requests information about the styles used by the EMU-webApp. EMU webApp responses with given styles.
 */
export interface WindowMessageCommandGetStyle extends WindowMessageCommand<undefined> {
  command: 'get_style';
}

/**
 * Command requests information about the current version of the EMU-webApp. EMU webApp responses with the given version.
 */
export interface WindowMessageCommandGetVersion extends WindowMessageCommand<undefined> {
  command: 'get_version';
}
