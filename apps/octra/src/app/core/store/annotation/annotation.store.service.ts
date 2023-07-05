import { Injectable } from '@angular/core';
import { RootState } from '../index';
import { Store } from '@ngrx/store';
import { AnnotationActions } from './annotation.actions';
import { TaskInputOutputDto } from '@octra/api-types';
import { Converter, IFile, OAudiofile } from '@octra/annotation';

@Injectable({
  providedIn: 'root',
})
export class AnnotationStoreService {
  constructor(private store: Store<RootState>) {}

  setLogs(value: any[], mode) {
    this.store.dispatch(
      AnnotationActions.saveLogs.do({
        logs: value ?? [],
        mode,
      })
    );
  }

  public getTranscriptFromIO(io: TaskInputOutputDto[]): TaskInputOutputDto {
    return io.find(
      (a) =>
        !a.fileType.includes('audio') &&
        !a.fileType.includes('video') &&
        !a.fileType.includes('image')
    );
  }

  public convertFromSupportedConverters(
    converters: Converter[],
    file: IFile,
    audioFile: OAudiofile
  ) {
    for (const converter of converters) {
      try {
        const result = converter.import(file, audioFile);
        if (result && result.annotjson) {
          return result;
        }
      } catch (e) {
        // ignore
      }
    }

    return undefined;
  }
}
