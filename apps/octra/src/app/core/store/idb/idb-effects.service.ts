import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {AppStorageService} from '../../shared/service/appstorage.service';
import * as fromConfigurationActions from '../configuration/configuration.actions';
import * as fromIDBActions from './idb.actions';
import {exhaustMap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {Action} from '@ngrx/store';
import {IDBService} from '../../shared/service/idb.service';
import * as fromTranscriptionActions from '../transcription/transcription.actions';
import * as fromUserActions from '../user/user.actions';
import * as fromApplicationActions from '../application/application.actions';
import * as fromLoginActions from '../login/login.actions';
import * as fromASRActions from '../asr/asr.actions';
import {LoginMode, OnlineSession} from '../index';
import {isUnset} from '@octra/utilities';


@Injectable()
export class IDBEffects {
  loadOptions$ = createEffect(() => this.actions$.pipe(
    ofType(fromConfigurationActions.appConfigurationLoadSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.initialize(action.appConfig.octra.database.name);
      this.idbService.loadOptions(
        [
          {
            attribute: '_submitted',
            key: 'submitted'
          },
          {
            attribute: '_version',
            key: 'version'
          },
          {
            attribute: '_easymode',
            key: 'easymode'
          },
          {
            attribute: '_audioURL',
            key: 'audioURL'
          },
          {
            attribute: '_comment',
            key: 'comment'
          },
          {
            attribute: '_dataID',
            key: 'dataID'
          },
          {
            attribute: '_feedback',
            key: 'feedback'
          },
          {
            attribute: '_language',
            key: 'language'
          },
          {
            attribute: '_sessionfile',
            key: 'sessionfile'
          },
          {
            attribute: '_usemode',
            key: 'useMode'
          },
          {
            attribute: '_user',
            key: 'user'
          },
          {
            attribute: '_userProfile',
            key: 'userProfile'
          },
          {
            attribute: '_interface',
            key: 'interface'
          },
          {
            attribute: '_logging',
            key: 'logging'
          },
          {
            attribute: '_showLoupe',
            key: 'showLoupe'
          },
          {
            attribute: '_prompttext',
            key: 'prompttext'
          },
          {
            attribute: '_servercomment',
            key: 'servercomment'
          },
          {
            attribute: '_secondsPerLine',
            key: 'secondsPerLine'
          },
          {
            attribute: '_audioSettings',
            key: 'audioSettings'
          },
          {
            attribute: '_asr',
            key: 'asr'
          },
          {
            attribute: '_highlightingEnabled',
            key: 'highlightingEnabled'
          }
        ]
      ).subscribe(
        (options) => {
          subject.next(fromIDBActions.loadOptionsSuccess({variables: options}));
          subject.complete();
        },
        (error) => {
          subject.next(fromIDBActions.loadOptionsFailed({
            error
          }));
          subject.complete();
        }
      )

      return subject;
    })
  ));

  loadLogs$ = createEffect(() => this.actions$.pipe(
    ofType(fromIDBActions.loadOptionsSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.loadLogs().then((logs) => {
        subject.next(fromIDBActions.loadLogsSuccess({
          logs
        }));
      }).catch((error) => {
        subject.next(fromIDBActions.loadLogsFailed({
          error
        }));
      });

      return subject;
    })
  ));

  loadAnnotationLevels$ = createEffect(() => this.actions$.pipe(
    ofType(fromIDBActions.loadLogsSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.loadAnnotationLevels().then((levels) => {
        const annotationLevels = [];
        let max = 0;
        for (let i = 0; i < levels.length; i++) {
          if (!levels[i].hasOwnProperty('id')) {
            annotationLevels.push(
              {
                id: i + 1,
                level: levels[i],
                sortorder: i
              }
            );
            max = Math.max(i + 1, max);
          } else {
            annotationLevels.push(levels[i]);
            max = Math.max(levels[i].id, max);
          }
        }

        subject.next(fromIDBActions.loadAnnotationLevelsSuccess({
          levels: annotationLevels,
          levelCounter: max
        }));
      }).catch((error) => {
        subject.next(fromIDBActions.loadAnnotationLevelsFailed({
          error
        }));
      });

      return subject;
    })
  ));

  // TODO add loadAnnotationLinks

  clearLogs$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.clearLogs),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.clearLoggingData().then(() => {
        subject.next(fromIDBActions.clearLogsSuccess());
      }).catch((error) => {
        subject.next(fromIDBActions.clearLogsFailed({
          error
        }));
      });

      return subject;
    })
  ))

  clearAnnotation$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.clearAnnotation),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.clearAnnotationData().then(() => {
        subject.next(fromIDBActions.clearAnnotationSuccess());
      }).catch((error) => {
        subject.next(fromIDBActions.clearAnnotationFailed({
          error
        }));
      });

      return subject;
    })
  ));

  overwriteAnnotation$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.overwriteAnnotation),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.clearAnnotationData().then(() => {
        this.idbService.saveAnnotationLevels(action.annotation.levels).then(() => {
          this.idbService.clearIDBTable('annotation_links').then(() => {
            this.idbService.saveAnnotationLinks(action.annotation.links).then(() => {
              subject.next(fromIDBActions.overwriteAnnotationSuccess());
            }).catch((error) => {
              subject.next(fromIDBActions.overwriteAnnotationFailed({
                error
              }));
            });
          }).catch((error) => {
            subject.next(fromIDBActions.overwriteAnnotationFailed({
              error
            }));
          });
        }).catch((error) => {
          subject.next(fromIDBActions.overwriteAnnotationFailed({
            error
          }));
        });
      }).catch((error) => {
        subject.next(fromIDBActions.overwriteAnnotationFailed({
          error
        }));
      });

      return subject;
    })
  ));

  overwriteAnnotationLinks$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.overwriteLinks),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.clearIDBTable('annotation_links').then(() => {
        this.idbService.saveAnnotationLinks(action.links).then(() => {
          subject.next(fromIDBActions.overwriteAnnotationLinksSuccess);
        }).catch((error) => {
          subject.next(fromIDBActions.overwriteAnnotationLinksFailed({
            error
          }));
        });
      }).catch((error) => {
        subject.next(fromIDBActions.overwriteAnnotationLinksFailed({
          error
        }));
      });

      return subject;
    })
  ));

  clearLocalStorage$ = createEffect(() => this.actions$.pipe(
    ofType(fromLoginActions.clearLocalSession),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      const promises: Promise<void>[] = [];
      promises.push(this.idbService.saveOption('user', null));
      promises.push(this.idbService.saveOption('feedback', null));
      promises.push(this.idbService.saveOption('comment', ''));
      promises.push(this.idbService.saveOption('audioURL', null));
      promises.push(this.idbService.saveOption('dataID', null));

      Promise.all(promises).then(() => {
        subject.next(fromIDBActions.overwriteAnnotationLinksSuccess);
      }).catch((error) => {
        console.error(error);
      });

      return subject;
    })
  ));

  saveUserProfile$ = createEffect(() => this.actions$.pipe(
    ofType(fromUserActions.setUserProfile),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('userProfile', {name: action.name, email: action.email}).then(() => {
        subject.next(fromIDBActions.saveUserProfileSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveUserProfileFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveTranscriptionSubmitted$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setSubmitted),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('submitted', action.submitted).then(() => {
        subject.next(fromIDBActions.saveTranscriptionSubmittedSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveTranscriptionSubmittedFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveTranscriptionFeedback$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setFeedback),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('feedback', action.feedback).then(() => {
        subject.next(fromIDBActions.saveTranscriptionFeedbackSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveTranscriptionFeedbackFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveAppLanguage$ = createEffect(() => this.actions$.pipe(
    ofType(fromApplicationActions.setAppLanguage),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('language', action.language).then(() => {
        subject.next(fromIDBActions.saveAppLanguageSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveAppLanguageFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveAppVersion$ = createEffect(() => this.actions$.pipe(
    ofType(fromApplicationActions.setAppVersion),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('version', action.version).then(() => {
        subject.next(fromIDBActions.saveAppVersionSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveAppVersionFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveTranscriptionLogging$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setLogging),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('logging', action.logging).then(() => {
        subject.next(fromIDBActions.saveTranscriptionLoggingSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveTranscriptionLoggingFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveShowLoupe$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setShowLoupe),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('showLoupe', action.showLoupe).then(() => {
        subject.next(fromIDBActions.saveShowLoupeSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveShowLoupeFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveEasyMode$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setEasyMode),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('easymode', action.easyMode).then(() => {
        subject.next(fromIDBActions.saveEasyModeSucess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveEasyModeFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveComment$ = createEffect(() => this.actions$.pipe(
    ofType(fromLoginActions.setComment),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('comment', action.comment).then(() => {
        subject.next(fromIDBActions.saveTranscriptionCommentSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveTranscriptionCommentFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveSecondsPerLine$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setSecondsPerLine),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('secondsPerLine', action.secondsPerLine).then(() => {
        subject.next(fromIDBActions.saveSecondsPerLineSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveSecondsPerLineFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveHighlightingEnabled$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setHighlightingEnabled),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('highlightingEnabled', action.highlightingEnabled).then(() => {
        subject.next(fromIDBActions.saveHighlightingEnabledSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveHighlightingEnabledFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveLoginDemo$ = createEffect(() => this.actions$.pipe(
    ofType(fromLoginActions.loginDemo),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.saveOnlineSession(LoginMode.DEMO, action.onlineSession).then(() => {
        subject.next(fromIDBActions.saveDemoSessionSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveDemoSessionFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveLoginOnline$ = createEffect(() => this.actions$.pipe(
    ofType(fromLoginActions.loginOnline),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.saveOnlineSession(LoginMode.ONLINE, action.onlineSession).then(() => {
        subject.next(fromIDBActions.saveOnlineSessionSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveOnlineSessionFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveLoginLocal = createEffect(() => this.actions$.pipe(
    ofType(fromLoginActions.loginLocal),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('sessionfile', action.sessionFile.toAny()).then(() => {
        subject.next(fromIDBActions.saveLocalSessionSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveLocalSessionFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveLoggedIn$ = createEffect(() => this.actions$.pipe(
    ofType(fromLoginActions.setLoggedIn),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('loggedIn', action.loggedIn).then(() => {
        subject.next(fromIDBActions.saveLoggedInSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveLoggedInFailed({
          error
        }));
      });

      return subject;
    })
  ));

  savePlayOnHover$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setPlayOnHover),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('playonhover', action.playOnHover).then(() => {
        subject.next(fromIDBActions.savePlayOnHoverSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.savePlayOnHoverFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveReloaded$ = createEffect(() => this.actions$.pipe(
    ofType(fromApplicationActions.setReloaded),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('reloaded', action.reloaded).then(() => {
        subject.next(fromIDBActions.saveAppReloadedSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveAppReloadedFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveLogs$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setLogs),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveLogs(action.logs).then(() => {
        subject.next(fromIDBActions.saveLogsSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveLogsFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveASRLanguage$ = createEffect(() => this.actions$.pipe(
    ofType(fromASRActions.setASRSettings),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('asr', {
        selectedLanguage: action.selectedLanguage,
        selectedService: action.selectedService
      }).then(() => {
        subject.next(fromIDBActions.saveASRSettingsSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveASRSettingsFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveAudioSettings$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setAudioSettings),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('audioSettings', {
        volume: action.volume,
        speed: action.speed
      }).then(() => {
        subject.next(fromIDBActions.saveAudioSettingsSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveAudioSettingsFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveCurrentEditor$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.setCurrentEditor),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('interface', action.currentEditor).then(() => {
        subject.next(fromIDBActions.saveCurrentEditorSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveCurrentEditorFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveLog$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.addLog),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.save('logs', action.log.timestamp, action.log).then(() => {
        subject.next(fromIDBActions.saveLogSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveLogFailed({
          error
        }));
      });

      return subject;
    })
  ));

  saveAnnotationLevel$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.changeAnnotationLevel),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.save('annotation_levels', action.id, {
        id: action.id,
        level: action.level,
        sortorder: action.sortorder
      }).then(() => {
        subject.next(fromIDBActions.saveAnnotationLevelSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveAnnotationLevelFailed({
          error
        }));
      });

      return subject;
    })
  ));

  addAnnotationLevel$ = createEffect(() => this.actions$.pipe(
    ofType(fromTranscriptionActions.addAnnotationLevel),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.save('annotation_levels', action.id, {
        id: action.id,
        level: action.level,
        sortorder: action.sortorder
      }).then(() => {
        subject.next(fromIDBActions.addAnnotationLevelSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.addAnnotationLevelFailed({
          error
        }));
      });

      return subject;
    })
  ));

  loadConsoleEntries$ = createEffect(() => this.actions$.pipe(
    ofType(fromIDBActions.loadAnnotationLevelsSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.loadConsoleEntries().then((dbEntry: any) => {
        if (!isUnset(dbEntry) && dbEntry.hasOwnProperty('value')) {
          subject.next(fromIDBActions.loadConsoleEntriesSuccess({
            consoleEntries: dbEntry.value
          }));
        } else {
          subject.next(fromIDBActions.loadConsoleEntriesSuccess({
            consoleEntries: []
          }));
        }
      }).catch((error) => {
        console.error(error);
      });

      return subject;
    })
  ));

  saveConsoleEntries$ = createEffect(() => this.actions$.pipe(
    ofType(fromApplicationActions.setConsoleEntries),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveConsoleEntries(action.consoleEntries).then(() => {
        subject.next(fromIDBActions.saveConsoleEntriesSuccess);
      }).catch((error) => {
        subject.next(fromIDBActions.saveConsoleEntriesSuccess);
      });

      return subject;
    })
  ));

  private saveOnlineSession(mode: LoginMode, onlineSession: OnlineSession) {
    const promises: Promise<void>[] = [];

    promises.push(this.idbService.saveOption('dataID', onlineSession.dataID));
    promises.push(this.idbService.saveOption('prompttext', onlineSession.promptText));
    promises.push(this.idbService.saveOption('audioURL', onlineSession.audioURL));
    promises.push(this.idbService.saveOption('jobsLeft', onlineSession.jobsLeft));
    promises.push(this.idbService.saveOption('serverDataEntry', onlineSession.serverDataEntry));
    promises.push(this.idbService.saveOption('useMode', mode));
    promises.push(this.idbService.saveOption('user', {
      id: onlineSession.id,
      jobno: onlineSession.jobNumber,
      project: onlineSession.project
    }));

    return Promise.all(promises);
  }

  constructor(private actions$: Actions,
              private appStorage: AppStorageService,
              private idbService: IDBService) {
  }
}
