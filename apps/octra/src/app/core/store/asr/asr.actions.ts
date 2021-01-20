import {createAction, props} from '@ngrx/store';

const context = 'ASR';

export class ASRActions {
  public static setASRSettings = createAction(
    `[${context}] Set ASR Settings`,
    props<{
      selectedLanguage: string;
      selectedService: string;
    }>()
  );
}
