import { Injectable } from '@angular/core';
import { LoginMode, RootState } from '../index';
import { Action, Store } from '@ngrx/store';
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
import { AudioCutter, FileInfo, readFileContents } from '@octra/web-media';
import {
  AlertService,
  AudioService,
  UserInteractionsService,
} from '../../shared/service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ASRService, ASRSettings, ProjectSettings } from '../../obj';
import { AnnotationActions } from '../login-mode/annotation/annotation.actions';
import { AccountLoginMethod } from '@octra/api-types';
import { AuthenticationActions } from '../authentication';
import { TranslocoService } from '@jsverse/transloco';
import X2JS from 'x2js';

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
          state.application.appConfiguration?.octra.plugins!.asr!;

        if (!asrSettings) {
          return of(
            ASRActions.addToQueue.fail({
              error: `missing asr settings`,
            })
          );
        }

        if (
          !state.asr.settings?.selectedService ||
          !state.asr.settings?.selectedASRLanguage
        ) {
          return of(
            ASRActions.addToQueue.fail({
              error: `missing asr info or language`,
            })
          );
        }

        if (!state.asr.settings?.selectedASRLanguage) {
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
              selectedASRService: state.asr.settings.selectedService!,
              selectedASRLanguage: state.asr.settings.selectedASRLanguage!,
              selectedMausLanguage: state.asr.settings?.selectedMausLanguage,
              accessCode: state.asr.settings?.accessCode,
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
        ASRActions.processQueueItem.fail,
        ASRActions.stopItemProcessing.success
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

        if (queue.status === ASRProcessStatus.STARTED) {
          if (queue.statistics.running < this.MAX_PARALLEL_ITEMS) {
            const item = this.getFirstFreeItem(queue);

            if (item) {
              return of(
                ASRActions.processQueueItem.do({
                  item,
                })
              );
            } else if (
              ![
                ASRActions.processQueueItem.do.type,
                ASRActions.startProcessing.do.type,
              ].includes(action.type as any)
            ) {
              if (queue.statistics.running === 0) {
                // no free item after continuation and nothing running
                return of(
                  ASRActions.setQueueStatus.do({
                    status: ASRProcessStatus.IDLE,
                  })
                );
              }
            }
          }

          // max parallel reached
          return of(
            ASRActions.setQueueStatus.do({
              status: ASRProcessStatus.STARTED,
            })
          );
        }
        return of();
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
            item,
            error: `item already started`,
            newStatus: ASRProcessStatus.FAILED,
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
        const cutter = new AudioCutter(audioManager.resource.info);

        const channelDataFactor =
          (audioManager.resource.info.audioBufferInfo?.sampleRate ??
            audioManager.resource.info.sampleRate) /
          audioManager.resource.info.sampleRate;

        return from(
          cutter.cutAudioFileFromChannelData(
            this.audio.audioManager.resource.info,
            `OCTRA_ASRqueueItem_${action.item.id}.wav`,
            audioManager.channel,
            {
              number: 1,
              sampleStart: Math.ceil(
                action.item.time.sampleStart * channelDataFactor
              ),
              sampleDur: Math.ceil(
                action.item.time.sampleLength * channelDataFactor
              ),
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
                  newStatus: ASRProcessStatus.FAILED,
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
                  action.item.selectedASRService
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
                    newStatus: ASRProcessStatus.FAILED,
                  })
                );
              }
            }

            // stopped, don't continue
            return of(
              ASRActions.stopItemProcessing.success({
                item,
              })
            );
          }),
          catchError((error) =>
            of(
              ASRActions.cutAndUploadQueueItem.fail({
                item: action.item,
                error,
                newStatus: ASRProcessStatus.FAILED,
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
            newStatus: ASRProcessStatus.FAILED,
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
          state.application.appConfiguration!.octra.plugins!.asr!
        ).pipe(
          withLatestFrom(this.store),
          exhaustMap(([result, state2]) => {
            const item2 = state2.asr.queue?.items?.find(
              (a) => a.time === item.time
            );

            if (item2) {
              if (item2.status !== ASRProcessStatus.STOPPED) {
                return of(
                  ASRActions.runASROnItem.success({
                    item,
                    audioURL,
                    options,
                    result: {
                      url: result.url,
                      text: result.text,
                    },
                  })
                );
              }
            }

            return of(
              ASRActions.stopItemProcessing.success({
                item: item2 ?? item,
              })
            );
          }),
          catchError((error) => {
            return this.handleShibbolethError(
              item,
              error,
              ASRActions.runASROnItem.fail({
                item,
                error:
                  error instanceof Error
                    ? error.message
                    : error instanceof HttpErrorResponse
                    ? error.error?.message ?? error.message
                    : error,
                newStatus: ASRProcessStatus.FAILED,
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
              item,
              error: `asr result is undefined`,
              newStatus: ASRProcessStatus.FAILED,
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
          item.selectedASRLanguage,
          item.selectedMausLanguage,
          item.selectedASRService.host,
          audioURL,
          transcriptURL,
          state.application.appConfiguration!.octra!.plugins!.asr!
        ).pipe(
          exhaustMap((result) => {
            if (item.status !== ASRProcessStatus.STOPPED) {
              return from(
                readFileContents<string>(result.file, 'text', 'utf-8')
              ).pipe(
                withLatestFrom(this.store),
                exhaustMap(([contents, state2]) => {
                  const item2 = state2.asr.queue?.items?.find(
                    (a) => a.time === item.time
                  );

                  if (item2) {
                    if (item2.status !== ASRProcessStatus.STOPPED) {
                      return of(
                        ASRActions.runWordAlignmentOnItem.success({
                          item,
                          result: contents,
                          transcriptURL: result.url,
                        })
                      );
                    }
                  }

                  return of(
                    ASRActions.stopItemProcessing.success({
                      item: item2 ?? item,
                    })
                  );
                })
              );
            }
            // do nothing
            return of(
              ASRActions.stopItemProcessing.success({
                item,
              })
            );
          }),
          catchError((error) =>
            this.handleShibbolethError(
              item,
              error,
              ASRActions.runWordAlignmentOnItem.fail({
                item,
                error:
                  error instanceof Error
                    ? error.message
                    : error instanceof HttpErrorResponse
                    ? error.error?.message ?? error.message
                    : error,
                newStatus: ASRProcessStatus.FAILED,
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
        ASRActions.runWordAlignmentOnItem.fail,
        ASRActions.processQueueItem.success,
        ASRActions.processQueueItem.fail,
        ASRActions.stopItemProcessing.success
      ),
      withLatestFrom(this.store),
      mergeMap(([action, state]) => {
        const item =
          state.asr.queue!.items.find((a) => a.id === action.item.id) ??
          action.item;

        if (item) {
          if (
            [ASRProcessStatus.FINISHED, ASRProcessStatus.FAILED].includes(
              item.status
            )
          ) {
            this.store.dispatch(
              ASRActions.removeItemFromQueue.do({
                id: item.id,
              })
            );
          }

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
        ofType(
          ASRActions.runASROnItem.fail,
          ASRActions.runWordAlignmentOnItem.fail
        ),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          if (
            action.newStatus === ASRProcessStatus.NOAUTH &&
            state.asr.queue!.status !== ASRProcessStatus.NOQUOTA
          ) {
            if (
              state.application.mode === LoginMode.ONLINE &&
              state.authentication.type === AccountLoginMethod.shibboleth
            ) {
              this.store.dispatch(
                AuthenticationActions.needReAuthentication.do({
                  forceAuthentication: AccountLoginMethod.shibboleth,
                  actionAfterSuccess: ASRActions.startProcessing.do(),
                  forceLogout: false,
                })
              );
              this.alertService.showAlert(
                'danger',
                this.langService.translate('asr.no auth'),
                true
              );
            } else {
              this.store.dispatch(
                AuthenticationActions.needReAuthentication.do({
                  forceAuthentication: AccountLoginMethod.shibboleth,
                  actionAfterSuccess: ASRActions.startProcessing.do(),
                  forceLogout: false,
                })
              );
            }
            this.uiService.addElementFromEvent(
              action.item.type.toLowerCase(),
              {
                value: 'no_auth',
              },
              Date.now(),
              undefined,
              undefined,
              undefined,
              {
                start: action.item.time.sampleStart,
                length: action.item.time.sampleLength,
              },
              'automation'
            );
          } else if (
            action.newStatus === ASRProcessStatus.NOQUOTA &&
            state.asr.queue!.status !== ASRProcessStatus.NOQUOTA
          ) {
            this.alertService.showAlert(
              'danger',
              this.langService.translate('asr.no quota'),
              true
            );

            this.uiService.addElementFromEvent(
              action.item.type.toLowerCase(),
              {
                value: 'failed',
              },
              Date.now(),
              undefined,
              undefined,
              undefined,
              {
                start: action.item.time.sampleStart,
                length: action.item.time.sampleLength,
              },
              'automation'
            );
          }
        })
      ),
    {
      dispatch: false,
    }
  );

  reAuthenticationAborted$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.needReAuthentication.abort),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          if (state.asr.queue) {
            for (const item of state.asr.queue.items) {
              if (
                item.status === ASRProcessStatus.FAILED ||
                item.status === ASRProcessStatus.NOAUTH ||
                item.status === ASRProcessStatus.NOQUOTA
              ) {
                this.store.dispatch(
                  ASRActions.processQueueItem.fail({
                    item,
                    error: '',
                    newStatus: ASRProcessStatus.FAILED,
                  })
                );
              }
            }
          }
        })
      ),
    { dispatch: false }
  );

  stopProcessing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.stopProcessing.do),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        if (state.asr.queue?.items) {
          for (const item of state.asr.queue.items) {
            this.store.dispatch(
              ASRActions.stopItemProcessing.do({
                time: item.time,
              })
            );
          }
        }

        return of(ASRActions.stopProcessing.success());
      })
    )
  );

  stopItemProcessing$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ASRActions.stopItemProcessing.do),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          const item = state.asr.queue?.items?.find(
            (a) =>
              a.time.sampleLength === action.time.sampleLength &&
              a.time.sampleStart === action.time.sampleStart
          );

          if (item) {
            this.store.dispatch(
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
          }
        })
      ),
    { dispatch: false }
  );

  enableASR$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.prepareTaskDataForAnnotation.do),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        const settings = state.application.appConfiguration;
        const isShibbolethUser =
          state.application.mode === LoginMode.ONLINE &&
          state.authentication.type === AccountLoginMethod.shibboleth;
        const localASRSettingsComplete =
          settings?.octra.plugins?.asr?.shibbolethURL !== undefined &&
          settings.octra.plugins?.asr?.shibbolethURL !== '';
        const asrSettingsComplete =
          settings?.octra.plugins?.asr?.enabled === true &&
          settings.octra.plugins.asr.calls.length === 2 &&
          settings.octra.plugins.asr.calls[0] !== '' &&
          settings.octra.plugins.asr.calls[1] !== '';

        console.log(
          `ASR ENABLED: ${action.task.tool_configuration?.value?.octra?.asrEnabled}`
        );

        return of(
          ASRActions.enableASR.do({
            isEnabled:
              asrSettingsComplete &&
              (((action.task.tool_configuration?.value as ProjectSettings)
                ?.octra?.asrEnabled === true &&
                isShibbolethUser) ||
                ((action.task.tool_configuration?.value as ProjectSettings)
                  ?.octra?.asrEnabled === true &&
                  localASRSettingsComplete)),
          })
        );
      })
    )
  );

  constructor(
    private store: Store<RootState>,
    private actions$: Actions,
    private audio: AudioService,
    private http: HttpClient,
    private langService: TranslocoService,
    private alertService: AlertService,
    private uiService: UserInteractionsService
  ) {}

  private getFirstFreeItem(
    queue: ASRStateQueue
  ): ASRStateQueueItem | undefined {
    return queue.items.find((a) => {
      return a.status === ASRProcessStatus.IDLE;
    });
  }

  private fitsServiceRequirements(file: File, item: ASRStateQueueItem): string {
    if (item.selectedASRService) {
      if (item.selectedASRService.maxSignalDuration && item.sampleRate) {
        if (
          item.time.sampleLength / item.sampleRate >
          item.selectedASRService.maxSignalDuration
        ) {
          return '[Error] max duration exceeded';
        }
      }
      if (item.selectedASRService.maxSignalSize !== undefined) {
        if (file.size / 1000 / 1000 > item.selectedASRService.maxSignalSize) {
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
      item.selectedASRLanguage,
      item.selectedASRService,
      audioURL,
      outFormat,
      asrSettings,
      item.accessCode
    );
  }

  private callASR(
    language: string,
    service: ASRService,
    audioURL: string,
    outFormat: string,
    asrSettings: ASRSettings,
    accessCode?: string
  ): Observable<{
    file: File;
    text: string;
    url: string;
  }> {
    let asrUrl = asrSettings.calls[0]
      .replace('{{host}}', service.host)
      .replace('{{audioURL}}', audioURL)
      .replace('{{asrType}}', `call${service.provider}${service.type}`)
      .replace('{{language}}', language)
      .replace('{{outFormat}}', outFormat);

    if (accessCode && accessCode !== '') {
      asrUrl += `&ACCESSCODE=${accessCode}`;
    }

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
            .then((text: any) => {
              // add messages to protocol
              resolve({
                file: file.file!,
                text,
                url: json.downloadLink,
              });
            })
            .catch((error: any) => {
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
    selectedLanguage: ASRService
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
            if (json.fileList?.entry) {
              if (!Array.isArray(json.fileList.entry)) {
                return of([json.fileList.entry.value]);
              } else {
                return of(json.fileList.entry.map((a: any) => a.value));
              }
            }
            return throwError(() => new Error('fileList ist undefined'));
          }

          return throwError(() => new Error('server response with error'));
        })
      );
  }

  private callMAUS(
    asrLanguage: string,
    mausLanguage: string | undefined,
    host: string,
    audioURL: string,
    transcriptURL: string,
    asrSettings: ASRSettings
  ): Observable<{
    file: File;
    url: string;
  }> {
    const mausURL = asrSettings.calls[1]
      .replace('{{host}}', host)
      .replace('{{audioURL}}', audioURL)
      .replace('{{transcriptURL}}', transcriptURL)
      .replace('{{language}}', mausLanguage ?? asrLanguage);

    const info = FileInfo.fromURL(audioURL);
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

  handleShibbolethError(
    item: ASRStateQueueItem,
    error: HttpErrorResponse,
    errorAction: Action
  ): Observable<Action> {
    const errorMessage =
      error instanceof Error
        ? error.message
        : error instanceof HttpErrorResponse
        ? error.error?.message ?? error.message
        : error;
    console.log('GOT ERROR');
    console.error(errorMessage);

    if (errorMessage.indexOf('quota') > -1) {
      return of({
        ...errorAction,
        newStatus: ASRProcessStatus.NOQUOTA,
      });
    } else if (errorMessage.indexOf('0 Unknown Error') > -1) {
      return of({
        ...errorAction,
        newStatus: ASRProcessStatus.NOAUTH,
      });
    }
    return of(errorAction);
  }

  extractErrorMessage(error: string) {
    const lines = error.split('<br/>');
    const found = lines.find((a) => /^StdErr: /g.exec(a) !== null);
    let result = found?.replace(/StdErr: /g, '');
    result = result?.replace(/ - exiting/g, '') ?? error;
    return result;
  }
}
