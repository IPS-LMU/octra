import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { TranslocoService } from '@ngneat/transloco';
import { catchError, exhaustMap, map, of, tap } from 'rxjs';
import { LoginMode, RootState } from '../index';
import { OctraModalService } from '../../modals/octra-modal.service';
import { RoutingService } from '../../shared/service/routing.service';
import { AnnotationActions } from './annotation.actions';
import { AudioService, TranscriptionService } from '../../shared/service';
import { withLatestFrom } from 'rxjs/operators';
import { AppInfo } from '../../../app.info';
import {
  IFile,
  ImportResult,
  OAudiofile,
  OIDBLevel,
  OIDBLink,
  OLevel,
} from '@octra/annotation';
import { AppStorageService } from '../../shared/service/appstorage.service';

@Injectable()
export class AnnotationEffects {
  startAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.startAnnotation.do),
      exhaustMap((a) => {
        return this.apiService
          .startTask(a.project.id, {
            task_type: 'annotation',
          })
          .pipe(
            map((task) => {
              this.sessionStorageService.clear();

              return AnnotationActions.startAnnotation.success({
                task,
                project: a.project,
                mode: a.mode,
              });
            }),
            catchError((error: HttpErrorResponse) => {
              this.sessionStorageService.clear();
              return of(AnnotationActions.startAnnotation.fail({ error }));
            })
          );
      })
    )
  );
  //

  onAnnotationStart$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.startAnnotation.success),
        tap((a) => {
          this.routingService.navigate(['user/transcr']);
          this.store.dispatch(
            AnnotationActions.loadAudio.do({
              audioFile: a.task.inputs.find(
                (a) => a.fileType.indexOf('audio') > -1
              ),
              mode: a.mode,
            })
          );
        })
      ),
    { dispatch: false }
  );

  onAudioLoad$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.loadAudio.do),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          console.log('Load audio file...');
          if (state.application.mode === undefined) {
            this.store.dispatch(
              AnnotationActions.loadAudio.fail({
                error: `An error occured. Please click on "Back" and try it again.`,
              })
            );
          }

          let filename = a.audioFile.filename;
          if (
            state.application.mode === LoginMode.ONLINE ||
            state.application.mode === LoginMode.URL ||
            state.application.mode === LoginMode.DEMO
          ) {
            // online, url or demo
            if (a.audioFile) {
              const src = this.apiService.prepareFileURL(a.audioFile.url);
              // extract filename

              filename = filename.substring(0, filename.lastIndexOf('.'));

              if (filename.indexOf('src=') > -1) {
                filename = filename.substring(filename.indexOf('src=') + 4);
              }

              this.audio.loadAudio(src).subscribe({
                next: (progress) => {
                  if (progress < 1) {
                    this.store.dispatch(
                      AnnotationActions.loadAudio.progress({
                        value: progress,
                        mode: state.application.mode,
                      })
                    );
                  } else {
                    this.store.dispatch(
                      AnnotationActions.loadAudio.success({
                        mode: state.application.mode,
                      })
                    );
                  }
                },
                error: (err) => {
                  this.store.dispatch(
                    AnnotationActions.loadAudio.fail({
                      error: 'Loading audio file failed<br/>',
                    })
                  );
                  console.error(err);
                },
              });
            } else {
              this.store.dispatch(
                AnnotationActions.loadAudio.fail({
                  error: `No audio source found. Please click on "Back" and try it again.`,
                })
              );
              console.error('audio src is undefined');
            }
          } else if (state.application.mode === LoginMode.LOCAL) {
            // local mode
            if (state.onlineMode.sessionFile !== undefined) {
              filename = state.onlineMode.sessionFile.name;
              filename = filename.substring(0, filename.lastIndexOf('.'));

              console.log('Audio loaded.');
              this.store.dispatch(
                AnnotationActions.loadAudio.success({
                  mode: state.application.mode,
                })
              );
            } else {
              this.store.dispatch(
                AnnotationActions.loadAudio.fail({
                  error: 'sessionfile is undefined',
                })
              );
            }
          }
        })
      ),
    { dispatch: false }
  );

  onAnnotationLoadFailed$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.loadAudio.fail),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          if (state.application.mode === LoginMode.LOCAL) {
            this.routingService
              .navigate(
                ['/user/transcr/reload-file'],
                AppInfo.queryParamsHandling
              )
              .catch((error) => {
                console.error(error);
              });
          }
        })
      ),
    { dispatch: false }
  );

  onAnnotationLoadSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.loadAudio.success),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          const then = () => {
            const audioRessource = this.audio.audiomanagers[0].resource;
            this.store.dispatch(
              AnnotationActions.setAudioLoaded.do({
                mode: this.appStorage.useMode,
                loaded: true,
                fileName: audioRessource.info.fullname,
                sampleRate: audioRessource.info.sampleRate,
              })
            );
          };

          if (
            state.application.mode === LoginMode.URL &&
            state.application.queryParams.transcript !== undefined
          ) {
            this.transcrService.defaultFontSize = 16;

            // load transcript file via URL
            this.http
              .get(state.application.queryParams.transcript, {
                responseType: 'text',
              })
              .subscribe({
                next: (res) => {
                  let filename = state.application.queryParams.transcript;
                  filename = filename.substring(filename.lastIndexOf('/') + 1);

                  const file: IFile = {
                    name: filename,
                    content: res,
                    type: 'text',
                    encoding: 'utf-8',
                  };

                  // convert par to annotJSON
                  const audioRessource = this.audio.audiomanagers[0].resource;
                  const oAudioFile = new OAudiofile();
                  oAudioFile.arraybuffer = audioRessource.arraybuffer;
                  oAudioFile.duration = audioRessource.info.duration.samples;
                  oAudioFile.name = audioRessource.info.fullname;
                  oAudioFile.sampleRate =
                    audioRessource.info.duration.sampleRate;
                  oAudioFile.size = audioRessource.size;

                  let importResult: ImportResult;
                  // find valid converter...
                  for (const converter of AppInfo.converters) {
                    if (filename.indexOf(converter.extension) > -1) {
                      // test converter
                      const tempImportResult = converter.import(
                        file,
                        oAudioFile
                      );

                      if (
                        tempImportResult !== undefined &&
                        tempImportResult.error === ''
                      ) {
                        importResult = tempImportResult;
                        break;
                      } else {
                        console.error(tempImportResult.error);
                      }
                    }
                  }

                  if (
                    !(importResult === undefined) &&
                    !(importResult.annotjson === undefined)
                  ) {
                    // conversion successfully finished
                    const newLevels: OIDBLevel[] = [];
                    const newLinks: OIDBLink[] = [];
                    for (
                      let i = 0;
                      i < importResult.annotjson.levels.length;
                      i++
                    ) {
                      newLevels.push(
                        new OIDBLevel(
                          i + 1,
                          importResult.annotjson.levels[i],
                          i
                        )
                      );
                    }
                    for (
                      let i = 0;
                      i < importResult.annotjson.links.length;
                      i++
                    ) {
                      newLinks.push(
                        new OIDBLink(i + 1, importResult.annotjson.links[i])
                      );
                    }

                    this.appStorage.overwriteAnnotation(
                      newLevels,
                      newLinks,
                      false
                    );
                  } else {
                    // TODO reject
                  }
                },
                error: (err) => {
                  // TODO reject
                },
              });
          } else {
            if (this.appStorage.useMode === LoginMode.URL) {
              // overwrite
              this.transcrService.defaultFontSize = 16;

              const newLevels: OIDBLevel[] = [];
              newLevels.push(
                new OIDBLevel(1, new OLevel('OCTRA_1', 'SEGMENT'), 1)
              );

              this.appStorage.overwriteAnnotation(newLevels, [], false);
            } else {
              then();
            }
          }
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private store: Store<RootState>,
    private apiService: OctraAPIService,
    // private settingsService: AppSettingsService,
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private sessionStorageService: SessionStorageService,
    private transloco: TranslocoService,
    private routingService: RoutingService,
    private modalsService: OctraModalService,
    private audio: AudioService,
    private transcrService: TranscriptionService,
    private appStorage: AppStorageService
  ) {}
}
