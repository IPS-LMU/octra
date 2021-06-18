import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {exhaustMap, filter, mergeMap, withLatestFrom} from 'rxjs/operators';
import {Subject, timer} from 'rxjs';
import {Action, Store} from '@ngrx/store';
import {IDBService} from '../../shared/service/idb.service';
import {convertFromOIDLevel, getModeState, LocalModeState, LoginMode, OnlineModeState, RootState} from '../index';
import {ILevel, ILink, OAnnotJSON, OIDBLink} from '@octra/annotation';
import {SessionStorageService} from 'ngx-webstorage';
import {ConsoleEntry} from '../../shared/service/bug-report.service';
import {AnnotationActions} from '../annotation/annotation.actions';
import {IDBActions} from './idb.actions';
import {ConfigurationActions} from '../configuration/configuration.actions';
import {ApplicationActions} from '../application/application.actions';
import {ASRActions} from '../asr/asr.actions';
import {UserActions} from '../user/user.actions';
import {OnlineModeActions} from '../modes/online-mode/online-mode.actions';
import {LocalModeActions} from '../modes/local-mode/local-mode.actions';
import {IIDBModeOptions} from '../../shared/octra-database';
import {hasProperty} from '@octra/utilities';


@Injectable({
  providedIn: 'root'
})
export class IDBEffects {
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
          const links = modeState.transcript.links.map(a => a.link);
          this.idbService.saveAnnotation(appState.application.mode, new OAnnotJSON(modeState.audio.fileName, modeState.audio.sampleRate, modeState.transcript.levels, links)).then(() => {
            subject.next(ApplicationActions.undoSuccess());
          }).catch((error) => {
            subject.next(ApplicationActions.undoFailed({
              error
            }));
          });
        } else {
          subject.next(ApplicationActions.undoFailed({
            error: 'Can\'t find modeState'
          }));
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
          const links = modeState.transcript.links.map(a => a.link);
          this.idbService.saveAnnotation(appState.application.mode, new OAnnotJSON(modeState.audio.fileName, modeState.audio.sampleRate, modeState.transcript.levels, links)).then(() => {
            subject.next(ApplicationActions.redoSuccess());
          }).catch((error) => {
            subject.next(ApplicationActions.redoFailed({
              error
            }));
          });
        } else {
          subject.next(ApplicationActions.undoFailed({
            error: 'Can\'t find modeState'
          }));
        }

        return subject;
      })
    )
  );

  loadOptions$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.appConfigurationLoadSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.initialize(action.appConfiguration.octra.database.name).then(() => {
        console.log(`load options...`);
        const loadApplicationOptions = this.idbService.loadOptions([
            'version', 'easymode', 'language', 'usemode', 'user', 'showLoupe', 'secondsPerLine', 'audioSettings', 'highlightingEnabled', 'asr'
          ]
        );

        const loadModeOptionsLocal = this.idbService.loadModeOptions(LoginMode.LOCAL);
        const loadModeOptionsDemo = this.idbService.loadModeOptions(LoginMode.DEMO);
        const loadModeOptionsOnline = this.idbService.loadModeOptions(LoginMode.ONLINE);

        Promise.all([
          loadApplicationOptions,
          loadModeOptionsLocal,
          loadModeOptionsDemo,
          loadModeOptionsOnline
        ]).then(([applicationOptions, localOptions, demoOptions, onlineOptions]: [any, IIDBModeOptions, IIDBModeOptions, IIDBModeOptions]) => {
          subject.next(IDBActions.loadOptionsSuccess({
            applicationOptions, localOptions, onlineOptions, demoOptions
          }));
          subject.complete();
        }).catch((error) => {
          subject.next(IDBActions.loadOptionsFailed({
            error
          }));
          subject.complete();
        });
      }).catch((error) => {
        subject.next(IDBActions.loadOptionsFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  loadLogs$ = createEffect(() => this.actions$.pipe(
    ofType(IDBActions.loadOptionsSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();
      Promise.all([
        this.idbService.loadLogs(LoginMode.ONLINE),
        this.idbService.loadLogs(LoginMode.LOCAL),
        this.idbService.loadLogs(LoginMode.DEMO)
      ]).then(([onlineModeLogs, localModeLogs, demoModeLogs]) => {
        subject.next(IDBActions.loadLogsSuccess({
          online: onlineModeLogs,
          demo: localModeLogs,
          local: demoModeLogs
        }));
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.loadLogsFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  loadAnnotation$ = createEffect(() => this.actions$.pipe(
    ofType(IDBActions.loadLogsSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();
      Promise.all([
          this.idbService.loadAnnotation(LoginMode.ONLINE),
          this.idbService.loadAnnotation(LoginMode.LOCAL),
          this.idbService.loadAnnotation(LoginMode.DEMO)
        ]
      ).then(([onlineAnnotation, localAnnotation, demoAnnotation]) => {
        console.log(`results:`);
        console.log(onlineAnnotation);
        let max = 0;
        const convertToStateLevel = (level: ILevel, i) => {
          const annotationStateLevel = convertFromOIDLevel(level, i + 1);
          if (!hasProperty(level, 'id')) {
            annotationStateLevel.id = i + 1;
          }

          max = Math.max(annotationStateLevel.id, max);
          return annotationStateLevel;
        };

        const convertLink = (link: ILink, i) => {
          if (!hasProperty(link, 'id')) {
            return new OIDBLink(i + 1, link);
          } else {
            return link;
          }
        };

        const oidbOnlineAnnotation = {
          levels: (onlineAnnotation?.levels) ? onlineAnnotation?.levels.map(convertToStateLevel) : [],
          links: (onlineAnnotation?.links) ? onlineAnnotation?.links.map(convertLink) : [],
          levelCounter: max
        };

        max = 0;
        const oidbLocalAnnotation = {
          levels: (localAnnotation?.levels) ? localAnnotation?.levels.map(convertToStateLevel) : [],
          links: (localAnnotation?.links) ? localAnnotation?.links.map(convertLink) : [],
          levelCounter: max
        };

        max = 0;
        const oidbDemoAnnotation = {
          levels: (demoAnnotation?.levels) ? demoAnnotation?.levels.map(convertToStateLevel) : [],
          links: (demoAnnotation?.links) ? demoAnnotation?.links.map(convertLink) : [],
          levelCounter: max
        };

        subject.next(IDBActions.loadAnnotationSuccess({
          online: oidbOnlineAnnotation,
          local: oidbLocalAnnotation,
          demo: oidbDemoAnnotation
        }));
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.loadAnnotationFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  clearLogs$ = createEffect(() => this.actions$.pipe(
    filter(a => a.type === AnnotationActions.clearLogs.type || a.type === AnnotationActions.clearWholeSession.type),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.clearLoggingData((action as any).mode).then(() => {
        subject.next(IDBActions.clearLogsSuccess((action as any).mode));
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.clearLogsFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  clearAllOptions$ = createEffect(() => this.actions$.pipe(
    filter(a => a.type === IDBActions.clearAllOptions.type || a.type === OnlineModeActions.clearWholeSession.type),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.clearOptions((action as any).mode).then(() => {
        subject.next(IDBActions.clearAllOptionsSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.clearAllOptionsFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  clearAnnotation$ = createEffect(() => this.actions$.pipe(
    filter(action => action.type === AnnotationActions.clearAnnotation.type
      || action.type === OnlineModeActions.clearWholeSession.type || action.type === AnnotationActions.logout.type),
    exhaustMap((action) => {
      const subject = new Subject<Action>();
      if (!hasProperty(action, 'clearSession') || (action as any).clearSession) {
        this.idbService.clearAnnotationData((action as any).mode).then(() => {
          subject.next(IDBActions.clearAnnotationSuccess());
          subject.complete();
        }).catch((error) => {
          subject.next(IDBActions.clearAnnotationFailed({
            error
          }));
          subject.complete();
        });

      } else {
        timer(10).subscribe(() => {
          subject.complete();
        })
      }
      return subject;
    })
  ));

  overwriteAnnotation$ = createEffect(() => this.actions$.pipe(
    ofType(AnnotationActions.overwriteTranscript),
    exhaustMap((action) => {
        const subject = new Subject<Action>();

        if (action.saveToDB) {
          this.idbService.clearAnnotationData((action as any).mode).then(() => {
            subject.next(IDBActions.overwriteTranscriptSuccess());
            subject.complete();
          }).catch((error) => {
            subject.next(IDBActions.overwriteTranscriptFailed({
              error
            }));
            subject.complete();
          });
        } else {
          subject.complete();
        }
        return subject;
      }
    )));

  logoutSession$ = createEffect(() => this.actions$.pipe(
    ofType(AnnotationActions.logout),
    exhaustMap(() => {
      const subject = new Subject<Action>();

      this.sessStr.store('loggedIn', false);
      timer(0).subscribe(() => {
        subject.next(IDBActions.logoutSessionSuccess());
        subject.complete();
      });

      return subject;
    })
  ));

  savemodeOptions$ = createEffect(() => this.actions$.pipe(
    ofType(
      AnnotationActions.logout, OnlineModeActions.setSubmitted, OnlineModeActions.setComment,
      OnlineModeActions.setFeedback, AnnotationActions.setLogging, LocalModeActions.login,
      AnnotationActions.setCurrentEditor, OnlineModeActions.loginDemo, OnlineModeActions.login,
      LocalModeActions.login
    ),
    withLatestFrom(this.store),
    mergeMap(([action, appState]: [Action, RootState]) => {
      const subject = new Subject<Action>();

      const modeState = this.getModeStateFromString(appState, (action as any).mode);
      if (modeState) {
        const onlineModeState = modeState as OnlineModeState;
        const localModeState = modeState as LocalModeState;

        this.idbService.saveModeOptions((action as any).mode, {
          submitted: onlineModeState.onlineSession?.sessionData?.submitted,
          audioURL: onlineModeState.onlineSession?.sessionData?.audioURL,
          comment: onlineModeState.onlineSession?.sessionData?.comment,
          dataID: onlineModeState.onlineSession?.sessionData?.dataID,
          feedback: onlineModeState.onlineSession?.sessionData?.feedback,
          sessionfile: localModeState?.sessionFile?.toAny(),
          prompttext: onlineModeState?.onlineSession?.sessionData?.promptText,
          servercomment: onlineModeState?.onlineSession?.sessionData?.serverComment,
          currentEditor: modeState.currentEditor,
          logging: modeState?.logging,
          user: {
            id: onlineModeState?.onlineSession?.loginData.id,
            jobNumber: onlineModeState?.onlineSession?.loginData.jobNumber,
            project: onlineModeState?.onlineSession?.loginData.project
          }
        }).then(() => {
          subject.next(IDBActions.saveModeOptionsSuccess({
            mode: (action as any).mode
          }));
          subject.complete();
        }).catch((error) => {
          subject.next(IDBActions.saveModeOptionsFailed({
            error
          }));
          subject.complete();
        });
      }

      return subject;
    })
  ));

  saveUserProfile$ = createEffect(() => this.actions$.pipe(
    ofType(UserActions.setUserProfile),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('userProfile', {name: action.name, email: action.email}).then(() => {
        subject.next(IDBActions.saveUserProfileSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveUserProfileFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveAppLanguage$ = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setAppLanguage),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('language', action.language).then(() => {
        subject.next(IDBActions.saveAppLanguageSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveAppLanguageFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveDBVersion = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setDBVersion),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('version', action.version).then(() => {
        subject.next(IDBActions.saveIDBVersionSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveIDBVersionFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveShowLoupe$ = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setShowLoupe),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('showLoupe', action.showLoupe).then(() => {
        subject.next(IDBActions.saveShowLoupeSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveShowLoupeFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveEasyMode$ = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setEasyMode),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('easymode', action.easyMode).then(() => {
        subject.next(IDBActions.saveEasyModeSucess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveEasyModeFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveSecondsPerLine$ = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setSecondsPerLine),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      if (this.idbService.isReady) {
        this.idbService.saveOption('secondsPerLine', action.secondsPerLine).then(() => {
          subject.next(IDBActions.saveSecondsPerLineSuccess());
          subject.complete();
        }).catch((error) => {
          subject.next(IDBActions.saveSecondsPerLineFailed({
            error
          }));
          subject.complete();
        });
      }

      return subject;
    })
  ));

  saveHighlightingEnabled$ = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setHighlightingEnabled),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('highlightingEnabled', action.highlightingEnabled).then(() => {
        subject.next(IDBActions.saveHighlightingEnabledSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveHighlightingEnabledFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveLoginDemo$ = createEffect(() => this.actions$.pipe(
    ofType(OnlineModeActions.loginDemo),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.sessStr.store('loggedIn', true);
      this.sessStr.store('jobsLeft', action.onlineSession.sessionData.jobsLeft);
      this.sessStr.store('serverDataEntry', action.onlineSession.sessionData.serverDataEntry);

      timer(0).toPromise().then(() => {
        subject.next(IDBActions.saveDemoSessionSuccess());
        subject.complete();
      });

      return subject;
    })
  ));

  saveLoginOnline$ = createEffect(() => this.actions$.pipe(
    ofType(OnlineModeActions.login),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.sessStr.store('loggedIn', true);
      this.sessStr.store('jobsLeft', action.onlineSession.sessionData.jobsLeft);
      this.sessStr.store('serverDataEntry', action.onlineSession.sessionData.serverDataEntry);

      timer(0).toPromise().then(() => {
        subject.next(IDBActions.saveOnlineSessionSuccess());
        subject.complete();
      });

      return subject;
    })
  ));

  saveLogin$ = createEffect(() => this.actions$.pipe(
    ofType(LocalModeActions.login, OnlineModeActions.loginDemo, OnlineModeActions.login),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.sessStr.store('loggedIn', true);
      const promises: Promise<any>[] = [];
      promises.push(this.idbService.saveOption('usemode', action.mode));
      Promise.all(promises).then(() => {
        subject.next(IDBActions.saveLoginSessionSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveLoginSessionFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveLogout$ = createEffect(() => this.actions$.pipe(
    ofType(AnnotationActions.logout),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.sessStr.store('loggedIn', false);
      const promises: Promise<any>[] = [];
      promises.push(this.idbService.saveOption('usemode', undefined));
      Promise.all(promises).then(() => {
        subject.next(IDBActions.saveLogoutSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveLogoutFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  savePlayOnHover$ = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setPlayOnHover),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      try {
        this.sessStr.store('playonhover', action.playOnHover);
        setTimeout(() => {
          subject.next(IDBActions.saveFollowPlayCursorSuccess());
          subject.complete();
        }, 200);
      } catch (error) {
        setTimeout(() => {
          subject.next(IDBActions.saveFollowPlayCursorFailed({
            error
          }));
          subject.complete();
        }, 200);
      }

      return subject;
    })
  ));

  saveFollowPlayCursor$ = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setFollowPlayCursor),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      try {
        this.sessStr.store('followplaycursor', action.followPlayCursor);
        setTimeout(() => {
          subject.next(IDBActions.saveFollowPlayCursorSuccess());
          subject.complete();
        }, 200);

      } catch (error) {
        setTimeout(() => {
          subject.next(IDBActions.saveFollowPlayCursorFailed({
            error
          }));
          subject.complete();
        }, 200);
      }

      return subject;
    })
  ));

  saveReloaded$ = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setReloaded),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      try {
        this.sessStr.store('reloaded', action.reloaded);
        setTimeout(() => {
          subject.next(IDBActions.saveAppReloadedSuccess());
          subject.complete();
        }, 200);

      } catch (error) {
        setTimeout(() => {
          subject.next(IDBActions.saveAppReloadedFailed({
            error
          }));
          subject.complete();
        }, 200);
      }

      return subject;
    })
  ));

  saveServerDataEntry$ = createEffect(() => this.actions$.pipe(
    ofType(OnlineModeActions.setServerDataEntry),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      try {
        this.sessStr.store('serverDataEntry', action.serverDataEntry);
        setTimeout(() => {
          subject.next(IDBActions.saveServerDataEntrySuccess());
          subject.complete();
        }, 200);

      } catch (error) {
        setTimeout(() => {
          subject.next(IDBActions.saveServerDataEntryFailed({
            error
          }));
          subject.complete();
        }, 200);
      }

      return subject;
    })
  ));

  saveASRLanguage$ = createEffect(() => this.actions$.pipe(
    ofType(ASRActions.setASRSettings),
    mergeMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('asr', {
        selectedLanguage: action.selectedLanguage,
        selectedService: action.selectedService
      }).then(() => {
        subject.next(IDBActions.saveASRSettingsSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveASRSettingsFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveAudioSettings$ = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setAudioSettings),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('audioSettings', {
        volume: action.volume,
        speed: action.speed
      }).then(() => {
        subject.next(IDBActions.saveAudioSettingsSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveAudioSettingsFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveCurrentEditor$ = createEffect(() => this.actions$.pipe(
    ofType(AnnotationActions.setCurrentEditor),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('interface', action.currentEditor).then(() => {
        subject.next(IDBActions.saveCurrentEditorSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveCurrentEditorFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveLogs$ = createEffect(() => this.actions$.pipe(
    ofType(AnnotationActions.saveLogs, AnnotationActions.addLog),
    withLatestFrom(this.store),
    mergeMap(([action, appState]: [Action, RootState]) => {
      const subject = new Subject<Action>();

      const modeState = this.getModeStateFromString(appState, (action as any).mode);

      if (modeState) {
        this.idbService.saveLogs((action as any).mode, modeState.logs).then(() => {
          subject.next(IDBActions.saveLogsSuccess());
          subject.complete();
        }).catch((error) => {
          subject.next(IDBActions.saveLogsFailed({
            error
          }));
          subject.complete();
        });
      } else {
        subject.next(IDBActions.saveLogsFailed({
          error: 'Can\'t find modeState'
        }));
        subject.complete();
      }

      return subject;
    })
  ));

  saveAnnotation = createEffect(() => this.actions$.pipe(
    ofType(AnnotationActions.changeAnnotationLevel, AnnotationActions.addAnnotationLevel, AnnotationActions.removeAnnotationLevel),
    withLatestFrom(this.store),
    mergeMap(([action, appState]: [Action, RootState]) => {
      const subject = new Subject<Action>();
      const modeState = this.getModeStateFromString(appState, (action as any).mode);

      if (modeState) {
        this.idbService.saveAnnotation((action as any).mode, new OAnnotJSON(modeState.audio.fileName, modeState.audio.sampleRate, modeState.transcript.levels, modeState.transcript.links.map(a => a.link))).then(() => {
          subject.next(IDBActions.saveAnnotationSuccess());
          subject.complete();
        }).catch((error) => {
          subject.next(IDBActions.saveAnnotationFailed({
            error
          }));
          subject.complete();
        });
      } else {
        subject.next(IDBActions.saveAnnotationFailed({
          error: 'Can\'t find modeState'
        }));
        subject.complete();
      }

      return subject;
    })
  ));

  loadConsoleEntries$ = createEffect(() => this.actions$.pipe(
    ofType(IDBActions.loadAnnotationSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.loadConsoleEntries().then((dbEntries: ConsoleEntry[]) => {
        if (dbEntries !== undefined) {
          subject.next(IDBActions.loadConsoleEntriesSuccess({
            consoleEntries: dbEntries
          }));
        } else {
          subject.next(IDBActions.loadConsoleEntriesSuccess({
            consoleEntries: []
          }));
        }
      }).catch(() => {
        subject.next(IDBActions.loadConsoleEntriesSuccess({
          consoleEntries: []
        }));
      });

      return subject;
    })
  ));

  saveConsoleEntries$ = createEffect(() => this.actions$.pipe(
    ofType(ApplicationActions.setConsoleEntries),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      if (this.idbService.isReady) {
        this.idbService.saveConsoleEntries(action.consoleEntries).then(() => {
          subject.next(IDBActions.saveConsoleEntriesSuccess());
        }).catch((error) => {
          subject.next(IDBActions.saveConsoleEntriesSuccess());
        });
      }

      return subject;
    })
  ));

  constructor(private actions$: Actions,
              private appStorage: AppStorageService,
              private idbService: IDBService,
              private sessStr: SessionStorageService,
              private store: Store<RootState>) {

    // TODO add this as effect
    actions$.subscribe((action) => {
      if (action.type.toLocaleLowerCase().indexOf('failed') > -1) {
        const errorMessage = (action as any).error;
        console.error(`${action.type}: ${errorMessage}`);
      }
    });
  }

  getModeStateFromString(appState: RootState, mode: LoginMode) {
    let modeState: OnlineModeState | LocalModeState = undefined;
    if (mode === 'online') {
      modeState = appState.onlineMode
    } else if (mode === 'local') {
      modeState = appState.localMode
    } else if (mode === 'demo') {
      modeState = appState.demoMode
    }
    return modeState;
  }
}
