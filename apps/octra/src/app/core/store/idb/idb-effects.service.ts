import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AppStorageService } from '../../shared/service/appstorage.service';
import {
  catchError,
  combineLatest,
  forkJoin,
  map,
  mergeAll,
  of,
  Subject,
  tap,
  timer,
} from 'rxjs';
import { Action, Store } from '@ngrx/store';
import { IDBService } from '../../shared/service/idb.service';
import { getModeState, LoginMode, RootState } from '../index';
import { ILevel, ILink, OAnnotJSON, OIDBLink } from '@octra/annotation';
import { SessionStorageService } from 'ngx-webstorage';
import { ConsoleEntry } from '../../shared/service/bug-report.service';
import { AnnotationActions } from '../annotation/annotation.actions';
import { IDBActions } from './idb.actions';
import { ApplicationActions } from '../application/application.actions';
import { ASRActions } from '../asr/asr.actions';
import { UserActions } from '../user/user.actions';
import { OnlineModeActions } from '../modes/online-mode/online-mode.actions';
import { LocalModeActions } from '../modes/local-mode/local-mode.actions';
import { IIDBModeOptions } from '../../shared/octra-database';
import { hasProperty } from '@octra/utilities';
import { exhaustMap, filter, mergeMap, withLatestFrom } from 'rxjs/operators';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { AuthenticationActions } from '../authentication';
import {
  convertFromOIDLevel,
  LocalModeState,
  OnlineModeState,
} from '../annotation';

