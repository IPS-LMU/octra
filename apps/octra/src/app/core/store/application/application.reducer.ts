import {createReducer, on} from '@ngrx/store';
import * as ApplicationActions from './application.actions';
import {ApplicationState, LoadingStatus} from '../index';

export const initialState: ApplicationState = {
  loading: {
    status: LoadingStatus.INITIALIZE,
    progress: 0,
    errors: []
  },
  audioSettings: {
    volume: 1,
    speed: 1
  }
};

export const reducer = createReducer(
  initialState,
  on(ApplicationActions.load, (state, {progress}) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.LOADING,
      progress
    }
  })),
  on(ApplicationActions.addError, (state, {error}) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.FAILED,
      errors: [...state.loading.errors, error]
    }
  })),
  on(ApplicationActions.finishLoading, (state) => ({
    ...state,
    loading: {
      ...state.loading,
      status: LoadingStatus.FINISHED
    }
  })),
  on(ApplicationActions.setCurrentEditor, (state, {currentEditor}) => ({
    ...state,
    currentEditor
  })),
  on(ApplicationActions.setAudioVolume, (state, {volume}) => ({
    ...state,
    audioSettings: {
      ...state.audioSettings,
      volume
    }
  })),
  on(ApplicationActions.setAudioSpeed, (state, {speed}) => ({
    ...state,
    audioSettings: {
      ...state.audioSettings,
      speed
    }
  }))
);

