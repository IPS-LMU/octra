import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  AnnotJSONConverter,
  ImportResult,
  ISegment,
  OAnnotJSON,
  OctraAnnotation,
  OctraAnnotationSegment,
  OctraAnnotationSegmentLevel,
  OLabel,
  PraatTextgridConverter,
} from '@octra/annotation';
import {
  TaskDto,
  TaskInputOutputCreatorType,
  TaskInputOutputDto,
  TaskStatus,
  ToolConfigurationAssetDto,
} from '@octra/api-types';
import { SampleUnit } from '@octra/media';
import { OctraAPIService } from '@octra/ngx-octra-api';
import {
  extractFileNameFromURL,
  hasProperty,
  SubscriptionManager,
} from '@octra/utilities';
import {
  catchError,
  exhaustMap,
  forkJoin,
  interval,
  map,
  Observable,
  of,
  Subscription,
  tap,
  timer,
  withLatestFrom,
} from 'rxjs';
import { AppInfo } from '../../../../app.info';
import { ErrorModalComponent } from '../../../modals/error-modal/error-modal.component';
import { NgbModalWrapper } from '../../../modals/ng-modal-wrapper';
import { OctraModalService } from '../../../modals/octra-modal.service';
import { TranscriptionSendingModalComponent } from '../../../modals/transcription-sending-modal/transcription-sending-modal.component';
import {
  createSampleProjectDto,
  createSampleTask,
  createSampleUser,
  findCompatibleFileFromIO,
  isValidAnnotation,
  StatisticElem,
} from '../../../shared';
import {
  AlertService,
  AudioService,
  UserInteractionsService,
} from '../../../shared/service';
import { AppStorageService } from '../../../shared/service/appstorage.service';
import { RoutingService } from '../../../shared/service/routing.service';
import { ApplicationActions } from '../../application/application.actions';
import { AuthenticationActions } from '../../authentication';
import { checkAndThrowError } from '../../error.handlers';
import { getModeState, LoginMode, RootState } from '../../index';
import { LoginModeActions } from '../login-mode.actions';
import { AnnotationActions } from './annotation.actions';
import { AnnotationState, GuidelinesItem } from './index';

import { FileInfo } from '@octra/web-media';
import { DateTime } from 'luxon';
import { MaintenanceAPI } from '../../../component/maintenance/maintenance-api';
import { FeedBackForm } from '../../../obj/FeedbackForm/FeedBackForm';
import { ASRQueueItemType } from '../../asr';
import mime from 'mime';

@Injectable()
export class AnnotationEffects {
  transcrSendingModal: {
    ref?: NgbModalWrapper<TranscriptionSendingModalComponent>;
    timeout?: Subscription;
    error?: string;
  } = {};

  subscrManager = new SubscriptionManager();

  startNewAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.startNewAnnotation.do),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        if (a.mode === LoginMode.ONLINE) {
          this.store.dispatch(ApplicationActions.waitForEffects.do());

          return this.apiService
            .startTask(a.project.id, {
              task_type: 'annotation',
            })
            .pipe(
              map((task) => {
                if (task) {
                  return AnnotationActions.prepareTaskDataForAnnotation.do({
                    currentProject: a.project,
                    task,
                    mode: a.mode,
                  });
                }

                if (!task && a.actionAfterFail) {
                  this.store.dispatch(ApplicationActions.waitForEffects.do());
                  // no remaining task
                  return a.actionAfterFail;
                }
                return AnnotationActions.showNoRemainingTasksModal.do();
              }),
              catchError((error: HttpErrorResponse) =>
                checkAndThrowError(
                  {
                    statusCode: error.status,
                    message: error.error?.message ?? error.message,
                  },
                  a,
                  AnnotationActions.startAnnotation.fail({
                    error: error.error?.message ?? error.message,
                    showOKButton: true,
                  }),
                  this.store,
                  () => {
                    this.alertService.showAlert(
                      'danger',
                      error.error?.message ?? error.message
                    );
                  }
                )
              )
            );
        }

        return of(
          AnnotationActions.startAnnotation.fail({
            error: 'error.error?.message ?? error.message',
            showOKButton: true,
          })
        );
      })
    )
  );

  onPrepareTaskForAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.prepareTaskDataForAnnotation.do),
      withLatestFrom(this.store),
      map(([{ task, currentProject, mode }, state]) => {
        if (!task.tool_configuration) {
          return AnnotationActions.startAnnotation.fail({
            error: 'Missing tool configuration',
            showOKButton: true,
          });
        }

        if (
          !task.tool_configuration.assets ||
          task.tool_configuration.assets.length === 0
        ) {
          return AnnotationActions.startAnnotation.fail({
            error: 'Missing tool configuration assets',
            showOKButton: true,
          });
        }

        const assets = task.tool_configuration.assets;
        const guidelines: GuidelinesItem[] = this.readGuidelines(assets);

        this.addFunctions(assets);

        let selectedGuidelines: GuidelinesItem | undefined = undefined;

        if (guidelines.length > 0) {
          if (state.application.language) {
            if (guidelines.length === 1) {
              selectedGuidelines = guidelines[0];
            } else {
              const found = guidelines.find(
                (a) =>
                  new RegExp(
                    `_${state.application.language.toLowerCase()}.json`
                  ).exec(a.filename) !== null
              );
              selectedGuidelines = found ?? guidelines[0];
            }
          } else {
            selectedGuidelines = guidelines[0];
          }
        }

        return AnnotationActions.prepareTaskDataForAnnotation.success({
          task,
          mode,
          currentProject,
          guidelines,
          selectedGuidelines,
        });
      })
    )
  );

  prepareTaskSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.prepareTaskDataForAnnotation.success),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        const audioFile: TaskInputOutputDto | undefined =
          findCompatibleFileFromIO<TaskInputOutputDto>(
            a.task,
            'audio',
            (io: TaskInputOutputDto) => {
              if (io.fileType && io.fileType.includes('audio')) {
                return io;
              }
              return undefined;
            }
          );

        if (audioFile) {
          return of(
            AnnotationActions.loadAudio.do({
              audioFile,
              task: a.task,
              currentProject: a.currentProject,
              guidelines: a.guidelines,
              selectedGuidelines: a.selectedGuidelines,
              mode: a.mode,
            })
          );
        } else {
          return of(
            AnnotationActions.loadAudio.fail({
              error: `No audio file found in given IO.`,
            })
          );
        }
      })
    )
  );

  onAnnotationStart$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.startAnnotation.success),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          // INIT UI SERVICE
          const modeState = getModeState(state)!;
          if (a.projectSettings.logging?.forced || modeState.logging.enabled) {
            this.uiService.init(
              true,
              modeState.logging.startTime,
              modeState.logging.startReference
            );
            if (
              modeState.logging.logs &&
              Array.isArray(modeState.logging.logs)
            ) {
              this.uiService.elements = modeState.logging.logs.map((a) =>
                StatisticElem.fromAny(a)
              );
            }
            this.uiService.addElementFromEvent(
              'octra',
              { value: AppInfo.BUILD.version },
              Date.now(),
              undefined,
              undefined,
              undefined,
              undefined,
              'version'
            );
            this.subscrManager.removeByTag('uiService');
            this.subscrManager.add(
              this.uiService.afteradd.subscribe({
                next: (item: StatisticElem) => {
                  this.store.dispatch(
                    AnnotationActions.addLog.do({
                      mode: state.application.mode!,
                      log: item.getDataClone(),
                    })
                  );
                },
              }),
              'uiService'
            );
          }

          if (a.mode !== LoginMode.LOCAL) {
            this.store.dispatch(
              LoginModeActions.changeImportOptions.do({
                mode: a.mode,
                importOptions: a.projectSettings.octra?.importOptions,
              })
            );
          }

          this.store.dispatch(
            AnnotationActions.initTranscriptionService.do({ mode: a.mode })
          );
        })
      ),
    { dispatch: false }
  );

  setLogging$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.setLogging.do),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          const modeState = getModeState(state)!;
          this.uiService.init(
            action.logging,
            modeState.logging.startTime,
            modeState.logging.startReference
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
          if (state.application.mode === undefined || !a.audioFile) {
            this.store.dispatch(
              AnnotationActions.loadAudio.fail({
                error: `An error occured. Please click on "Back" and try it again.`,
              })
            );
            return;
          }

          let filename = a.audioFile!.filename;
          if (
            state.application.mode === LoginMode.ONLINE ||
            state.application.mode === LoginMode.URL ||
            state.application.mode === LoginMode.DEMO
          ) {
            // online, url or demo
            if (a.audioFile) {
              const src =
                state.application.mode === LoginMode.ONLINE
                  ? this.apiService.prepareFileURL(a.audioFile!.url!)
                  : a.audioFile!.url!;
              // extract filename

              filename = filename.substring(0, filename.lastIndexOf('.'));

              if (filename.indexOf('src=') > -1) {
                filename = filename.substring(filename.indexOf('src=') + 4);
              }

              this.audio.loadAudio(src, a.audioFile).subscribe({
                next: (progress) => {
                  if (progress < 1) {
                    this.store.dispatch(
                      AnnotationActions.loadAudio.progress({
                        value: progress,
                        mode: state.application.mode!,
                      })
                    );
                  } else {
                    this.store.dispatch(
                      AnnotationActions.loadAudio.success({
                        mode: state.application.mode!,
                        task: a.task,
                        guidelines: a.guidelines,
                        selectedGuidelines: a.selectedGuidelines,
                        currentProject: a.currentProject,
                        audioFile: a.audioFile,
                      })
                    );
                  }
                },
                error: (err) => {
                  this.store.dispatch(
                    AnnotationActions.loadAudio.fail({
                      error: 'Loading audio file failed',
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
            if (state.localMode.sessionFile !== undefined) {
              if (this.audio.audiomanagers.length > 0) {
                this.store.dispatch(
                  AnnotationActions.loadAudio.success({
                    mode: LoginMode.LOCAL,
                    guidelines: a.guidelines,
                    selectedGuidelines: a.selectedGuidelines,
                    task: a.task,
                    currentProject: a.currentProject,
                    audioFile: a.audioFile,
                  })
                );
              } else {
                this.store.dispatch(
                  AnnotationActions.loadAudio.fail({
                    error: 'audio from sessionfile not loaded. Reload needed.',
                  })
                );
              }
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
                'reload audio local',
                ['/intern/transcr/reload-file'],
                AppInfo.queryParamsHandling
              )
              .catch((error) => {
                console.error(error);
              });
          } else {
            // it's an error
            this.modalsService.openErrorModal(a.error);
          }
        })
      ),
    { dispatch: false }
  );

  onTranscriptionEnd$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LoginModeActions.endTranscription.do),
        tap((a) => {
          this.routingService.navigate(
            'end transcription',
            ['/intern/transcr/end'],
            AppInfo.queryParamsHandling
          );
          this.audio.destroy(true);
        })
      ),
    { dispatch: false }
  );

  onQuit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.quit.do),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        if (state.application.mode === LoginMode.ONLINE) {
          if (
            a.freeTask &&
            state.onlineMode.currentSession.currentProject &&
            state.onlineMode.currentSession.task
          ) {
            this.store.dispatch(ApplicationActions.waitForEffects.do());
            return this.apiService
              .freeTask(
                state.onlineMode.currentSession.currentProject.id,
                state.onlineMode.currentSession.task.id
              )
              .pipe(
                map((result) => {
                  if (a.redirectToProjects) {
                    return AnnotationActions.redirectToProjects.do();
                  } else {
                    return AuthenticationActions.logout.do({
                      clearSession: a.clearSession,
                      mode: state.application.mode!,
                    });
                  }
                }),
                catchError((error) =>
                  checkAndThrowError(
                    {
                      statusCode: error.status,
                      message: error.error?.message ?? error.message,
                    },
                    a,
                    AuthenticationActions.logout.do({
                      clearSession: a.clearSession,
                      mode: state.application.mode!,
                    }),
                    this.store,
                    () => {
                      this.alertService.showAlert(
                        'danger',
                        error.error?.message ?? error.message
                      );
                    }
                  )
                )
              );
          } else {
            if (a.redirectToProjects) {
              this.store.dispatch(ApplicationActions.waitForEffects.do());
              return of(AnnotationActions.redirectToProjects.do());
            } else {
              this.store.dispatch(ApplicationActions.waitForEffects.do());
              return this.saveTaskToServer(state, TaskStatus.paused).pipe(
                map(() => {
                  return AuthenticationActions.logout.do({
                    clearSession: a.clearSession,
                    mode: state.application.mode,
                  });
                }),
                catchError(() => {
                  return of(
                    AuthenticationActions.logout.do({
                      clearSession: a.clearSession,
                      mode: state.application.mode,
                    })
                  );
                })
              );
            }
          }
        } else {
          this.store.dispatch(ApplicationActions.waitForEffects.do());
          return of(
            AuthenticationActions.logout.do({
              clearSession: a.clearSession,
              mode: state.application.mode!,
            })
          );
        }
      })
    )
  );

  showNoRemainingTasksModal$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.showNoRemainingTasksModal.do),
        tap((a) => {
          const ref = this.modalsService.openModalRef(
            ErrorModalComponent,
            ErrorModalComponent.options
          );
          (ref.componentInstance as ErrorModalComponent).text =
            this.transloco.translate('projects-list.no remaining tasks');
        })
      ),
    { dispatch: false }
  );

  afterLogoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.logout.success),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          this.audio.destroy(true);
        })
      ),
    { dispatch: false }
  );

  loadSegments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.initTranscriptionService.do),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        this.initMaintenance(state);
        return this.loadSegments(getModeState(state)!, state);
      })
    )
  );

  loadSegmentsSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.initTranscriptionService.success),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          this.routingService.navigate(
            'transcription initialized',
            ['/intern/transcr'],
            AppInfo.queryParamsHandling
          );
        })
      ),
    { dispatch: false }
  );

  initTranscriptService$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.initTranscriptionService.fail),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          this.modalsService.openErrorModal(action.error);
        })
      ),
    { dispatch: false }
  );

  onAudioLoadSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.loadAudio.success),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) =>
        of(
          AnnotationActions.startAnnotation.success({
            task: a.task,
            project: a.currentProject,
            mode: a.mode,
            projectSettings: a.task.tool_configuration?.value,
            guidelines: a.guidelines,
            selectedGuidelines: a.selectedGuidelines,
          })
        )
      )
    )
  );

  onLoadOnlineInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoginModeActions.loadProjectAndTaskInformation.do),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        if (a.mode === LoginMode.ONLINE) {
          return this.apiService.getMyAccountInformation().pipe(
            exhaustMap((currentAccount) => {
              if (!a.taskID || !a.projectID) {
                // user logged in without old annotation
                return of(
                  LoginModeActions.loadProjectAndTaskInformation.success({
                    mode: LoginMode.ONLINE,
                    me: currentAccount,
                    startup: a.startup,
                  })
                );
              }

              return forkJoin({
                currentProject: this.apiService
                  .getProject(a.projectID)
                  .pipe(catchError((b) => of(undefined))),
                task: this.apiService
                  .continueTask(a.projectID, a.taskID)
                  .pipe(catchError((b) => of(undefined))),
              }).pipe(
                map(({ currentProject, task }) => {
                  return LoginModeActions.loadProjectAndTaskInformation.success(
                    {
                      mode: LoginMode.ONLINE,
                      me: currentAccount,
                      currentProject: currentProject ?? undefined,
                      task: task ?? undefined,
                      startup: a.startup,
                    }
                  );
                }),
                catchError((error: HttpErrorResponse) => {
                  return checkAndThrowError(
                    {
                      statusCode: error.status,
                      message: error.error?.message ?? error.message,
                    },
                    a,
                    LoginModeActions.loadProjectAndTaskInformation.fail({
                      error,
                    }),
                    this.store,
                    () => {
                      this.alertService.showAlert(
                        'danger',
                        error.error?.message ?? error.message
                      );
                    }
                  );
                })
              );
            }),
            catchError((error) => {
              if (!a.startup) {
                return checkAndThrowError(
                  {
                    statusCode: error.status,
                    message: error.error?.message ?? error.message,
                  },
                  a,
                  LoginModeActions.loadProjectAndTaskInformation.fail({
                    error,
                  }),
                  this.store,
                  () => {
                    this.alertService.showAlert(
                      'danger',
                      error.error?.message ?? error.message
                    );
                  }
                );
              } else {
                // ignore
                return of(
                  LoginModeActions.loadProjectAndTaskInformation.success({
                    startup: true,
                  })
                );
              }
            })
          );
        } else if (
          [LoginMode.DEMO, LoginMode.LOCAL, LoginMode.URL].includes(a.mode)
        ) {
          // mode is not online => load configuration for local environment
          return forkJoin<
            [
              any,
              (
                | {
                    language: string;
                    json: any;
                  }
                | undefined
              )[],
              any
            ]
          >([
            this.http.get('config/localmode/projectconfig.json', {
              responseType: 'json',
            }),
            forkJoin(
              state.application.appConfiguration!.octra.languages.map(
                (b: string) =>
                  this.http
                    .get(`config/localmode/guidelines/guidelines_${b}.json`, {
                      responseType: 'json',
                    })
                    .pipe(
                      map((c) => ({
                        language: b,
                        json: c,
                      })),
                      catchError(() => of(undefined))
                    )
              )
            ),
            this.http.get('config/localmode/functions.js', {
              responseType: 'text',
            }),
          ]).pipe(
            exhaustMap(([projectConfig, guidelines, functions]) => {
              const currentProject = createSampleProjectDto('1234');

              const observables: Observable<{
                inputs: TaskInputOutputDto[];
              }>[] = [];

              if (a.mode === LoginMode.DEMO) {
                observables.push(
                  of({
                    inputs: state.application
                      .appConfiguration!.octra.audioExamples.map((a) => {
                        return {
                          id: Date.now().toString(),
                          filename: FileInfo.fromURL(a.url).fullname,
                          fileType: 'audio/wave',
                          chain_position: 0,
                          type: 'input',
                          url: a.url,
                          creator_type: TaskInputOutputCreatorType.user,
                          content: '',
                          content_type: '',
                        };
                      })
                      .slice(0, 1),
                  })
                );
              } else if (a.mode === LoginMode.LOCAL) {
                observables.push(
                  of({
                    inputs: [
                      {
                        id: Date.now().toString(),
                        filename: state.localMode.sessionFile?.name,
                        fileType: state.localMode.sessionFile?.type,
                        chain_position: 0,
                        type: 'input',
                        creator_type: TaskInputOutputCreatorType.user,
                        content: '',
                        content_type: '',
                      },
                    ],
                  })
                );
              } else if (a.mode === LoginMode.URL) {
                // URL mode
                const urlInfo: {
                  audio: {
                    url?: string;
                    fileInfo?: FileInfo;
                  };
                  transcript: {
                    url?: string;
                    fileInfo?: FileInfo;
                  };
                } = {
                  audio: {
                    url: undefined,
                    fileInfo: undefined,
                  },
                  transcript: {
                    url: undefined,
                    fileInfo: undefined,
                  },
                };
                urlInfo.audio.url = this.routingService.staticQueryParams
                  .audio_url
                  ? decodeURIComponent(
                      this.routingService.staticQueryParams.audio_url
                    )
                  : undefined;
                urlInfo.transcript.url = this.routingService.staticQueryParams
                  .transcript
                  ? decodeURIComponent(
                      this.routingService.staticQueryParams.transcript
                    )
                  : undefined;

                for (const key of Object.keys(urlInfo)) {
                  if (urlInfo[key].url) {
                    let mediaType: string | undefined =
                      key === 'audio'
                        ? this.routingService.staticQueryParams.audio_type
                        : undefined;
                    let decodedURL = decodeURIComponent(urlInfo[key].url);

                    if (decodedURL.includes('?')) {
                      const regex = /mediatype=([^&]+)/g;
                      const matches = regex.exec(decodedURL);
                      mediaType = matches ? matches[1] : mediaType;
                      decodedURL = decodedURL.replace(/\?.*$/g, '');
                    }

                    const nameFromURL = extractFileNameFromURL(decodedURL);

                    let extension = '';
                    if (nameFromURL.extension) {
                      extension = nameFromURL.extension;
                    } else {
                      if (mediaType) {
                        if (mediaType.includes('audio')) {
                          extension = '.wav';
                        } else if (mediaType.includes('text')) {
                          extension = '.txt';
                        } else if (mediaType.includes('json')) {
                          extension = '_annot.json';
                        }
                      }
                    }

                    if (!mediaType) {
                      mediaType = mime.getType(extension);
                    }

                    urlInfo[key].url = decodedURL;
                    urlInfo[key].fileInfo = FileInfo.fromURL(
                      decodedURL,
                      mediaType,
                      key === 'audio' &&
                        this.routingService.staticQueryParams.audio_name
                        ? this.routingService.staticQueryParams.audio_name
                        : `${nameFromURL.name}${extension}`
                    );
                  }
                }

                observables.push(
                  forkJoin<[{ progress: number; result?: string }]>([
                    urlInfo.transcript.url
                      ? this.http
                          .get(urlInfo.transcript.url, {
                            responseType: 'text',
                          })
                          .pipe(
                            map((result) => ({
                              progress: 1,
                              result,
                            }))
                          )
                      : of({ progress: 1, result: undefined }),
                  ]).pipe(
                    exhaustMap(([event]) => {
                      const inputs: TaskInputOutputDto[] = [
                        {
                          id: Date.now().toString(),
                          filename: urlInfo.audio.fileInfo.fullname,
                          fileType: urlInfo.audio.fileInfo.type,
                          chain_position: 0,
                          type: 'input',
                          url: urlInfo.audio.url,
                          creator_type: TaskInputOutputCreatorType.user,
                          content: undefined,
                          content_type: undefined,
                        },
                      ];

                      if (urlInfo.transcript.url) {
                        inputs.push({
                          id: Date.now().toString(),
                          filename: urlInfo.transcript.fileInfo.fullname,
                          fileType: urlInfo.transcript.fileInfo.type,
                          chain_position: 0,
                          type: 'input',
                          url: urlInfo.transcript.url,
                          creator_type: TaskInputOutputCreatorType.user,
                          content: event.result ?? '',
                          content_type: '',
                        });
                      }

                      return of({
                        inputs,
                      });
                    })
                  )
                );
              }

              return forkJoin(observables).pipe(
                map(
                  ([event]) => {
                    const task = createSampleTask(
                      a.taskID ?? '-1',
                      event.inputs,
                      [],
                      projectConfig,
                      functions,
                      guidelines,
                      {
                        orgtext:
                          LoginMode.DEMO === state.application.mode!
                            ? state.application.appConfiguration!.octra
                                .audioExamples[0].description
                            : '',
                      }
                    );

                    return LoginModeActions.loadProjectAndTaskInformation.success(
                      {
                        mode: a.mode,
                        me: createSampleUser(),
                        currentProject,
                        task,
                        startup: a.startup,
                      }
                    );
                  },
                  catchError((e) => {
                    if (e instanceof HttpErrorResponse) {
                      alert(`Can't load transcript file: ${e.message}`);
                      return of(
                        LoginModeActions.loadProjectAndTaskInformation.fail(e)
                      );
                    }
                    return of();
                  })
                )
              );
            })
          );
        }

        // no mode set
        return of(
          LoginModeActions.loadProjectAndTaskInformation.success({
            startup: true,
          })
        );
      })
    )
  );

  combinePhrases$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.combinePhrases.do),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        const modeState = getModeState(state)!;

        if (
          modeState.transcript.currentLevel &&
          modeState.transcript.currentLevel.type === 'SEGMENT'
        ) {
          let transcript = modeState.transcript.clone();
          let currentLevel: OctraAnnotationSegmentLevel<OctraAnnotationSegment> =
            modeState.transcript.currentLevel.clone() as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;
          const breakMarker =
            modeState.guidelines?.selected?.json?.markers?.find(
              (a) => a.type === 'break'
            );

          const maxWords = action.options.maxWordsPerSegment;
          const minSilenceLength = action.options.minSilenceLength;
          const isSilence = (segment: OctraAnnotationSegment) => {
            return (
              segment.getFirstLabelWithoutName('Speaker')?.value.trim() ===
                '' ||
              segment.getFirstLabelWithoutName('Speaker')?.value.trim() ===
                breakMarker?.code ||
              segment.getFirstLabelWithoutName('Speaker')?.value.trim() ===
                '<p:>' ||
              segment.getFirstLabelWithoutName('Speaker')?.value.trim() ===
                breakMarker?.code
            );
          };

          const countWords = (text: string) => {
            return text.trim().split(' ').length;
          };

          let wordCounter = 0;

          for (let i = 0; i < currentLevel.items.length; i++) {
            const segment = currentLevel.items[i];

            let startPos = 0;
            if (i > 0) {
              startPos = currentLevel.items[i - 1].time.unix;
            }
            let duration = segment.time.unix - startPos;
            if (!isSilence(segment) || duration < minSilenceLength) {
              if (maxWords > 0 && wordCounter >= maxWords) {
                wordCounter = isSilence(segment)
                  ? 0
                  : countWords(
                      segment.getFirstLabelWithoutName('Speaker')?.value ?? ''
                    );
              } else {
                if (i > 0) {
                  const lastSegment = currentLevel.items[i - 1];
                  startPos = 0;
                  if (i > 1) {
                    startPos = currentLevel.items[i - 2].time.unix;
                  }
                  duration = lastSegment.time.unix - startPos;
                  if (!isSilence(lastSegment) || duration < minSilenceLength) {
                    let lastSegmentText =
                      lastSegment.getFirstLabelWithoutName('Speaker')?.value;
                    let segmentText =
                      segment.getFirstLabelWithoutName('Speaker')?.value;

                    if (isSilence(lastSegment)) {
                      lastSegmentText = '';
                    }

                    if (!isSilence(segment)) {
                      segment.changeFirstLabelWithoutName(
                        'Speaker',
                        `${lastSegmentText} ${segmentText}`
                      );
                      wordCounter = countWords(
                        `${lastSegmentText} ${segmentText}`
                      );
                    } else {
                      segmentText = '';
                      segment.changeFirstLabelWithoutName(
                        'Speaker',
                        `${lastSegmentText}`
                      );
                    }
                    transcript = transcript!.removeItemByIndex(
                      i - 1,
                      '',
                      false,
                      (transcript: string) => {
                        return tidyUpAnnotation(
                          transcript,
                          modeState.guidelines.selected.json
                        );
                      }
                    );
                    currentLevel = transcript.currentLevel as any;
                    i--;
                  }
                }
              }
            }
          }
          return of(
            AnnotationActions.combinePhrases.success({
              mode: state.application.mode!,
              transcript,
            })
          );
        }
        return of(
          AnnotationActions.combinePhrases.fail({
            error:
              "Can't combine phrases: current level must be of type SEGMENT.",
          })
        );
      })
    )
  );

  onAnnotationSend$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.sendOnlineAnnotation.do),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        if (state.application.mode === LoginMode.ONLINE) {
          this.transcrSendingModal.timeout = timer(2000).subscribe({
            next: () => {
              this.transcrSendingModal.ref = this.modalsService.openModalRef(
                TranscriptionSendingModalComponent,
                TranscriptionSendingModalComponent.options
              );
              this.transcrSendingModal.ref.componentInstance.error =
                this.transcrSendingModal.error ?? '';
            },
          });

          if (
            !state.onlineMode.currentSession.currentProject ||
            !state.onlineMode.currentSession.task?.id
          ) {
            return of(
              AnnotationActions.sendOnlineAnnotation.fail({
                mode: state.application.mode!,
                error: 'Current project or current task is undefined',
              })
            );
          }

          return this.saveTaskToServer(state, TaskStatus.finished).pipe(
            map((a) => {
              return AnnotationActions.sendOnlineAnnotation.success({
                mode: state.application.mode!,
                task: a!,
              });
            }),
            catchError((error: HttpErrorResponse) => {
              if (error.status === 401) {
                this.transcrSendingModal.timeout?.unsubscribe();
              }

              return checkAndThrowError(
                {
                  statusCode: error.status,
                  message: error.error?.message ?? error.message,
                },
                a,
                AnnotationActions.sendOnlineAnnotation.fail({
                  mode: state.application.mode!,
                  error: error.error?.message ?? error.message,
                }),
                this.store,
                () => {
                  if (this.transcrSendingModal.ref) {
                    this.transcrSendingModal.ref.componentInstance.error =
                      error.error?.message ?? error.message;
                  }
                }
              );
            })
          );
        }

        return of(
          AnnotationActions.sendOnlineAnnotation.fail({
            mode: state.application.mode!,
            error: 'Not implemented',
          })
        );
      })
    )
  );

  sendAnnotationFail$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.sendOnlineAnnotation.fail),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          this.transcrSendingModal.timeout?.unsubscribe();
          this.transcrSendingModal.ref?.close();

          this.modalsService.openErrorModal(action.error);
        })
      ),
    { dispatch: false }
  );

  afterAnnotationSent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.sendOnlineAnnotation.success),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        this.transcrSendingModal.timeout?.unsubscribe();
        this.transcrSendingModal.ref?.close();

        this.alertService.showAlert(
          'success',
          this.transloco.translate('g.submission success'),
          true,
          2000
        );

        this.store.dispatch(ApplicationActions.waitForEffects.do());

        return of(
          LoginModeActions.clearOnlineSession.do({
            mode: a.mode,
            actionAfterSuccess: AnnotationActions.startNewAnnotation.do({
              mode: a.mode,
              project: state.onlineMode.currentSession.currentProject!,
              actionAfterFail: LoginModeActions.endTranscription.do({
                clearSession: true,
                mode: LoginMode.ONLINE,
              }),
            }),
          })
        );
      })
    )
  );

  afterClearOnlineSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoginModeActions.clearOnlineSession.do),
      exhaustMap((a) => {
        this.audio.destroy(true);
        return of(a.actionAfterSuccess);
      })
    )
  );

  onClearWholeSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoginModeActions.clearOnlineSession.do),
      exhaustMap((a) => {
        this.audio.destroy(true);
        return of(a.actionAfterSuccess);
      })
    )
  );

  redirectToProjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.redirectToProjects.do),
      exhaustMap((a) => {
        this.routingService.navigate(
          'redirect to projects after quit',
          ['/intern/projects'],
          AppInfo.queryParamsHandling
        );
        return of(AnnotationActions.redirectToProjects.success());
      })
    )
  );

  resumeTaskManually$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.resumeTaskManually.do),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        const modeState = getModeState(state);

        if (
          modeState?.currentSession?.currentProject &&
          modeState?.currentSession?.task
        ) {
          return of(
            AnnotationActions.prepareTaskDataForAnnotation.do({
              mode: state.application.mode!,
              currentProject: modeState.currentSession.currentProject,
              task: modeState.currentSession.task,
            })
          );
        }

        return of();
      })
    )
  );

  redirectToTranscription$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.redirectToTranscription.do),
        tap((a) => {
          this.routingService.navigate(
            'redirect to transcription loadOnlineInformationAfterIDBLoaded',
            ['/intern/transcr'],
            AppInfo.queryParamsHandling
          );
        })
      ),
    { dispatch: false }
  );

  combinePhrasesSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.combinePhrases.success),
        withLatestFrom(this.store),
        tap(() => {
          this.alertService.showAlert(
            'success',
            this.transloco.translate('tools.alerts.done', {
              value: 'Combine Phrases',
            })
          );
        })
      ),
    { dispatch: false }
  );

  combinePhrasesFailed$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.combinePhrases.fail),
        tap((action) => {
          this.alertService.showAlert(
            'danger',
            this.transloco.translate('tools.alerts.fail', {
              value: 'Combine Phrases',
              error: action.error,
            })
          );
        })
      ),
    { dispatch: false }
  );

  asrRunWordAlignmentSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.updateASRSegmentInformation.do),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        if (
          (action.itemType === ASRQueueItemType.ASRMAUS ||
            action.itemType === ASRQueueItemType.MAUS) &&
          action.result
        ) {
          const segmentBoundary = new SampleUnit(
            action.timeInterval.sampleStart +
              action.timeInterval.sampleLength / 2,
            getModeState(state)!.audio.sampleRate!
          );
          const segmentIndex =
            getModeState(
              state
            )!.transcript.getCurrentSegmentIndexBySamplePosition(
              segmentBoundary
            );

          const converter = new PraatTextgridConverter();
          const audioManager = this.audio.audioManager;
          const audiofile = audioManager.resource.getOAudioFile();
          audiofile.name = `OCTRA_ASRqueueItem_${segmentIndex}.wav`;

          if (action.result) {
            const convertedResult = converter.import(
              {
                name: `OCTRA_ASRqueueItem_${segmentIndex}.TextGrid`,
                content: action.result,
                type: 'text',
                encoding: 'utf-8',
              },
              audiofile
            );

            if (convertedResult?.annotjson) {
              const wordsTier = convertedResult.annotjson.levels.find(
                (a: any) => {
                  return a.name === 'ORT-MAU';
                }
              );

              if (wordsTier !== undefined) {
                let counter = 0;

                if (segmentIndex < 0) {
                  return of(
                    AnnotationActions.addMultipleASRSegments.fail({
                      error: `could not find segment to be precessed by ASRMAUS!`,
                    })
                  );
                } else {
                  const segmentID =
                    getModeState(state)!.transcript.currentLevel!.items[
                      segmentIndex
                    ].id;
                  const newSegments: OctraAnnotationSegment[] = [];

                  let itemCounter =
                    getModeState(state)?.transcript.idCounters.item ?? 1;

                  for (const wordItem of wordsTier.items as ISegment[]) {
                    const itemEnd =
                      action.timeInterval.sampleStart +
                      action.timeInterval.sampleLength;
                    let wordItemEnd =
                      action.timeInterval.sampleStart +
                      Math.ceil(wordItem.sampleStart + wordItem.sampleDur);
                    wordItemEnd = Math.min(itemEnd, wordItemEnd);

                    if (wordItemEnd >= action.timeInterval.sampleStart) {
                      const readSegment = new OctraAnnotationSegment(
                        itemCounter++,
                        new SampleUnit(
                          wordItemEnd,
                          this.audio.audioManager.resource.info.sampleRate
                        ),
                        wordItem.labels.map((a) =>
                          OLabel.deserialize({
                            ...a,
                            name:
                              a.name === 'ORT-MAU'
                                ? getModeState(state)!.transcript!.currentLevel!
                                    .name!
                                : a.name,
                          })
                        )
                      );

                      const labelIndex = readSegment.labels.findIndex(
                        (a) => a.value === '<p:>' || a.value === ''
                      );

                      if (labelIndex > -1) {
                        readSegment.labels[labelIndex].value =
                          getModeState(
                            state
                          )!.guidelines?.selected?.json.markers.find(
                            (a) => a.type === 'break'
                          )?.code ?? '';
                      }

                      newSegments.push(readSegment);
                      // the last segment is the original segment
                    } else {
                      // tslint:disable-next-line:max-line-length
                      console.error(
                        `Invalid word item boundary:! ${wordItemEnd} <= ${action.timeInterval.sampleStart}`
                      );
                      return of(
                        AnnotationActions.addMultipleASRSegments.fail({
                          error: `wordItem samples are out of the correct boundaries.`,
                        })
                      );
                    }
                    counter++;
                  }
                  return of(
                    AnnotationActions.addMultipleASRSegments.success({
                      mode: state.application.mode!,
                      segmentID,
                      newSegments,
                    })
                  );
                }
              } else {
                return of(
                  AnnotationActions.addMultipleASRSegments.fail({
                    error: 'word tier not found!',
                  })
                );
              }
            } else {
              return of(
                AnnotationActions.addMultipleASRSegments.fail({
                  error: 'importresult ist undefined',
                })
              );
            }
          } else {
            return of(
              AnnotationActions.addMultipleASRSegments.fail({
                error: 'Result is undefined',
              })
            );
          }
        }
        return of();
      })
    )
  );

  private addFunctions(assets: ToolConfigurationAssetDto[]) {
    const functionsObj = assets.find((a) => a.name === 'functions');

    const script = document.createElement('script');
    script.type = 'application/javascript';
    script.id = 'octra_functions';
    if (functionsObj) {
      script.innerHTML = functionsObj.content;
    } else {
      script.innerHTML = `
                  function validateAnnotation(annotation, guidelines) { return []; }
                  function tidyUpAnnotation(annotation, guidelines) { return annotation; }
                `;
    }

    document.head.querySelector('#octra_functions')?.remove();
    document.head.appendChild(script);
  }

  private readGuidelines(
    assets: ToolConfigurationAssetDto[]
  ): GuidelinesItem[] {
    return assets
      .filter((a) => a.name === 'guidelines')
      .map((a) => {
        try {
          return {
            filename: a.filename!,
            name: a.name,
            json:
              typeof a.content === 'string' ? JSON.parse(a.content) : a.content,
            type: a.mime_type,
          };
        } catch (e) {
          return {
            filename: a.filename!,
            name: a.name,
            json: undefined,
            type: a.mime_type,
          };
        }
      });
  }

  private loadSegments(modeState: AnnotationState, rootState: RootState) {
    try {
      let feedback: FeedBackForm | undefined = undefined;
      if (
        modeState.transcript.levels === undefined ||
        modeState.transcript.levels.length === 0
      ) {
        // create new annotation
        let newAnnotation = new OctraAnnotation();

        if (
          rootState.application.mode === LoginMode.ONLINE ||
          rootState.application.mode === LoginMode.URL
        ) {
          let annotResult: ImportResult | undefined;
          const task: TaskDto | undefined = modeState.currentSession?.task;

          // import logs
          this.store.dispatch(
            AnnotationActions.saveLogs.do({
              logs:
                modeState.logging.logs && modeState.logging.logs.length > 0
                  ? modeState.logging.logs
                  : task?.log ?? [],
              mode: rootState.application.mode,
            })
          );

          const importResult = task
            ? findCompatibleFileFromIO<
                | {
                    annotjson: OAnnotJSON;
                    converter?: string;
                  }
                | undefined
              >(task, 'transcript', (io: TaskInputOutputDto) => {
                return isValidAnnotation(
                  io,
                  this.audio.audioManager.resource.getOAudioFile()
                );
              })
            : undefined;

          if (importResult?.annotjson) {
            // import server transcript
            this.store.dispatch(
              LoginModeActions.setImportConverter.do({
                mode: rootState.application.mode,
                importConverter: importResult?.converter,
              })
            );
            newAnnotation = OctraAnnotation.deserialize(
              importResult?.annotjson
            );
          }

          if (newAnnotation.levels.length === 0) {
            const level = newAnnotation.createSegmentLevel('OCTRA_1');
            level.items.push(
              newAnnotation.createSegment(
                this.audio.audioManager.resource.info.duration,
                [
                  new OLabel('OCTRA_1', ''), // empty transcript
                ]
              )
            );
            newAnnotation.addLevel(level);
            newAnnotation.changeLevelIndex(0);
          } else {
            const currentLevelIndex =
              modeState.previousCurrentLevel === undefined ||
              modeState.previousCurrentLevel === null ||
              modeState.previousCurrentLevel >= newAnnotation.levels.length
                ? Math.max(
                    0,
                    newAnnotation.levels.findIndex((a) => a.type === 'SEGMENT')
                  )
                : modeState.previousCurrentLevel;

            newAnnotation.changeCurrentLevelIndex(currentLevelIndex);
          }
        } else {
          // not URL oder ONLINE MODE, Annotation is null

          const level = newAnnotation.createSegmentLevel('OCTRA_1');
          level.items.push(
            newAnnotation.createSegment(
              this.audio.audioManager.resource.info.duration,
              [
                new OLabel('OCTRA_1', ''), // empty transcript
              ]
            )
          );
          newAnnotation.addLevel(level);
          newAnnotation.changeLevelIndex(0);

          const projectSettings =
            getModeState(rootState)!.currentSession.task!.tool_configuration!
              .value;
          if (projectSettings?.feedback_form) {
            feedback = FeedBackForm.fromAny(
              projectSettings.feedback_form,
              modeState.currentSession.comment ?? ''
            );
          }
          if (feedback) {
            feedback?.importData(feedback);

            if (modeState.currentSession.comment !== undefined) {
              feedback.comment = modeState.currentSession.comment;
            }
          }

          if (this.appStorage.logs === undefined) {
            this.appStorage.clearLoggingDataPermanently();
            this.uiService.elements = [];
          } else if (Array.isArray(this.appStorage.logs)) {
            this.uiService.fromAnyArray(this.appStorage.logs);
          }

          this.uiService.addElementFromEvent(
            'octra',
            { value: AppInfo.BUILD.version },
            Date.now(),
            undefined,
            undefined,
            undefined,
            undefined,
            'version'
          );
        }

        if (
          rootState.application.options.showFeedbackNotice &&
          this.apiService.appProperties?.send_feedback
        ) {
          this.modalsService.openFeedbackNoticeModal();
        }

        // new annotation set
        return of(
          AnnotationActions.initTranscriptionService.success({
            mode: rootState.application.mode!,
            transcript: newAnnotation,
            feedback,
            saveToDB: true,
          })
        );
      }

      const transcript = modeState.transcript.changeSampleRate(
        this.audio.audioManager.resource.info.sampleRate
      );

      const currentLevelIndex =
        modeState.previousCurrentLevel === undefined ||
        modeState.previousCurrentLevel === null ||
        modeState.previousCurrentLevel >= transcript.levels.length
          ? Math.max(
              0,
              transcript.levels.findIndex((a) => a.type === 'SEGMENT')
            )
          : modeState.previousCurrentLevel;
      transcript.changeCurrentLevelIndex(currentLevelIndex);

      if (
        rootState.application.options.showFeedbackNotice &&
        this.apiService.appProperties?.send_feedback
      ) {
        this.modalsService.openFeedbackNoticeModal();
      }

      return of(
        AnnotationActions.initTranscriptionService.success({
          mode: rootState.application.mode!,
          feedback,
          transcript,
          saveToDB: false,
        })
      );
    } catch (e: any) {
      return of(
        AnnotationActions.initTranscriptionService.fail({
          error: typeof e === 'string' ? e : e?.message,
        })
      );
    }
  }

  levelIndexChange$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.setLevelIndex.do),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          this.uiService.addElementFromEvent(
            'level',
            { value: 'changed' },
            Date.now(),
            this.audio.audioManager.createSampleUnit(0),
            undefined,
            undefined,
            undefined,
            getModeState(state)?.transcript?.levels[action.currentLevelIndex]
              ?.name
          );
        })
      ),
    { dispatch: false }
  );

  public initMaintenance(state: RootState) {
    if (
      state.application.appConfiguration !== undefined &&
      hasProperty(
        state.application.appConfiguration.octra,
        'maintenanceNotification'
      ) &&
      state.application.appConfiguration.octra.maintenanceNotification
        .active === 'active'
    ) {
      const maintenanceAPI = new MaintenanceAPI(
        state.application.appConfiguration.octra.maintenanceNotification.apiURL,
        this.http
      );

      maintenanceAPI
        .readMaintenanceNotifications(24)
        .then((notification) => {
          // only check in interval if there is a pending maintenance in the next 24 hours
          if (notification !== undefined) {
            const readNotification = () => {
              // notify after 15 minutes one hour before the maintenance begins
              maintenanceAPI
                .readMaintenanceNotifications(1)
                .then((notification2) => {
                  if (notification2 !== undefined) {
                    this.alertService.showAlert(
                      'warning',
                      '⚠️ ' +
                        this.transloco.translate('maintenance.in app', {
                          start: DateTime.fromISO(notification.begin)
                            .setLocale(this.appStorage.language)
                            .toLocaleString(DateTime.DATETIME_SHORT),
                          end: DateTime.fromISO(notification.end)
                            .setLocale(this.appStorage.language)
                            .toLocaleString(DateTime.DATETIME_SHORT),
                        }),
                      true,
                      60
                    );
                  }
                })
                .catch(() => {
                  // ignore
                });
            };

            if (this.maintenanceChecker !== undefined) {
              this.maintenanceChecker.unsubscribe();
            }

            // run each 15 minutes
            this.maintenanceChecker = interval(15 * 60000).subscribe(
              readNotification
            );
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }

  private saveTaskToServer(
    state: RootState,
    status: TaskStatus
  ): Observable<TaskDto | undefined> {
    if (!this.audio.audioManager?.resource) {
      return of(undefined);
    }

    const result = new AnnotJSONConverter().export(
      state.onlineMode.transcript
        .clone()
        .serialize(
          this.audio.audioManager.resource.info.fullname,
          this.audio.audioManager.resource.info.sampleRate,
          this.audio.audioManager.resource.info.duration.clone()
        )
    )?.file?.content;

    const outputs = result
      ? [
          new File(
            [result],
            state.onlineMode.audio.fileName.substring(
              0,
              state.onlineMode.audio.fileName.lastIndexOf('.')
            ) + '_annot.json',
            {
              type: 'application/json',
            }
          ),
        ]
      : [];

    return this.apiService.saveTask(
      state.onlineMode.currentSession!.currentProject!.id,
      state.onlineMode.currentSession!.task!.id,
      {
        assessment: state.onlineMode.currentSession.assessment,
        comment: state.onlineMode.currentSession.comment,
        status,
      },
      state.onlineMode.logging.logs
        ? new File(
            [JSON.stringify(state.onlineMode.logging.logs)],
            'log.json',
            {
              type: 'application/json',
            }
          )
        : undefined,
      outputs
    );
  }

  private maintenanceChecker?: Subscription;

  constructor(
    private actions$: Actions,
    private store: Store<RootState>,
    private apiService: OctraAPIService,
    private http: HttpClient,
    private alertService: AlertService,
    private routingService: RoutingService,
    private modalsService: OctraModalService,
    private audio: AudioService,
    private uiService: UserInteractionsService,
    private appStorage: AppStorageService,
    private transloco: TranslocoService
  ) {}
}
