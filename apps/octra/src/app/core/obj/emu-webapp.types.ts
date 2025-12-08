import { OAnnotJSON } from '@octra/annotation';
import { IAnnotation } from '../shared/octra-database';

export interface EmuWebAppOutMessageEventData {
  trigger: 'autoSave' | 'manualSave';
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

export interface EmuWebAppInMessageEventData {
  type: 'command';
  command: 'load';
  params: {
    listenForMessages: boolean;
    disableBundleListSidebar: boolean;
    saveToWindowParent: boolean;
    labelType: string;
  };
  audioArrayBuffer: ArrayBuffer;
  annotation: IAnnotation;
}
