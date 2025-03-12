import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import {
  ASRContext,
  IAnnotJSON,
  OAnnotJSON,
  OctraAnnotation,
  OctraAnnotationSegment,
} from '@octra/annotation';
import { hasProperty } from '@octra/utilities';
import { SessionStorageService } from 'ngx-webstorage';
import {
  catchError,
  exhaustMap,
  filter,
  forkJoin,
  from,
  map,
  mergeAll,
  mergeMap,
  Observable,
  of,
  Subject,
  tap,
  timer,
  withLatestFrom,
} from 'rxjs';
import {
  IIDBApplicationOptions,
  IIDBModeOptions,
} from '../../shared/octra-database';
import { AudioService } from '../../shared/service';
import { ConsoleEntry } from '../../shared/service/bug-report.service';
import { IDBService } from '../../shared/service/idb.service';
import { RoutingService } from '../../shared/service/routing.service';
import { ApplicationActions } from '../application/application.actions';
import { ASRActions } from '../asr/asr.actions';
import { AuthenticationActions } from '../authentication';
import { getModeState, LoginMode, RootState } from '../index';
import { AnnotationState } from '../login-mode/annotation';
import { AnnotationActions } from '../login-mode/annotation/annotation.actions';
import { LoginModeActions } from '../login-mode/login-mode.actions';
import { UserActions } from '../user/user.actions';
import { IDBActions } from './idb.actions';

