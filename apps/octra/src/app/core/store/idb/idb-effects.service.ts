import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  catchError,
  exhaustMap,
  filter,
  forkJoin,
  map,
  mergeAll,
  mergeMap,
  of,
  Subject,
  tap,
  timer,
  withLatestFrom,
} from 'rxjs';
import { Action, Store } from '@ngrx/store';
import { IDBService } from '../../shared/service/idb.service';
import { getModeState, LoginMode, RootState } from '../index';
import {
  ASRContext,
  IAnnotJSON,
  OAnnotJSON,
  OctraAnnotation,
  OctraAnnotationSegment,
} from '@octra/annotation';
import { SessionStorageService } from 'ngx-webstorage';
import { ConsoleEntry } from '../../shared/service/bug-report.service';
import { AnnotationActions } from '../login-mode/annotation/annotation.actions';
import { IDBActions } from './idb.actions';
import { ApplicationActions } from '../application/application.actions';
import { ASRActions } from '../asr/asr.actions';
import { UserActions } from '../user/user.actions';
import { LoginModeActions } from '../login-mode/login-mode.actions';
import { IIDBModeOptions } from '../../shared/octra-database';
import { hasProperty } from '@octra/utilities';
import { AuthenticationActions } from '../authentication';
import { ASRStateSettings } from '../asr';
import { AnnotationState } from '../login-mode/annotation';
import { AudioService } from '../../shared/service';

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
              return forkJoin<
                [
                  {
                    version?: string;
                    easymode?: boolean;
                    language?: string;
                    usemode?: any;
                    user?: string;
                    showLoupe?: boolean;
                    secondsPerLine?: number;
                    audioSettings?: {
                      volume: number;
                      speed: number;
                    };
                    highlightingEnabled?: boolean;
                    playOnHofer?: boolean;
                    asr?: ASRStateSettings;
                  },
                  IIDBModeOptions,
                  IIDBModeOptions,
                  IIDBModeOptions
                ]
              >([
                this.idbService.loadOptions([
                  'version',
                  'easymode',
                  'language',
                  'usemode',
                  'user',
                  'showLoupe',
                  'secondsPerLine',
                  'audioSettings',
                  'highlightingEnabled',
                  'asr',
                ]),
                this.idbService.loadModeOptions(LoginMode.LOCAL),
                this.idbService.loadModeOptions(LoginMode.DEMO),
                this.idbService.loadModeOptions(LoginMode.ONLINE),
              ]);
            }),
            mergeAll()
          )
          .pipe(
            map(
              ([
                applicationOptions,
                localOptions,
                demoOptions,
                onlineOptions,
              ]) => {
                return IDBActions.loadOptions.success({
                  applicationOptions,
                  localOptions,
                  onlineOptions,
                  demoOptions,
                });
              }
            ),
            catchError((err: string) => {
              return of(
                IDBActions.loadOptions.fail({
                  error: err,
                })
              );
            })
          );
      })
    )
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
        ]).pipe(
          map(([onlineModeLogs, localModeLogs, demoModeLogs]) => {
            if (state.application.loggedIn) {
              if (state.application.mode === LoginMode.ONLINE) {
                if (
                  action.onlineOptions.project &&
                  action.onlineOptions.transcriptID
                ) {
                  this.store.dispatch(
                    LoginModeActions.loadProjectAndTaskInformation.do({
                      projectID: action.onlineOptions.project.id,
                      taskID: action.onlineOptions.transcriptID,
                      mode: LoginMode.ONLINE,
                    })
                  );
                } else {
                  this.store.dispatch(IDBActions.loadAnnotation.do());
                }
              } else if (state.application.mode) {
                // other modes
                this.store.dispatch(
                  LoginModeActions.loadProjectAndTaskInformation.do({
                    projectID: action.demoOptions?.project?.id ?? '1234',
                    taskID: action.demoOptions?.transcriptID ?? '38295',
                    mode: state.application.mode,
                  })
                );
              } else {
                this.store.dispatch(IDBActions.loadAnnotation.do());
              }
            } else {
              this.store.dispatch(IDBActions.loadAnnotation.do());
            }

            return IDBActions.loadLogs.success({
              online: onlineModeLogs,
              demo: localModeLogs,
              local: demoModeLogs,
            });
          })
        );
      })
    )
  );

  loadAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        IDBActions.loadAnnotation.do,
        LoginModeActions.loadProjectAndTaskInformation.success
      ),
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
              });
            }
          ),
          catchError((error) => {
            return of(
              IDBActions.loadAnnotation.fail({
                error: error?.message ?? error,
              })
            );
          })
        );
      })
    )
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
                this.audio.audioManager.resource.info.duration
              )
            )
            .pipe(
              map(() => ApplicationActions.undoSuccess()),
              catchError((error) => {
                return of(
                  ApplicationActions.undoFailed({
                    error,
                  })
                );
              })
            );
        } else {
          return of(
            ApplicationActions.undoFailed({
              error: "Can't find modeState",
            })
          );
        }
      })
    )
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
                this.audio.audioManager.resource.info.duration
              )
            )
            .pipe(
              map(() => ApplicationActions.redoSuccess()),
              catchError((error) => {
                return of(
                  ApplicationActions.redoFailed({
                    error,
                  })
                );
              })
            );
        } else {
          return of(
            ApplicationActions.undoFailed({
              error: "Can't find modeState",
            })
          );
        }
      })
    )
  );

  clearLogs$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (a) =>
          a.type === AnnotationActions.clearLogs.do.type ||
          a.type === AnnotationActions.clearWholeSession.do.type
      ),
      exhaustMap((action) =>
        this.idbService.clearLoggingData((action as any).mode).pipe(
          map(() => IDBActions.clearLogs.success((action as any).mode)),
          catchError((error) => {
            return of(
              IDBActions.clearLogs.fail({
                error,
              })
            );
          })
        )
      )
    )
  );

  clearAllOptions$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (a) =>
          a.type === IDBActions.clearAllOptions.do.type ||
          a.type === LoginModeActions.clearWholeSession.do.type
      ),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .clearOptions((action as any).mode)
          .then(() => {
            subject.next(IDBActions.clearAllOptions.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.clearAllOptions.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  clearAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (action) =>
          action.type === AnnotationActions.clearAnnotation.do.type ||
          action.type === LoginModeActions.clearWholeSession.do.type ||
          action.type === AuthenticationActions.logout.success.type
      ),
      exhaustMap((action) => {
        if (
          !hasProperty(action, 'clearSession') ||
          (action as any).clearSession
        ) {
          return this.idbService.clearAnnotationData((action as any).mode).pipe(
            map(() => IDBActions.clearAnnotation.success()),
            catchError((error) => {
              return of(
                IDBActions.clearAnnotation.fail({
                  error,
                })
              );
            })
          );
        } else {
          return of(IDBActions.clearAnnotation.success());
        }
      })
    )
  );

  /*
  overwriteAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AnnotationActions.overwriteTranscript.do,
        AnnotationActions.initTranscriptionService.success
      ),
      exhaustMap((action) => {
        if (action.saveToDB) {
          return this.idbService.clearAnnotationData((action as any).mode).pipe(
            map(() => IDBActions.overwriteTranscript.success()),
            catchError((error) => {
              return of(
                IDBActions.overwriteTranscript.fail({
                  error,
                })
              );
            })
          );
        } else {
          return of(IDBActions.overwriteTranscript.success());
        }
      })
    )
  );
   */

  /*
      onClearOnlineSession$ = createEffect(() =>
          this.actions$.pipe(
            ofType(OnlineModeActions.clearOnlineSession.do),
            exhaustMap((a) => {
              return forkJoin({
                options: this.idbService.clearOptions()
              })
            })
          )
        );
       */

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
      })
    )
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
        AuthenticationActions.loginLocal.prepare,
        AuthenticationActions.loginLocal.success,
        LoginModeActions.startAnnotation.success,
        AnnotationActions.setLevelIndex.do
      ),
      withLatestFrom(this.store),
      exhaustMap(([action, appState]) => {
        const modeState = this.getModeStateFromString(
          appState,
          (action as any).mode
        );
        if (modeState) {
          return this.idbService
            .saveModeOptions((action as any).mode, {
              sessionfile:
                modeState &&
                modeState.sessionFile &&
                Object.keys(modeState.sessionFile).length > 0
                  ? modeState.sessionFile.toAny()
                  : null,
              currentEditor: modeState.currentEditor ?? null,
              currentLevel: modeState.transcript?.selectedLevelIndex ?? null,
              logging: modeState.logging ?? null,
              project: modeState.currentSession?.loadFromServer
                ? modeState.currentSession?.currentProject ?? null
                : undefined,
              transcriptID: modeState.currentSession?.loadFromServer
                ? modeState.currentSession?.task?.id ?? null
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
                  })
                );
              })
            );
        } else {
          return of(
            IDBActions.saveModeOptions.success({
              mode: (action as any).mode,
            })
          );
        }
      })
    )
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
                })
              );
            })
          );
      })
    )
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
              })
            );
          })
        );
      })
    )
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
              })
            );
          })
        );
      })
    )
  );

  saveShowLoupe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setShowLoupe),
      exhaustMap((action) => {
        return this.idbService.saveOption('showLoupe', action.showLoupe).pipe(
          map(() => IDBActions.saveShowLoupe.success()),
          catchError((error: Error) => {
            return of(
              IDBActions.saveShowLoupe.fail({
                error: error.message,
              })
            );
          })
        );
      })
    )
  );

  saveEasyMode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setEasyMode),
      exhaustMap((action) => {
        return this.idbService.saveOption('easymode', action.easyMode).pipe(
          map(() => IDBActions.saveEasyMode.success()),
          catchError((error: Error) => {
            return of(
              IDBActions.saveEasyMode.fail({
                error: error.message,
              })
            );
          })
        );
      })
    )
  );

  saveSecondsPerLine$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setSecondsPerLine),
      exhaustMap((action) => {
        if (this.idbService.isReady) {
          return this.idbService
            .saveOption('secondsPerLine', action.secondsPerLine)
            .pipe(
              map(() => IDBActions.saveSecondsPerLine.success()),
              catchError((error: Error) => {
                return of(
                  IDBActions.saveSecondsPerLine.fail({
                    error: error.message,
                  })
                );
              })
            );
        }
        return of();
      })
    )
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
                })
              );
            })
          );
      })
    )
  );

  saveLoginDemo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.loginDemo.success),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.sessStr.store('loggedIn', true);

        timer(0)
          .toPromise()
          .then(() => {
            subject.next(IDBActions.saveDemoSession.success());
            subject.complete();
          });

        return subject;
      })
    )
  );

  saveLoggedIn$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          AuthenticationActions.loginOnline.success,
          AuthenticationActions.loginDemo.success
        ),
        tap((a) => {
          this.sessStr.store('loggedIn', true);
        })
      ),
    { dispatch: false }
  );

  saveLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          AuthenticationActions.loginLocal.success,
          AuthenticationActions.loginDemo.success,
          AuthenticationActions.loginOnline.success
        ),
        tap(async (action) => {
          this.sessStr.store('loggedIn', true);
          await this.idbService.saveOption('usemode', action.mode);
        })
      ),
    { dispatch: false }
  );

  saveLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.logout.success),
      exhaustMap((action) => {
        this.sessStr.store('loggedIn', false);
        return this.idbService.saveOption('usemode', undefined).pipe(
          map(() => IDBActions.saveLogout.success()),
          catchError((error: Error) => {
            return of(
              IDBActions.saveLogout.fail({
                error: error.message,
              })
            );
          })
        );
      })
    )
  );

  savePlayOnHover$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setPlayOnHover),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        try {
          this.sessStr.store('playonhover', action.playOnHover);
          setTimeout(() => {
            subject.next(IDBActions.saveFollowPlayCursor.success());
            subject.complete();
          }, 200);
        } catch (error) {
          setTimeout(() => {
            subject.next(
              IDBActions.saveFollowPlayCursor.fail({
                error: error as any,
              })
            );
            subject.complete();
          }, 200);
        }

        return subject;
      })
    )
  );

  saveFollowPlayCursor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setFollowPlayCursor),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        try {
          this.sessStr.store('followplaycursor', action.followPlayCursor);
          setTimeout(() => {
            subject.next(IDBActions.saveFollowPlayCursor.success());
            subject.complete();
          }, 200);
        } catch (error) {
          setTimeout(() => {
            subject.next(
              IDBActions.saveFollowPlayCursor.fail({
                error: error as any,
              })
            );
            subject.complete();
          }, 200);
        }

        return subject;
      })
    )
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
              })
            );
            subject.complete();
          }, 200);
        }

        return subject;
      })
    )
  );

  saveServerDataEntry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoginModeActions.setServerDataEntry),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        try {
          this.sessStr.store('serverDataEntry', action.serverDataEntry);
          setTimeout(() => {
            subject.next(IDBActions.saveServerDataEntry.success());
            subject.complete();
          }, 200);
        } catch (error) {
          setTimeout(() => {
            subject.next(
              IDBActions.saveServerDataEntry.fail({
                error: error as any,
              })
            );
            subject.complete();
          }, 200);
        }

        return subject;
      })
    )
  );

  saveASRSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ASRActions.setSelectedASRInformation.do,
        ASRActions.setASRMausLanguage.do
      ),
      withLatestFrom(this.store),
      mergeMap(([, state]) =>
        this.idbService.saveOption('asr', state.asr.settings).pipe(
          map(() => IDBActions.saveASRSettings.success()),
          catchError((error: Error) =>
            of(
              IDBActions.saveASRSettings.fail({
                error: error.message,
              })
            )
          )
        )
      )
    )
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
                })
              );
            })
          );
      })
    )
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
                })
              );
            })
          );
      })
    )
  );

  saveLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.saveLogs.do, AnnotationActions.addLog.do),
      withLatestFrom(this.store),
      exhaustMap(([action, appState]: [Action, RootState]) => {
        const subject = new Subject<Action>();

        const modeState = this.getModeStateFromString(
          appState,
          (action as any).mode
        );

        if (modeState) {
          return this.idbService
            .saveLogs((action as any).mode, modeState.logs)
            .pipe(
              map(() => IDBActions.saveLogs.success()),
              catchError((error) => {
                return of(
                  IDBActions.saveLogs.fail({
                    error,
                  })
                );
              })
            );
        } else {
          return of(
            IDBActions.saveLogs.fail({
              error: "Can't find modeState",
            })
          );
        }
      })
    )
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
        AuthenticationActions.loginLocal.prepare
      ),
      withLatestFrom(this.store),
      mergeMap(([action, appState]) => {
        const subject = new Subject<Action>();
        const modeState = this.getModeStateFromString(appState, action.mode);

        if (modeState) {
          console.log(`save levels`);
          console.log(modeState.transcript.levels[0]);
          return this.idbService
            .saveAnnotation(
              action.mode,
              modeState.transcript.serialize(
                modeState.audio.fileName,
                this.audio.audioManager.resource.info.sampleRate,
                this.audio.audioManager.resource.info.duration
              )
            )
            .pipe(
              map(() => IDBActions.saveAnnotation.success()),
              catchError((error) => {
                return of(
                  IDBActions.saveAnnotation.fail({
                    error,
                  })
                );
              })
            );
        } else {
          subject.next(
            IDBActions.saveAnnotation.fail({
              error: "Can't find modeState",
            })
          );
          subject.complete();
        }

        return subject;
      })
    )
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
                })
              );
            } else {
              subject.next(
                IDBActions.loadConsoleEntries.success({
                  consoleEntries: [],
                })
              );
            }
          })
          .catch(() => {
            subject.next(
              IDBActions.loadConsoleEntries.success({
                consoleEntries: [],
              })
            );
          });

        return subject;
      })
    )
  );

  saveConsoleEntries$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setConsoleEntries),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        if (this.idbService.isReady) {
          this.idbService
            .saveConsoleEntries(action.consoleEntries)
            .then(() => {
              subject.next(IDBActions.saveConsoleEntries.success());
            })
            .catch((error) => {
              subject.next(IDBActions.saveConsoleEntries.success());
            });
        }

        return subject;
      })
    )
  );

  saveModeBeforeURLRedirection$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.loginOnline.redirectToURL),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          this.idbService.saveOption('usemode', LoginMode.ONLINE);
        })
      ),
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private idbService: IDBService,
    private sessStr: SessionStorageService,
    private store: Store<RootState>,
    private audio: AudioService
  ) {
    // TODO add this as effect
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
    }
    return modeState;
  }
}
