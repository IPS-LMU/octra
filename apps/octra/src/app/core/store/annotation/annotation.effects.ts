import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { TranslocoService } from '@ngneat/transloco';
import {
  catchError,
  exhaustMap,
  forkJoin,
  map,
  of,
  Subscription,
  tap,
  timer,
} from 'rxjs';
import { getModeState, LoginMode, RootState } from '../index';
import { OctraModalService } from '../../modals/octra-modal.service';
import { RoutingService } from '../../shared/service/routing.service';
import { AnnotationActions } from './annotation.actions';
import {
  AudioService,
  TranscriptionService,
  UserInteractionsService,
} from '../../shared/service';
import { withLatestFrom } from 'rxjs/operators';
import { AppInfo } from '../../../app.info';
import {
  AnnotationLevelType,
  AnnotJSONConverter,
  IFile,
  ILink,
  ImportResult,
  OAnnotJSON,
  OAudiofile,
  OIDBLevel,
  OIDBLink,
  OLevel,
} from '@octra/annotation';
import { AppStorageService } from '../../shared/service/appstorage.service';
import {
  CurrentAccountDto,
  ProjectDto,
  TaskDto,
  ToolConfigurationAssetDto,
} from '@octra/api-types';
import { convertFromOIDLevel, GuidelinesItem } from './index';
import { NavbarService } from '../../component/navbar/navbar.service';
import { OnlineModeActions } from '../modes/online-mode/online-mode.actions';
import { AuthenticationActions } from '../authentication';
import { TranscriptionSendingModalComponent } from '../../modals/transcription-sending-modal/transcription-sending-modal.component';
import { NgbModalWrapper } from '../../modals/ng-modal-wrapper';
import { ApplicationActions } from '../application/application.actions';
import { ErrorModalComponent } from '../../modals/error-modal/error-modal.component';

@Injectable()
export class AnnotationEffects {
  transcrSendingModal: {
    ref?: NgbModalWrapper<TranscriptionSendingModalComponent>;
    timeout?: Subscription;
    error?: string;
  } = {};

  startAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.startAnnotation.do),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        // TODO write for Local and URL and DEMO
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
              return AnnotationActions.showNoRemainingTasksModal.do();
            }),
            catchError((error: HttpErrorResponse) => {
              return of(
                AnnotationActions.startAnnotation.fail({
                  error: error.error?.message ?? error.message,
                })
              );
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
          });
        }

        if (
          !task.tool_configuration.assets ||
          task.tool_configuration.assets.length === 0
        ) {
          return AnnotationActions.startAnnotation.fail({
            error: 'Missing tool configuration assets',
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
                  ).exec(a.name) !== null
              );
              selectedGuidelines = found ?? guidelines[0];
            }
          } else {
            selectedGuidelines = guidelines[0];
          }
        }

        return AnnotationActions.startAnnotation.success({
          task,
          project: currentProject,
          mode,
          projectSettings: task.tool_configuration.value,
          guidelines,
          selectedGuidelines,
        });
      })
    )
  );

  onAnnotationStart$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.startAnnotation.success),
        tap((a) => {
          this.transcrService.init();
          this.routingService.navigate(['/load/']);
          this.store.dispatch(
            AnnotationActions.loadAudio.do({
              audioFile: a.task.inputs.find(
                (a) => a.fileType!.indexOf('audio') > -1
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

          let filename = a.audioFile!.filename;
          if (
            state.application.mode === LoginMode.ONLINE ||
            state.application.mode === LoginMode.URL ||
            state.application.mode === LoginMode.DEMO
          ) {
            // online, url or demo
            if (a.audioFile) {
              const src = this.apiService.prepareFileURL(a.audioFile!.url!);
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
                        audioFile: a.audioFile,
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
                  audioFile: a.audioFile,
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
                ['/intern/transcr/reload-file'],
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

  onQuit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.quit.do),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        this.store.dispatch(ApplicationActions.waitForEffects.do());

        if (state.application.mode === LoginMode.ONLINE) {
          if (
            a.freeTask &&
            state.onlineMode.onlineSession.currentProject &&
            state.onlineMode.onlineSession.task
          ) {
            return this.apiService
              .freeTask(
                state.onlineMode.onlineSession.currentProject.id,
                state.onlineMode.onlineSession.task.id
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
                catchError((error) => {
                  // ignore
                  return of(
                    AuthenticationActions.logout.do({
                      clearSession: a.clearSession,
                      mode: state.application.mode!,
                    })
                  );
                })
              );
          } else {
            return of(
              AuthenticationActions.logout.do({
                clearSession: a.clearSession,
                mode: state.application.mode,
              })
            );
          }
        } else {
          return of(
            AnnotationActions.quit.success({
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

  initTranscriptionService$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.initTranscriptionService.do),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          if (
            state.application.mode === LoginMode.URL &&
            state.application.queryParams!.transcript !== undefined
          ) {
            this.transcrService.defaultFontSize = 16;

            // load transcript file via URL
            this.http
              .get(state.application.queryParams!.transcript, {
                responseType: 'text',
              })
              .subscribe({
                next: (res) => {
                  let filename = state.application.queryParams!.transcript;
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
                  oAudioFile.arraybuffer = audioRessource.arraybuffer!;
                  oAudioFile.duration = audioRessource.info.duration.samples;
                  oAudioFile.name = audioRessource.info.fullname;
                  oAudioFile.sampleRate =
                    audioRessource.info.duration.sampleRate;
                  oAudioFile.size = audioRessource.size!;

                  let importResult: ImportResult | undefined;
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
                        console.error(tempImportResult!.error);
                      }
                    }
                  }

                  if (
                    importResult !== undefined &&
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
                    this.navbarService.transcrService = this.transcrService;
                    this.navbarService.uiService = this.uiService;

                    console.log('INIT TRANSCR OKOKOKO');
                    this.routingService.navigate(
                      ['/intern/transcr'],
                      AppInfo.queryParamsHandling
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
              // overwrite with empty level
              this.transcrService.defaultFontSize = 16;

              const newLevels: OIDBLevel[] = [];
              newLevels.push(
                new OIDBLevel(
                  1,
                  new OLevel('OCTRA_1', AnnotationLevelType.SEGMENT),
                  1
                )
              );

              this.appStorage.overwriteAnnotation(newLevels, [], false);
            } else {
              // it's not URL mode
              this.transcrService
                .load(state)
                .then(() => {
                  this.navbarService.transcrService = this.transcrService;
                  this.navbarService.uiService = this.uiService;

                  console.log('INIT TRANSCR OK:');
                  console.log(this.transcrService.currentlevel);
                  this.routingService.navigate(
                    ['/intern/transcr'],
                    AppInfo.queryParamsHandling
                  );
                })
                .catch((err) => {
                  console.error(err);
                });
            }
          }
        })
      ),
    { dispatch: false }
  );

  onAudioLoadSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.loadAudio.success),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          this.store.dispatch(
            AnnotationActions.initTranscriptionService.do({
              mode: state.application.mode!,
            })
          );
        })
      ),
    { dispatch: false }
  );

  onLoadOnlineInfo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OnlineModeActions.loadOnlineInformationAfterIDBLoaded.do),
      exhaustMap((a) => {
        return forkJoin<
          [CurrentAccountDto, ProjectDto | undefined, TaskDto | undefined]
        >(
          this.apiService.getMyAccountInformation(),
          this.apiService
            .getProject(a.projectID)
            .pipe(catchError((a) => of(undefined))),
          this.apiService
            .getTask(a.projectID, a.taskID)
            .pipe(catchError((a) => of(undefined)))
        ).pipe(
          withLatestFrom(this.store),
          map(([[currentAccount, currentProject, task], state]) => {
            if (currentProject && task) {
              if (!a.actionAfterSuccess) {
                // normal load after task start or resuming session
                this.store.dispatch(
                  OnlineModeActions.loadOnlineInformationAfterIDBLoaded.success(
                    {
                      mode: LoginMode.ONLINE,
                      me: currentAccount,
                      currentProject,
                      task,
                    }
                  )
                );
                return OnlineModeActions.prepareTaskDataForAnnotation.do({
                  mode: LoginMode.ONLINE,
                  currentProject,
                  task,
                });
              }

              return OnlineModeActions.loadOnlineInformationAfterIDBLoaded.success(
                {
                  mode: LoginMode.ONLINE,
                  me: currentAccount,
                  currentProject,
                  task,
                  actionAfterSuccess: a.actionAfterSuccess,
                }
              );
            } else {
              return OnlineModeActions.loadOnlineInformationAfterIDBLoaded.success(
                {
                  mode: LoginMode.ONLINE,
                  me: currentAccount,
                  currentProject,
                  task,
                  actionAfterSuccess: a.actionAfterSuccess,
                }
              );
            }
          }),
          catchError((error: HttpErrorResponse) => {
            return of(
              OnlineModeActions.loadOnlineInformationAfterIDBLoaded.fail({
                error,
              })
            );
          })
        );
      })
    )
  );

  // TODO add effect if task and project can't not be loaded
  /*
  onLoadOnlineFailed$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OnlineModeActions.loadOnlineInformationAfterIDBLoaded.fail),
      exhaustMap((a) => {
        return of(
          AuthenticationActions.logout.do({
            message: a.error.message,
            clearSession: true,
            messageType: '',
            mode: LoginMode.ONLINE,
          })
        );
      })
    )
  );
 */

  onAnnotationSend$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.sendAnnotation.do),
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
            !state.onlineMode.onlineSession.currentProject ||
            !state.onlineMode.onlineSession.task?.id
          ) {
            return of(
              AnnotationActions.sendAnnotation.fail({
                error: 'Current project or current task is undefined',
              })
            );
          }
          const result = new AnnotJSONConverter().export(
            new OAnnotJSON(
              state.onlineMode.audio.fileName,
              state.onlineMode.audio.sampleRate,
              state.onlineMode.transcript.levels.map((a) =>
                convertFromOIDLevel(a, a.id)
              ),
              state.onlineMode.transcript.links.map((a) => {
                return {
                  fromID: a.link.fromID,
                  toID: a.link.toID,
                } as ILink;
              })
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

          return this.apiService
            .saveTask(
              state.onlineMode.onlineSession.currentProject.id,
              state.onlineMode.onlineSession.task.id,
              {
                assessment: state.onlineMode.onlineSession.assessment,
                comment: state.onlineMode.onlineSession.comment,
                log: state.onlineMode.logs,
              },
              outputs
            )
            .pipe(
              map((a) => {
                return AnnotationActions.sendAnnotation.success({
                  mode: state.application.mode!,
                  task: a,
                });
              }),
              catchError((error: HttpErrorResponse) => {
                if (this.transcrSendingModal.ref) {
                  this.transcrSendingModal.ref.componentInstance.error =
                    error.error?.message ?? error.message;
                }
                /* TODO if error is because of not busy
                 => select new annotation?
                 */
                return of(
                  AnnotationActions.sendAnnotation.fail({
                    error: error.error?.message ?? error.message,
                  })
                );
              })
            );
        } else {
          // TODO add other modes
        }
        return of(
          AnnotationActions.sendAnnotation.fail({
            error: 'Not implemented',
          })
        );
      })
    )
  );

  afterAnnotationSent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.sendAnnotation.success),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        console.log('Load new annotation...');
        this.transcrSendingModal.timeout?.unsubscribe();
        this.transcrSendingModal.ref?.close();

        return of(
          OnlineModeActions.clearOnlineSession.do({
            mode: a.mode,
            actionAfterSuccess: AnnotationActions.startAnnotation.do({
              mode: a.mode,
              project: state.onlineMode.onlineSession.currentProject!,
            }),
          })
        );
      })
    )
  );

  afterClearOnlineSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OnlineModeActions.clearOnlineSession.do),
      exhaustMap((a) => {
        return of(a.actionAfterSuccess);
      })
    )
  );

  redirectToProjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.redirectToProjects.do),
      exhaustMap((a) => {
        this.routingService.navigate(
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
          modeState?.onlineSession?.currentProject &&
          modeState?.onlineSession?.task
        ) {
          return of(
            AnnotationActions.prepareTaskDataForAnnotation.do({
              mode: state.application.mode!,
              currentProject: modeState.onlineSession.currentProject,
              task: modeState.onlineSession.task,
            })
          );
        }

        return of();
      })
    )
  );

  /**
   exhaustMap((a) => {
  return forkJoin<[void, string?]>([this.apiService.saveMyAccountFieldValues(a.data), this.appService.needsRedirectionTo$.pipe(take(1))]).pipe(
    withLatestFrom(this.store),
    map(([[api, redirection], state]) => {
      if (redirection && redirection !== '') {
        if (isURL(redirection)) {
          document.location.href = redirection;
        } else {
          this.router.navigate([redirection]);
        }
      } else {
        this.alertService.show(this.transloco.translate("g.saving success"), 'success', 3000);
      }

      return AccountsActions.saveCurrentAccountFieldValues.success({
        me: state?.accounts?.me,
      });
    }),
    catchError((err: HttpErrorResponse) => {
      return checkAndThrowError(err, a, AccountsActions.saveCurrentAccountFieldValues.fail(err), this.store, () =>
        this.alertService.show(this.transloco.translate("g.saving failed"), 'danger')
      );
    })
  );
})
   **/

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
            name: a.name,
            json: JSON.parse(a.content),
            type: a.mime_type,
          };
        } catch (e) {
          return {
            name: a.name,
            json: undefined,
            type: a.mime_type,
          };
        }
      });
  }

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
    private navbarService: NavbarService,
    private uiService: UserInteractionsService,
    private appStorage: AppStorageService
  ) {}
}