@Injectable({
  providedIn: 'root',
})
export class IDBEffects {
  loadOptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.initApplication.setSessionStorageOptions),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        return this.idbService
          .initialize(state.application.appConfiguration!.octra.database.name)
          .pipe(
            map(() => {
              this.store.dispatch(
                IDBActions.loadImportOptions.do({
                  mode: LoginMode.LOCAL,
                }),
              );
              this.store.dispatch(
                IDBActions.loadImportOptions.do({
                  mode: LoginMode.ONLINE,
                }),
              );
              this.store.dispatch(
                IDBActions.loadImportOptions.do({
                  mode: LoginMode.DEMO,
                }),
              );
              this.store.dispatch(
                IDBActions.loadImportOptions.do({
                  mode: LoginMode.URL,
                }),
              );
              return forkJoin<
                [
                  IIDBApplicationOptions,
                  IIDBModeOptions,
                  IIDBModeOptions,
                  IIDBModeOptions,
                  IIDBModeOptions,
                ]
              >([
                this.idbService.loadOptions([
                  'version',
                  'easyMode',
                  'language',
                  'useMode',
                  'showMagnifier',
                  'secondsPerLine',
                  'audioSettings',
                  'highlightingEnabled',
                  'editorFont',
                  'playOnHover',
                  'followPlayCursor',
                  'showFeedbackNotice',
                  'userProfile',
                  'asr',
                ]),
                this.idbService.loadModeOptions(LoginMode.LOCAL),
                this.idbService.loadModeOptions(LoginMode.DEMO),
                this.idbService.loadModeOptions(LoginMode.ONLINE),
                this.idbService.loadModeOptions(LoginMode.URL),
              ]);
            }),
            mergeAll(),
          )
          .pipe(
            map(
              ([
                applicationOptions,
                localOptions,
                demoOptions,
                onlineOptions,
                urlOptions,
              ]) => {
                return IDBActions.loadOptions.success({
                  applicationOptions,
                  localOptions,
                  onlineOptions,
                  demoOptions,
                  urlOptions,
                });
              },
            ),
            catchError((err: string) => {
              console.error(err);

              return of(
                IDBActions.loadOptions.fail({
                  error: err,
                }),
              );
            }),
          );
      }),
    ),
  );

  afterOptionsSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IDBActions.loadOptions.success),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        return forkJoin([
          this.idbService.loadLogs(LoginMode.ONLINE),
          this.idbService.loadLogs(LoginMode.LOCAL),
          this.idbService.loadLogs(LoginMode.DEMO),
          this.idbService.loadLogs(LoginMode.URL),
        ]).pipe(
          map(([onlineModeLogs, localModeLogs, demoModeLogs, urlModeLogs]) => {
            if (this.sessStr.retrieve('last_page_path') !== '/help-tools') {
              if (
                state.application.mode === LoginMode.ONLINE &&
                !this.routingService.staticQueryParams.audio_url
              ) {
                this.store.dispatch(
                  LoginModeActions.loadProjectAndTaskInformation.do({
                    projectID: action.onlineOptions.project?.id,
                    taskID: action.onlineOptions.transcriptID ?? undefined,
                    mode: LoginMode.ONLINE,
                    startup: true,
                  }),
                );
              } else {
                // other modes
                this.store.dispatch(
                  LoginModeActions.loadProjectAndTaskInformation.do({
                    projectID: action.demoOptions?.project?.id ?? '1234',
                    taskID: action.demoOptions?.transcriptID ?? '38295',
                    mode: this.routingService.staticQueryParams.audio_url
                      ? undefined
                      : state.application.mode!,
                    startup: true,
                  }),
                );
              }
            } else {
              this.store.dispatch(ApplicationActions.initApplication.finish());
            }

            return IDBActions.loadLogs.success({
              online: onlineModeLogs,
              demo: demoModeLogs,
              local: localModeLogs,
              url: urlModeLogs,
            });
          }),
        );
      }),
    ),
  );

  loadAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IDBActions.loadAnnotation.do),
      exhaustMap((action) => {
        return forkJoin([
          this.idbService.loadAnnotation(LoginMode.ONLINE),
          this.idbService.loadAnnotation(LoginMode.LOCAL),
          this.idbService.loadAnnotation(LoginMode.DEMO),
        ]).pipe(
          withLatestFrom(this.store),
          map(
            ([[onlineAnnotation, localAnnotation, demoAnnotation], state]) => {
              const deserialize = (json: IAnnotJSON) => {
                const annotation = OAnnotJSON.deserialize(json);
                if (annotation) {
                  const result = OctraAnnotation.deserialize(annotation);
                  result.changeCurrentLevelIndex(0);
                  return result;
                }
                return undefined;
              };

              const oAnnotation =
                deserialize(onlineAnnotation) ??
                new OctraAnnotation<
                  ASRContext,
                  OctraAnnotationSegment<ASRContext>
                >();
              const lAnnotation =
                deserialize(localAnnotation) ??
                new OctraAnnotation<
                  ASRContext,
                  OctraAnnotationSegment<ASRContext>
                >();
              const dAnnotation =
                deserialize(demoAnnotation) ??
                new OctraAnnotation<
                  ASRContext,
                  OctraAnnotationSegment<ASRContext>
                >();

              return IDBActions.loadAnnotation.success({
                online: oAnnotation,
                local: lAnnotation,
                demo: dAnnotation,
                url: new OctraAnnotation<
                  ASRContext,
                  OctraAnnotationSegment<ASRContext>
                >(), // IGNORE
              });
            },
          ),
          catchError((error) => {
            return of(
              IDBActions.loadAnnotation.fail({
                error: error?.message ?? error,
              }),
            );
          }),
        );
      }),
    ),
  );

  saveAfterUndo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.undo),
      withLatestFrom(this.store),
      exhaustMap(([actionData, appState]) => {
        // code for saving to the database
        const modeState = getModeState(appState);

        if (modeState) {
          const links = modeState.transcript.links.map((a) => a.link);

          return this.idbService
            .saveAnnotation(
              appState.application.mode!,
              modeState.transcript.serialize(
                this.audio.audioManager.resource.info.fullname,
                this.audio.audioManager.resource.info.sampleRate,
                this.audio.audioManager.resource.info.duration,
              ),
            )
            .pipe(
              map(() => ApplicationActions.undoSuccess()),
              catchError((error) => {
                return of(
                  ApplicationActions.undoFailed({
                    error,
                  }),
                );
              }),
            );
        } else {
          return of(
            ApplicationActions.undoFailed({
              error: "Can't find modeState",
            }),
          );
        }
      }),
    ),
  );

  saveAfterRedo = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.redo),
      withLatestFrom(this.store),
      mergeMap(([actionData, appState]: [Action, RootState]) => {
        // code for saving to the database
        const modeState = getModeState(appState);

        if (modeState) {
          return this.idbService
            .saveAnnotation(
              appState.application.mode!,
              modeState.transcript.serialize(
                this.audio.audioManager.resource.info.fullname,
                this.audio.audioManager.resource.info.sampleRate,
                this.audio.audioManager.resource.info.duration,
              ),
            )
            .pipe(
              map(() => ApplicationActions.redoSuccess()),
              catchError((error) => {
                return of(
                  ApplicationActions.redoFailed({
                    error,
                  }),
                );
              }),
            );
        } else {
          return of(
            ApplicationActions.undoFailed({
              error: "Can't find modeState",
            }),
          );
        }
      }),
    ),
  );

  clearLogs$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (a) =>
          a.type === AnnotationActions.clearLogs.do.type ||
          a.type === LoginModeActions.clearOnlineSession.do.type,
      ),
      exhaustMap((action) =>
        this.idbService.clearLoggingData((action as any).mode).pipe(
          map(() => IDBActions.clearLogs.success((action as any).mode)),
          catchError((error) => {
            return of(
              IDBActions.clearLogs.fail({
                error,
              }),
            );
          }),
        ),
      ),
    ),
  );

  clearAllOptions$ = createEffect(() =>
    this.actions$.pipe(
      filter((a) => a.type === IDBActions.clearAllOptions.do.type),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .clearOptions()
          .then(() => {
            subject.next(IDBActions.clearAllOptions.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.clearAllOptions.fail({
                error,
              }),
            );
            subject.complete();
          });

        return subject;
      }),
    ),
  );

  clearAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (action) =>
          action.type === AnnotationActions.clearAnnotation.do.type ||
          action.type === LoginModeActions.clearOnlineSession.do.type ||
          action.type === AuthenticationActions.logout.success.type ||
          action.type === LoginModeActions.endTranscription.do.type,
      ),
      exhaustMap((action) => {
        if (
          hasProperty(action, 'clearSession') &&
          (action as any).clearSession
        ) {
          return forkJoin<{
            annotation: Observable<void>;
            logs: Observable<void>;
          }>({
            annotation: this.idbService.clearAnnotationData(
              (action as any).mode,
            ),
            logs: this.idbService.clearLoggingData((action as any).mode),
          }).pipe(
            map(() => {
              return IDBActions.clearAnnotation.success();
            }),
            catchError((error) => {
              return of(
                IDBActions.clearAnnotation.fail({
                  error,
                }),
              );
            }),
          );
        } else {
          return of(IDBActions.clearAnnotation.success());
        }
      }),
    ),
  );

  logoutSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.logout.success),
      exhaustMap(() => {
        const subject = new Subject<Action>();

        this.sessStr.store('loggedIn', false);
        timer(0).subscribe(() => {
          subject.next(IDBActions.logoutSession.success());
          subject.complete();
        });

        return subject;
      }),
    ),
  );

  savemodeOptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AuthenticationActions.logout.success,
        LoginModeActions.changeComment.do,
        LoginModeActions.setFeedback,
        AnnotationActions.setLogging.do,
        AnnotationActions.setCurrentEditor.do,
        AuthenticationActions.loginDemo.success,
        AuthenticationActions.loginURL.success,
        AuthenticationActions.loginLocal.prepare,
        AuthenticationActions.loginLocal.success,
        LoginModeActions.startAnnotation.success,
        ApplicationActions.changeApplicationOption.do,
        LoginModeActions.endTranscription.do,
        AnnotationActions.setLevelIndex.do,
        LoginModeActions.setImportConverter.do,
      ),
      withLatestFrom(this.store),
      mergeMap(([action, appState]) => {
        const modeState = this.getModeStateFromString(
          appState,
          (action as any).mode,
        );

        if (modeState) {
          return this.idbService
            .saveModeOptions((action as any).mode, {
              sessionfile:
                modeState?.sessionFile &&
                Object.keys(modeState.sessionFile).length > 0
                  ? modeState.sessionFile.toAny()
                  : null,
              importConverter: modeState.importConverter,
              currentEditor: modeState.currentEditor ?? null,
              currentLevel: modeState.transcript?.selectedLevelIndex ?? null,
              logging: modeState.logging.enabled ?? null,
              project: modeState.currentSession?.loadFromServer
                ? (modeState.currentSession?.currentProject ?? null)
                : undefined,
              transcriptID: modeState.currentSession?.loadFromServer
                ? (modeState.currentSession?.task?.id ?? null)
                : undefined,
              feedback: modeState.currentSession?.assessment ?? null,
              comment: modeState.currentSession?.comment ?? null,
              user: appState.authentication.me
                ? {
                    id: appState.authentication.me.id,
                    name: appState.authentication.me.username,
                    email: appState.authentication.me.email,
                  }
                : undefined,
            })
            .pipe(
              map(() => {
                return IDBActions.saveModeOptions.success({
                  mode: (action as any).mode,
                });
              }),
              catchError((error) => {
                return of(
                  IDBActions.saveModeOptions.fail({
                    error,
                  }),
                );
              }),
            );
        } else {
          return of(
            IDBActions.saveModeOptions.success({
              mode: (action as any).mode,
            }),
          );
        }
      }),
    ),
  );

  changeApplicationOption$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.changeApplicationOption.do),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        return this.idbService.saveOption(action.name, action.value).pipe(
          map((a) => ApplicationActions.changeApplicationOption.success()),
          catchError((error: Error) =>
            of(
              ApplicationActions.changeApplicationOption.fail({
                error: error?.message ?? error.toString(),
              }),
            ),
          ),
        );
      }),
    ),
  );

  saveUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setUserProfile),
      exhaustMap((action) => {
        return this.idbService
          .saveOption('userProfile', { name: action.name, email: action.email })
          .pipe(
            map(() => IDBActions.saveUserProfile.success()),
            catchError((error: Error) => {
              return of(
                IDBActions.saveUserProfile.fail({
                  error: error.message,
                }),
              );
            }),
          );
      }),
    ),
  );

  saveAppLanguage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setAppLanguage),
      exhaustMap((action) => {
        return this.idbService.saveOption('language', action.language).pipe(
          map(() => IDBActions.saveAppLanguage.success()),
          catchError((error: Error) => {
            return of(
              IDBActions.saveAppLanguage.fail({
                error: error.message,
              }),
            );
          }),
        );
      }),
    ),
  );

  saveDBVersion = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setDBVersion),
      exhaustMap((action) => {
        return this.idbService.saveOption('version', action.version).pipe(
          map(() => IDBActions.saveIDBVersion.success()),
          catchError((error: Error) => {
            return of(
              IDBActions.saveIDBVersion.fail({
                error: error.message,
              }),
            );
          }),
        );
      }),
    ),
  );

  saveEasyMode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setEasyMode),
      exhaustMap((action) => {
        return this.idbService.saveOption('easyMode', action.easyMode).pipe(
          map(() => IDBActions.saveEasyMode.success()),
          catchError((error: Error) => {
            return of(
              IDBActions.saveEasyMode.fail({
                error: error.message,
              }),
            );
          }),
        );
      }),
    ),
  );

  saveHighlightingEnabled$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setHighlightingEnabled),
      exhaustMap((action) => {
        return this.idbService
          .saveOption('highlightingEnabled', action.highlightingEnabled)
          .pipe(
            map(() => IDBActions.saveHighlightingEnabled.success()),
            catchError((error: Error) => {
              return of(
                IDBActions.saveHighlightingEnabled.fail({
                  error: error.message,
                }),
              );
            }),
          );
      }),
    ),
  );

  saveLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          AuthenticationActions.loginLocal.success,
          AuthenticationActions.loginDemo.success,
          AuthenticationActions.loginOnline.success,
        ),
        tap(async (action) => {
          this.sessStr.store('loggedIn', true);
          await this.idbService.saveOption('useMode', action.mode);
        }),
      ),
    { dispatch: false },
  );

  saveLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.logout.success),
      exhaustMap((action) => {
        this.sessStr.store('loggedIn', false);
        return this.idbService.saveOption('useMode', undefined).pipe(
          map(() => IDBActions.saveLogout.success()),
          catchError((error: Error) => {
            return of(
              IDBActions.saveLogout.fail({
                error: error.message,
              }),
            );
          }),
        );
      }),
    ),
  );

  saveReloaded$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setReloaded),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        try {
          this.sessStr.store('reloaded', action.reloaded);
          setTimeout(() => {
            subject.next(IDBActions.saveAppReloaded.success());
            subject.complete();
          }, 200);
        } catch (error) {
          setTimeout(() => {
            subject.next(
              IDBActions.saveAppReloaded.fail({
                error: error as any,
              }),
            );
            subject.complete();
          }, 200);
        }

        return subject;
      }),
    ),
  );

  saveASRSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.setASRSettings.do),
      withLatestFrom(this.store),
      mergeMap(([, state]) =>
        this.idbService.saveOption('asr', state.asr.settings).pipe(
          map(() => IDBActions.saveASRSettings.success()),
          catchError((error: Error) =>
            of(
              IDBActions.saveASRSettings.fail({
                error: error.message,
              }),
            ),
          ),
        ),
      ),
    ),
  );

  saveAudioSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setAudioSettings),
      exhaustMap((action) => {
        return this.idbService
          .saveOption('audioSettings', {
            volume: action.volume,
            speed: action.speed,
          })
          .pipe(
            map(() => IDBActions.saveAudioSettings.success()),
            catchError((error: Error) => {
              return of(
                IDBActions.saveAudioSettings.fail({
                  error: error.message,
                }),
              );
            }),
          );
      }),
    ),
  );

  saveCurrentEditor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.setCurrentEditor.do),
      exhaustMap((action) => {
        return this.idbService
          .saveOption('interface', action.currentEditor)
          .pipe(
            map(() => IDBActions.saveCurrentEditor.success()),
            catchError((error: Error) => {
              return of(
                IDBActions.saveCurrentEditor.fail({
                  error: error.message,
                }),
              );
            }),
          );
      }),
    ),
  );

  saveLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.saveLogs.do, AnnotationActions.addLog.do),
      withLatestFrom(this.store),
      exhaustMap(([action, appState]: [Action, RootState]) => {
        const modeState = this.getModeStateFromString(
          appState,
          (action as any).mode,
        );

        if (modeState) {
          return this.idbService
            .saveLogs((action as any).mode, modeState.logging.logs)
            .pipe(
              map(() => IDBActions.saveLogs.success()),
              catchError((error) => {
                return of(
                  IDBActions.saveLogs.fail({
                    error,
                  }),
                );
              }),
            );
        } else {
          return of(
            IDBActions.saveLogs.fail({
              error: "Can't find modeState",
            }),
          );
        }
      }),
    ),
  );

  saveAnnotation = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AnnotationActions.changeAnnotationLevel.do,
        AnnotationActions.addAnnotationLevel.do,
        AnnotationActions.removeAnnotationLevel.do,
        AnnotationActions.updateASRSegmentInformation.do,
        AnnotationActions.overwriteTranscript.do,
        AnnotationActions.addCurrentLevelItems.do,
        AnnotationActions.removeCurrentLevelItems.do,
        AnnotationActions.changeCurrentLevelItems.do,
        AnnotationActions.changeCurrentItemById.do,
        AnnotationActions.changeLevelName.do,
        AnnotationActions.duplicateLevel.do,
        AuthenticationActions.loginLocal.prepare,
        AnnotationActions.addMultipleASRSegments.success,
        AnnotationActions.initTranscriptionService.success,
      ),
      withLatestFrom(this.store),
      mergeMap(([action, appState]) => {
        const subject = new Subject<Action>();
        const modeState = this.getModeStateFromString(appState, action.mode);

        if (modeState) {
          return this.idbService
            .saveAnnotation(
              action.mode,
              modeState.transcript.serialize(
                modeState.audio.fileName,
                this.audio.audioManager.resource.info.sampleRate,
                this.audio.audioManager.resource.info.duration,
              ),
            )
            .pipe(
              map(() => IDBActions.saveAnnotation.success()),
              catchError((error) => {
                return of(
                  IDBActions.saveAnnotation.fail({
                    error,
                  }),
                );
              }),
            );
        } else {
          subject.next(
            IDBActions.saveAnnotation.fail({
              error: "Can't find modeState",
            }),
          );
          subject.complete();
        }

        return subject;
      }),
    ),
  );

  loadConsoleEntries$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IDBActions.loadAnnotation.success, IDBActions.loadAnnotation.fail),
      mergeMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .loadConsoleEntries()
          .then((dbEntries: ConsoleEntry[]) => {
            if (dbEntries !== undefined) {
              subject.next(
                IDBActions.loadConsoleEntries.success({
                  consoleEntries: dbEntries,
                }),
              );
            } else {
              subject.next(
                IDBActions.loadConsoleEntries.success({
                  consoleEntries: [],
                }),
              );
            }
          })
          .catch(() => {
            subject.next(
              IDBActions.loadConsoleEntries.success({
                consoleEntries: [],
              }),
            );
          });

        return subject;
      }),
    ),
  );

  loadImportOptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(IDBActions.loadImportOptions.do),
      mergeMap((action) => {
        return from(this.idbService.loadImportOptions(action.mode)).pipe(
          map((importOptions) =>
            IDBActions.loadImportOptions.success({
              mode: action.mode,
              importOptions,
            }),
          ),
        );
      }),
    ),
  );

  saveConsoleEntries$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ApplicationActions.setConsoleEntries),
        tap((action) => {
          if (this.idbService.isReady) {
            this.idbService
              .saveConsoleEntries(action.consoleEntries)
              .then(() => {
                this.store.dispatch(IDBActions.saveConsoleEntries.success());
              })
              .catch((error) => {
                this.store.dispatch(IDBActions.saveConsoleEntries.success());
              });
          }
        }),
      ),
    { dispatch: false },
  );

  saveModeBeforeURLRedirection$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.loginOnline.redirectToURL),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          this.idbService.saveOption('useMode', LoginMode.ONLINE);
        }),
      ),
    { dispatch: false },
  );

  saveImportOptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoginModeActions.changeImportOptions.do),
      exhaustMap((action) =>
        this.idbService
          .saveImportOptions(action.mode, action.importOptions)
          .pipe(map(() => IDBActions.saveImportOptions.success())),
      ),
    ),
  );

  clearAllData$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(IDBActions.clearAllData.do),
        withLatestFrom(this.store),
        tap(([action, state]) => {
          this.sessStr.clear();
          this.idbService.clearAllData().then(() => {
            this.store.dispatch(IDBActions.clearAllData.success());
          });
        }),
      ),
    { dispatch: false },
  );

  constructor(
    private actions$: Actions,
    private idbService: IDBService,
    private sessStr: SessionStorageService,
    private routingService: RoutingService,
    private store: Store<RootState>,
    private audio: AudioService,
  ) {
    actions$.subscribe((action) => {
      if (action.type.toLocaleLowerCase().indexOf('failed') > -1) {
        const errorMessage = (action as any).error;
        console.error(`${action.type}: ${errorMessage}`);
      }
    });
  }

  getModeStateFromString(appState: RootState, mode: LoginMode) {
    let modeState: AnnotationState | undefined = undefined;
    if (mode === 'online') {
      modeState = appState.onlineMode;
    } else if (mode === 'local') {
      modeState = appState.localMode;
    } else if (mode === 'demo') {
      modeState = appState.demoMode;
    } else if (mode === 'url') {
      modeState = appState.urlMode;
    }
    return modeState;
  }
}