@Injectable({
  providedIn: 'root',
})
export class IDBEffects {
  loadOptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.loadSettings.success),
      exhaustMap((action) => {
        return this.idbService
          .initialize(action.settings.octra.database.name)
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
                    asr?: {
                      selectedLanguage?: string;
                      selectedService?: string;
                    };
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
            if (
              state.application.loggedIn &&
              action.onlineOptions.project &&
              action.onlineOptions.transcriptID
            ) {
              this.store.dispatch(
                OnlineModeActions.loadOnlineInformationAfterIDBLoaded.do({
                  projectID: action.onlineOptions.project.id,
                  taskID: action.onlineOptions.transcriptID,
                })
              );
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
      ofType(IDBActions.loadLogs.success),
      exhaustMap((action) => {
        return forkJoin([
          this.idbService.loadAnnotation(LoginMode.ONLINE),
          this.idbService.loadAnnotation(LoginMode.LOCAL),
          this.idbService.loadAnnotation(LoginMode.DEMO),
        ]).pipe(
          map(([onlineAnnotation, localAnnotation, demoAnnotation]) => {
            console.log(`results:`);
            console.log(onlineAnnotation);
            let max = 0;
            const convertToStateLevel = (level: ILevel, i: number) => {
              const annotationStateLevel = convertFromOIDLevel(level, i + 1);
              if (!hasProperty(level, 'id')) {
                annotationStateLevel.id = i + 1;
              }

              max = Math.max(annotationStateLevel.id, max);
              return annotationStateLevel;
            };

            const convertLink = (link: ILink, i: number) => {
              if (!hasProperty(link, 'id')) {
                return new OIDBLink(i + 1, link);
              } else {
                return link;
              }
            };

            const oidbOnlineAnnotation = {
              levels: onlineAnnotation?.levels
                ? onlineAnnotation?.levels.map(convertToStateLevel)
                : [],
              links: onlineAnnotation?.links
                ? onlineAnnotation?.links.map(convertLink)
                : [],
              levelCounter: max,
            };

            max = 0;
            const oidbLocalAnnotation = {
              levels: localAnnotation?.levels
                ? localAnnotation?.levels.map(convertToStateLevel)
                : [],
              links: localAnnotation?.links
                ? localAnnotation?.links.map(convertLink)
                : [],
              levelCounter: max,
            };

            max = 0;
            const oidbDemoAnnotation = {
              levels: demoAnnotation?.levels
                ? demoAnnotation?.levels.map(convertToStateLevel)
                : [],
              links: demoAnnotation?.links
                ? demoAnnotation?.links.map(convertLink)
                : [],
              levelCounter: max,
            };

            return IDBActions.loadAnnotation.success({
              online: oidbOnlineAnnotation,
              local: oidbLocalAnnotation,
              demo: oidbDemoAnnotation,
            });
          }),
          catchError((error) => {
            return of(
              IDBActions.loadAnnotation.fail({
                error,
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
      mergeMap(([actionData, appState]: [Action, RootState]) => {
        const subject = new Subject<Action>();
        // code for saving to the database
        console.log(`save after undo`);
        const modeState = getModeState(appState);

        if (modeState) {
          const links = modeState.transcript.links.map((a) => a.link);
          this.idbService
            .saveAnnotation(
              appState.application.mode!,
              new OAnnotJSON(
                modeState.audio.fileName,
                modeState.audio.sampleRate,
                modeState.transcript.levels,
                links
              )
            )
            .then(() => {
              subject.next(ApplicationActions.undoSuccess());
            })
            .catch((error) => {
              subject.next(
                ApplicationActions.undoFailed({
                  error,
                })
              );
            });
        } else {
          subject.next(
            ApplicationActions.undoFailed({
              error: "Can't find modeState",
            })
          );
        }
        return subject;
      })
    )
  );

  saveAfterRedo = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.redo),
      withLatestFrom(this.store),
      mergeMap(([actionData, appState]: [Action, RootState]) => {
        const subject = new Subject<Action>();
        // code for saving to the database
        console.log(`save after redo`);

        const modeState = getModeState(appState);

        if (modeState) {
          const links = modeState.transcript.links.map((a) => a.link);
          this.idbService
            .saveAnnotation(
              appState.application.mode!,
              new OAnnotJSON(
                modeState.audio.fileName,
                modeState.audio.sampleRate,
                modeState.transcript.levels,
                links
              )
            )
            .then(() => {
              subject.next(ApplicationActions.redoSuccess());
            })
            .catch((error) => {
              subject.next(
                ApplicationActions.redoFailed({
                  error,
                })
              );
            });
        } else {
          subject.next(
            ApplicationActions.undoFailed({
              error: "Can't find modeState",
            })
          );
        }

        return subject;
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
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .clearLoggingData((action as any).mode)
          .then(() => {
            subject.next(IDBActions.clearLogs.success((action as any).mode));
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.clearLogs.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  clearAllOptions$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (a) =>
          a.type === IDBActions.clearAllOptions.do.type ||
          a.type === OnlineModeActions.clearWholeSession.do.type
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
          action.type === OnlineModeActions.clearWholeSession.do.type ||
          action.type === AuthenticationActions.logout.success.type
      ),
      exhaustMap((action) => {
        const subject = new Subject<Action>();
        if (
          !hasProperty(action, 'clearSession') ||
          (action as any).clearSession
        ) {
          this.idbService
            .clearAnnotationData((action as any).mode)
            .then(() => {
              subject.next(IDBActions.clearAnnotation.success());
              subject.complete();
            })
            .catch((error) => {
              subject.next(
                IDBActions.clearAnnotation.fail({
                  error,
                })
              );
              subject.complete();
            });
        } else {
          timer(10).subscribe(() => {
            subject.complete();
          });
        }
        return subject;
      })
    )
  );

  overwriteAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.overwriteTranscript.do),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        if (action.saveToDB) {
          this.idbService
            .clearAnnotationData((action as any).mode)
            .then(() => {
              subject.next(IDBActions.overwriteTranscript.success());
              subject.complete();
            })
            .catch((error) => {
              subject.next(
                IDBActions.overwriteTranscript.fail({
                  error,
                })
              );
              subject.complete();
            });
        } else {
          subject.complete();
        }
        return subject;
      })
    )
  );

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
        AuthenticationActions.login.success,
        AuthenticationActions.logout.success,
        OnlineModeActions.setSubmitted,
        OnlineModeActions.changeComment.do,
        OnlineModeActions.setFeedback,
        AnnotationActions.setLogging.do,
        LocalModeActions.login,
        AnnotationActions.setCurrentEditor.do,
        OnlineModeActions.loginDemo,
        OnlineModeActions.startAnnotation.do,
        LocalModeActions.login
      ),
      withLatestFrom(this.store),
      mergeMap(([action, appState]: [Action, RootState]) => {
        const subject = new Subject<Action>();

        const modeState = this.getModeStateFromString(
          appState,
          (action as any).mode
        );
        if (modeState) {
          this.idbService
            .saveModeOptions((action as any).mode, {
              sessionfile: modeState?.sessionFile?.toAny(),
              currentEditor: modeState.currentEditor,
              logging: modeState.logging,
              project: modeState.onlineSession?.currentProject,
              submitted: false, //<- TODO ?
              transcriptID: modeState.onlineSession?.task?.id,
              feedback: modeState.onlineSession?.assessment, // TODO changeTask must be initalized at startup,
              comment: modeState.onlineSession?.comment
            })
            .then(() => {
              subject.next(
                IDBActions.saveModeOptions.success({
                  mode: (action as any).mode,
                })
              );
              subject.complete();
            })
            .catch((error) => {
              subject.next(
                IDBActions.saveModeOptions.fail({
                  error,
                })
              );
              subject.complete();
            });
        }

        return subject;
      })
    )
  );

  saveUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.setUserProfile),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .saveOption('userProfile', { name: action.name, email: action.email })
          .then(() => {
            subject.next(IDBActions.saveUserProfile.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.saveUserProfile.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  saveAppLanguage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setAppLanguage),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .saveOption('language', action.language)
          .then(() => {
            subject.next(IDBActions.saveAppLanguage.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.saveAppLanguage.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  saveDBVersion = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setDBVersion),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .saveOption('version', action.version)
          .then(() => {
            subject.next(IDBActions.saveIDBVersion.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.saveIDBVersion.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  saveShowLoupe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setShowLoupe),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .saveOption('showLoupe', action.showLoupe)
          .then(() => {
            subject.next(IDBActions.saveShowLoupe.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.saveShowLoupe.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  saveEasyMode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setEasyMode),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .saveOption('easymode', action.easyMode)
          .then(() => {
            subject.next(IDBActions.saveEasyMode.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.saveEasyMode.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  saveSecondsPerLine$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setSecondsPerLine),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        if (this.idbService.isReady) {
          this.idbService
            .saveOption('secondsPerLine', action.secondsPerLine)
            .then(() => {
              subject.next(IDBActions.saveSecondsPerLine.success());
              subject.complete();
            })
            .catch((error) => {
              subject.next(
                IDBActions.saveSecondsPerLine.fail({
                  error,
                })
              );
              subject.complete();
            });
        }

        return subject;
      })
    )
  );

  saveHighlightingEnabled$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setHighlightingEnabled),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .saveOption('highlightingEnabled', action.highlightingEnabled)
          .then(() => {
            subject.next(IDBActions.saveHighlightingEnabled.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.saveHighlightingEnabled.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  saveLoginDemo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OnlineModeActions.loginDemo),
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
        ofType(AuthenticationActions.login.success),
        tap(() => {
          this.sessStr.store('loggedIn', true);
        })
      ),
    { dispatch: false }
  );

  saveLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          LocalModeActions.login,
          OnlineModeActions.loginDemo,
          AuthenticationActions.login.success
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
        const subject = new Subject<Action>();

        this.sessStr.store('loggedIn', false);
        const promises: Promise<any>[] = [];
        promises.push(this.idbService.saveOption('usemode', undefined));
        Promise.all(promises)
          .then(() => {
            subject.next(IDBActions.saveLogout.success);
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.saveLogout.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
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
      ofType(OnlineModeActions.setServerDataEntry),
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

  saveASRLanguage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ASRActions.setASRSettings),
      mergeMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .saveOption('asr', {
            selectedLanguage: action.selectedLanguage,
            selectedService: action.selectedService,
          })
          .then(() => {
            subject.next(IDBActions.saveASRSettings.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.saveASRSettings.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  saveAudioSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationActions.setAudioSettings),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .saveOption('audioSettings', {
            volume: action.volume,
            speed: action.speed,
          })
          .then(() => {
            subject.next(IDBActions.saveAudioSettings.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.saveAudioSettings.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  saveCurrentEditor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.setCurrentEditor.do),
      exhaustMap((action) => {
        const subject = new Subject<Action>();

        this.idbService
          .saveOption('interface', action.currentEditor)
          .then(() => {
            subject.next(IDBActions.saveCurrentEditor.success());
            subject.complete();
          })
          .catch((error) => {
            subject.next(
              IDBActions.saveCurrentEditor.fail({
                error,
              })
            );
            subject.complete();
          });

        return subject;
      })
    )
  );

  saveLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.saveLogs.do, AnnotationActions.addLog.do),
      withLatestFrom(this.store),
      mergeMap(([action, appState]: [Action, RootState]) => {
        const subject = new Subject<Action>();

        const modeState = this.getModeStateFromString(
          appState,
          (action as any).mode
        );

        if (modeState) {
          this.idbService
            .saveLogs((action as any).mode, modeState.logs)
            .then(() => {
              subject.next(IDBActions.saveLogs.success());
              subject.complete();
            })
            .catch((error) => {
              subject.next(
                IDBActions.saveLogs.fail({
                  error,
                })
              );
              subject.complete();
            });
        } else {
          subject.next(
            IDBActions.saveLogs.fail({
              error: "Can't find modeState",
            })
          );
          subject.complete();
        }

        return subject;
      })
    )
  );

  saveAnnotation = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AnnotationActions.changeAnnotationLevel.do,
        AnnotationActions.addAnnotationLevel.do,
        AnnotationActions.removeAnnotationLevel.do
      ),
      withLatestFrom(this.store),
      mergeMap(([action, appState]) => {
        const subject = new Subject<Action>();
        const modeState = this.getModeStateFromString(
          appState,
          (action as any).mode
        );

        if (modeState) {
          this.idbService
            .saveAnnotation(
              (action as any).mode,
              new OAnnotJSON(
                modeState.audio.fileName,
                modeState.audio.sampleRate,
                modeState.transcript.levels,
                modeState.transcript.links.map((a) => a.link)
              )
            )
            .then(() => {
              subject.next(IDBActions.saveAnnotation.success());
              subject.complete();
            })
            .catch((error) => {
              subject.next(
                IDBActions.saveAnnotation.fail({
                  error,
                })
              );
              subject.complete();
            });
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
      ofType(IDBActions.loadAnnotation.success),
      exhaustMap((action) => {
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

  afterIDBLoaded$ = createEffect(() =>
    combineLatest([
      this.actions$.pipe(ofType(IDBActions.loadOptions.success)),
      this.actions$.pipe(ofType(IDBActions.loadLogs.success)),
      this.actions$.pipe(ofType(IDBActions.loadAnnotation.success)),
      this.actions$.pipe(ofType(IDBActions.loadConsoleEntries.success)),
    ]).pipe(
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        console.log('INIT OK');
        // make sure online information is loaded
        if (
          state.application.mode === LoginMode.ONLINE &&
          state.application.loggedIn
        ) {
          if (
            state.onlineMode.onlineSession.currentProject !== undefined &&
            state.onlineMode.onlineSession.task !== undefined
          ) {
            return of(ApplicationActions.initApplication.finish());
          } else {
            return this.actions$.pipe(
              ofType(
                OnlineModeActions.loadOnlineInformationAfterIDBLoaded.success
              ),
              map((a) => ApplicationActions.initApplication.finish())
            );
          }
        }

        return of(ApplicationActions.initApplication.finish());
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

  constructor(
    private actions$: Actions,
    private appStorage: AppStorageService,
    private idbService: IDBService,
    private sessStr: SessionStorageService,
    private store: Store<RootState>,
    private api: OctraAPIService
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
    let modeState: OnlineModeState | LocalModeState | undefined = undefined;
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
