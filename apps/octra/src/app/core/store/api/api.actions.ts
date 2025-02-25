import { createActionGroup, props } from '@ngrx/store';
import { AccountLoginMethod } from '@octra/api-types';

export class APIActions {
  static init = createActionGroup({
    source: 'api/init',
    events: {
      do: props<{
        url: string;
        webToken?: string;
        appToken: string;
        authenticated?: boolean;
        authType?: AccountLoginMethod;
      }>(),
      initWithoutAPI: props<{
        authenticated?: boolean;
      }>(),
      success: props<{
        serverOnline: boolean;
        url: string;
        webToken?: string;
        authenticated?: boolean;
        authType?: AccountLoginMethod;
      }>(),
    },
  });
}
