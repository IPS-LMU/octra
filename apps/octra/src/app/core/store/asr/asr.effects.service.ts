import { Injectable } from '@angular/core';
import { getModeState, RootState } from '../index';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  exhaustMap,
  from,
  mergeMap,
  Observable,
  of,
  take,
  tap,
  throwError,
  withLatestFrom,
} from 'rxjs';
import { ASRActions } from './asr.actions';
import {
  ASRProcessStatus,
  ASRQueueItemType,
  ASRStateQueue,
  ASRStateQueueItem,
} from './index';
import { WavFormat } from '@octra/media';
import { AlertService, AudioService } from '../../shared/service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as X2JS from 'x2js';
import { ASRLanguage, ASRSettings } from '../../obj';
import { FileInfo, readFileContents } from '@octra/utilities';
import { AnnotationActions } from '../login-mode/annotation/annotation.actions';

@Injectable({
  providedIn: 'root',
})
export class AsrEffects {
  private readonly MAX_PARALLEL_ITEMS = 3;

  addToQueue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.addToQueue.do),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        if (!state.asr.queue) {
          return of(
            ASRActions.addToQueue.fail({
              error: 'missing queue',
            })
          );
        }

        const asrSettings =
          state.application.appConfiguration?.octra.plugins.asr;

        if (!asrSettings) {
          return of(
            ASRActions.addToQueue.fail({
              error: `missing asr settings`,
            })
          );
        }

        const asrInfo = asrSettings.services.find(
          (a) => state.asr.settings?.selectedService === a.provider
        );
        const asrLanguage = asrSettings.languages.find(
          (a) => a.code === state.asr.settings?.selectedLanguage
        );

        if (!asrInfo || !asrLanguage) {
          return of(
            ASRActions.addToQueue.fail({
              error: `missing asr info or language`,
            })
          );
        }

        if (!state.asr.settings?.selectedLanguage) {
          return of(
            ASRActions.addToQueue.fail({
              error: `missing asr language`,
            })
          );
        }

        return of(
          ASRActions.addToQueue.success({
            item: {
              id: state.asr.queue.idCounter + 1,
              selectedASRInfo: asrInfo,
              selectedLanguage: asrLanguage,
              status: ASRProcessStatus.IDLE,
              progress: 0,
              time: action.item.timeInterval,
              transcriptInput: action.item.transcript,
              type: action.item.type,
            },
          })
        );
      })
    )
  );

  removeItemFromQueue$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.removeItemFromQueue.do),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        if (!state.asr.queue) {
          return of(
            ASRActions.removeItemFromQueue.fail({
              error: 'missing queue',
            })
          );
        }

        const index = state.asr.queue.items.findIndex(
          (a) => a.id === action.id
        );

        if (index > -1) {
          return of(
            ASRActions.removeItemFromQueue.success({
              index,
            })
          );
        } else {
          return of(
            ASRActions.removeItemFromQueue.fail({
              error: `queueItem with id ${action.id} does not exist and can't be removed.`,
            })
          );
        }
      })
    )
  );

  startProcessing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ASRActions.startProcessing.do,
        ASRActions.processQueueItem.do,
        ASRActions.processQueueItem.success,
        ASRActions.processQueueItem.fail
      ),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        const queue = state.asr.queue;
        if (!queue) {
          return of(
            ASRActions.startProcessing.fail({
              error: 'missing queue',
            })
          );
        }

        console.log(
          `________-----> ${queue.statistics.running} < ${this.MAX_PARALLEL_ITEMS}`
        );
        if (queue.status === ASRProcessStatus.STARTED) {
          if (queue.statistics.running < this.MAX_PARALLEL_ITEMS) {
            const item = this.getFirstFreeItem(queue);

            if (item) {
              return of(
                ASRActions.processQueueItem.do({
                  item,
                })
              );
            }
            // no free item
            return of(
              ASRActions.setQueueStatus.do({
                status: ASRProcessStatus.IDLE,
              })
            );
          }

          // max parallel reached
          return of(
            ASRActions.setQueueStatus.do({
              status: ASRProcessStatus.STARTED,
            })
          );
        }
        return of(
          ASRActions.setQueueStatus.do({
            status: ASRProcessStatus.IDLE,
          })
        );
      })
    )
  );

  processQueueItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.processQueueItem.do),
      withLatestFrom(this.store),
      exhaustMap(([{ item }, state]) => {
        if (item.status !== ASRProcessStatus.STARTED) {
          // 1. cut audio
          return of(
            ASRActions.cutAndUploadQueueItem.do({
              item,
              options: {
                asr:
                  item.type === ASRQueueItemType.ASR ||
                  item.type === ASRQueueItemType.ASRMAUS,
                wordAlignment:
                  item.type === ASRQueueItemType.ASRMAUS ||
                  item.type === ASRQueueItemType.MAUS,
              },
            })
          );
        }
        return of(
          ASRActions.processQueueItem.fail({
            error: `item already started`,
          })
        );
      })
    )
  );

  cutAndUploadItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.cutAndUploadQueueItem.do),
      withLatestFrom(this.store),
      mergeMap(([action, state]) => {
        const audioManager = this.audio.audiomanagers[0];

        if (!audioManager.resource.arraybuffer) {
          return throwError(() => new Error(`arraybuffer is undefined`));
        }

        // 1) cut signal
        const format = new WavFormat();
        format.init(
          audioManager.resource.info.fullname,
          audioManager.resource.arraybuffer
        );

        return from(
          format.cutAudioFile(
            `OCTRA_ASRqueueItem_${action.item.id}.wav`,
            audioManager.resource.arraybuffer,
            {
              number: 1,
              sampleStart: action.item.time.sampleStart,
              sampleDur: action.item.time.sampleLength,
            }
          )
        ).pipe(
          withLatestFrom(this.store),
          exhaustMap(([file, state]) => {
            const queue = state.asr.queue;
            const item = queue!.items.find((a) => a.id === action.item.id);

            if (!item) {
              return of(
                ASRActions.cutAndUploadQueueItem.fail({
                  error: 'item is undefined',
                })
              );
            }

            // 2. upload
            if (item.status !== ASRProcessStatus.STOPPED) {
              const fileBlob = new File([file.uint8Array], file.fileName, {
                type: 'audio/wav',
              });
              const serviceRequirementsError = this.fitsServiceRequirements(
                fileBlob,
                action.item
              );

              if (serviceRequirementsError === '') {
                const formData: FormData = new FormData();
                formData.append('file0', fileBlob);

                const filesForUpload: File[] = [fileBlob];

                if (action.item.transcriptInput) {
                  filesForUpload.push(
                    new File(
                      [action.item.transcriptInput],
                      `OCTRA_ASRqueueItem_${action.item.id}.txt`,
                      { type: 'text/plain' }
                    )
                  );
                }

                return this.uploadFiles(
                  filesForUpload,
                  action.item.selectedLanguage
                ).pipe(
                  exhaustMap(([audioURL, transcriptURL]) => {
                    return of(
                      ASRActions.cutAndUploadQueueItem.success({
                        item: {
                          ...action.item,
                          progress: 25,
                        },
                        options: action.options,
                        transcriptURL,
                        audioURL,
                        outFormat: 'txt',
                      })
                    );
                  })
                );
              } else {
                return of(
                  ASRActions.cutAndUploadQueueItem.fail({
                    error: serviceRequirementsError,
                    item: action.item,
                  })
                );
              }
            }

            // stopped, don't continue
            return of(
              ASRActions.stopItemProcessing.success({
                id: item.id,
              })
            );
          }),
          catchError((error) =>
            of(
              ASRActions.cutAndUploadQueueItem.fail({
                item: action.item,
                error,
              })
            )
          )
        );
      })
    )
  );

  cutItemSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.cutAndUploadQueueItem.success),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        if (action.options?.asr) {
          return of(
            ASRActions.runASROnItem.do({
              item: action.item,
              options: action.options,
              outFormat: action.outFormat,
              audioURL: action.audioURL,
            })
          );
        } else if (action.options?.wordAlignment) {
          return of(
            ASRActions.runWordAlignmentOnItem.do({
              item: action.item,
              outFormat: action.outFormat,
              audioURL: action.audioURL,
              transcriptURL: action.transcriptURL!,
            })
          );
        }

        return of(
          ASRActions.cutAndUploadQueueItem.fail({
            item: action.item,
            error: `missing options`,
          })
        );
      })
    )
  );

  runASROnItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.runASROnItem.do),
      withLatestFrom(this.store),
      mergeMap(([{ outFormat, item, options, audioURL }, state]) => {
        return this.transcribeSignalWithASR(
          outFormat,
          item,
          audioURL,
          state.application.appConfiguration!.octra.plugins.asr
        ).pipe(
          exhaustMap((result) =>
            of(
              ASRActions.runASROnItem.success({
                item,
                audioURL,
                options,
                result: {
                  url: result.url,
                  text: result.text,
                },
              })
            )
          ),
          catchError((error) => {
            return of(
              ASRActions.runASROnItem.fail({
                item,
                error:
                  error instanceof Error
                    ? error.message
                    : error instanceof HttpErrorResponse
                    ? error.error?.message ?? error.message
                    : error,
              })
            );
          })
        );
      })
    )
  );

  runASROnItemSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.runASROnItem.success),
      withLatestFrom(this.store),
      exhaustMap(([{ item, audioURL, options, result }, state]) => {
        if (!result) {
          return of(
            ASRActions.processQueueItem.fail({
              error: `asr result is undefined`,
            })
          );
        }

        if (!options?.wordAlignment) {
          // finish
          return of(
            ASRActions.processQueueItem.success({
              item,
              result: result.text,
            })
          );
        } else {
          // continue with word alignment
          return of(
            ASRActions.runWordAlignmentOnItem.do({
              item,
              audioURL: audioURL,
              transcriptURL: result.url,
              outFormat: 'text',
            })
          );
        }
      })
    )
  );

  runWordAlignment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.runWordAlignmentOnItem.do),
      withLatestFrom(this.store),
      mergeMap(([{ item, audioURL, transcriptURL }, state]) => {
        return this.callMAUS(
          item.selectedLanguage,
          audioURL,
          transcriptURL,
          state.application.appConfiguration!.octra.plugins.asr
        ).pipe(
          exhaustMap((result) => {
            if (item.status !== ASRProcessStatus.STOPPED) {
              return from(
                readFileContents<string>(result.file, 'text', 'utf-8')
              ).pipe(
                exhaustMap((contents) => {
                  return of(
                    ASRActions.runWordAlignmentOnItem.success({
                      item,
                      result: contents,
                      transcriptURL: contents.replace(/\n/g, '').trim(),
                    })
                  );
                })
              );
            }
            // do nothing
            return of(
              ASRActions.stopItemProcessing.success({
                id: item.id,
              })
            );
          }),
          catchError((error) =>
            of(
              ASRActions.runWordAlignmentOnItem.fail({
                item,
                error,
              })
            )
          )
        );
      })
    )
  );

  runWordAlignmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.runWordAlignmentOnItem.success),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        return of(
          ASRActions.processQueueItem.success({
            item: action.item,
            result: action.result,
          })
        );
      })
    )
  );

  triggerAnnotationChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ASRActions.addToQueue.success,
        ASRActions.processQueueItem.do,
        ASRActions.cutAndUploadQueueItem.success,
        ASRActions.runASROnItem.success,
        ASRActions.runASROnItem.fail,
        ASRActions.runWordAlignmentOnItem.success,
        ASRActions.runWordAlignmentOnItem.fail,
        ASRActions.processQueueItem.success
      ),
      withLatestFrom(this.store),
      mergeMap(([action, state]) => {
        const item = state.asr.queue!.items.find(
          (a) => a.id === action.item.id
        )!;

        if (item) {
          return of(
            AnnotationActions.updateASRSegmentInformation.do({
              mode: state.application.mode!,
              timeInterval: item.time,
              progress: item.progress,
              itemType: item.type,
              result:
                item.status === ASRProcessStatus.FINISHED
                  ? item.result
                  : undefined,
              isBlockedBy:
                item.status !== ASRProcessStatus.STOPPED &&
                item.status !== ASRProcessStatus.FINISHED &&
                item.status !== ASRProcessStatus.FAILED
                  ? item.type
                  : undefined,
            })
          );
        } else {
          console.error(`can't find item in queue with id ${action.item.id}`);
          return of(
            AnnotationActions.updateASRSegmentInformation.fail({
              error: "can't find item in queue",
            })
          );
        }
      })
    )
  );

  onProcessingFail$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ASRActions.runASROnItem.fail),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          const modState = getModeState(state);
          this.alertService.showAlert(
            'danger',
            `ASR Error (item at ${(
              action.item.time.sampleStart / modState!.audio.sampleRate
            ).toFixed(2)}s ${action.item.id} with error: ${action.error}`
          );
        })
      ),
    {
      dispatch: false,
    }
  );

  constructor(
    private store: Store<RootState>,
    private actions$: Actions,
    private audio: AudioService,
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  private getFirstFreeItem(
    queue: ASRStateQueue
  ): ASRStateQueueItem | undefined {
    return queue.items.find((a) => {
      return a.status === ASRProcessStatus.IDLE;
    });
  }

  private fitsServiceRequirements(file: File, item: ASRStateQueueItem): string {
    if (item.selectedASRInfo) {
      if (item.selectedASRInfo.maxSignalDuration && item.sampleRate) {
        if (
          item.time.sampleLength / item.sampleRate >
          item.selectedASRInfo.maxSignalDuration
        ) {
          return '[Error] max duration exceeded';
        }
      }
      if (item.selectedASRInfo.maxSignalSize !== undefined) {
        if (file.size / 1000 / 1000 > item.selectedASRInfo.maxSignalSize) {
          return '[Error] max signal size exceeded';
        }
      }
    }

    return '';
  }

  public transcribeSignalWithASR(
    outFormat: string,
    item: ASRStateQueueItem,
    audioURL: string,
    asrSettings: ASRSettings
  ): Observable<{
    file: File;
    text: string;
    url: string;
  }> {
    return this.callASR(
      item.selectedLanguage,
      audioURL,
      outFormat,
      asrSettings
    );
  }

  private callASR(
    languageObject: ASRLanguage,
    audioURL: string,
    outFormat: string,
    asrSettings: ASRSettings
  ): Observable<{
    file: File;
    text: string;
    url: string;
  }> {
    const asrUrl = asrSettings.calls[0]
      .replace('{{host}}', languageObject.host)
      .replace('{{audioURL}}', audioURL)
      .replace('{{asrType}}', languageObject.asr)
      .replace('{{language}}', languageObject.code)
      .replace('{{outFormat}}', outFormat);

    const info = FileInfo.fromURL(asrUrl);

    return this.http
      .post(
        asrUrl,
        {},
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'text',
        }
      )
      .pipe(
        take(1),
        exhaustMap((result) => {
          return from(this.extractResultData(result, info.fullname));
        })
      );
  }

  private extractResultData = (
    result: string,
    fileName: string
  ): Promise<{ file: File; text: string; url: string }> => {
    return new Promise<{ file: File; text: string; url: string }>(
      (resolve, reject) => {
        // convert result to json
        const x2js = new X2JS();
        let json: any = x2js.xml2js(result);
        json = json.WebServiceResponseLink;

        if (json.success === 'true') {
          const file = FileInfo.fromURL(
            json.downloadLink,
            'text/plain',
            fileName
          );
          file
            .updateContentFromURL(this.http)
            .then((text) => {
              // add messages to protocol
              resolve({
                file: file.file!,
                text,
                url: json.downloadLink,
              });
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          reject(new Error(this.extractErrorMessage(json.output)));
        }
      }
    );
  };

  private uploadFiles(
    files: File[],
    selectedLanguage: ASRLanguage
  ): Observable<string[]> {
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      formData.append(`file${i}`, file);
    }

    return this.http
      .post(`${selectedLanguage.host}uploadFileMulti`, formData, {
        responseType: 'text',
      })
      .pipe(
        take(1),
        exhaustMap((result) => {
          const x2js = new X2JS();
          let json: any = x2js.xml2js(result);
          json = json.UploadFileMultiResponse;

          if (json.success === 'true') {
            if (json.fileList) {
              if (!Array.isArray(json.fileList)) {
                return of([json.fileList.entry.value]);
              } else {
                return of(json.fileList.map((a: any) => a.entry.value));
              }
            }
            return throwError(() => new Error('fileList ist undefined'));
          }

          return throwError(() => new Error('server response with error'));
        })
      );
  }

  private callMAUS(
    languageObject: ASRLanguage,
    audioURL: string,
    transcriptURL: string,
    asrSettings: ASRSettings
  ): Observable<{
    file: File;
    url: string;
  }> {
    const mausURL = asrSettings.calls[1]
      .replace('{{host}}', languageObject.host)
      .replace('{{audioURL}}', audioURL)
      .replace('{{transcriptURL}}', transcriptURL)
      .replace('{{asrType}}', languageObject.asr)
      .replace('{{language}}', languageObject.code);

    const info = FileInfo.fromURL(mausURL);
    return this.http
      .post(
        mausURL,
        {},
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'text',
        }
      )
      .pipe(
        exhaustMap((result) => {
          return from(this.extractResultData(result, info.fullname));
        })
      );
  }

  extractErrorMessage(error: string) {
    const lines = error.split('<br/>');
    const found = lines.find((a) => /^StdErr: /g.exec(a) !== null);
    let result = found?.replace(/StdErr: /g, '');
    result = result?.replace(/ - exiting/g, '') ?? error;
    return result;
  }
}
