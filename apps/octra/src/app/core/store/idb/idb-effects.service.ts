import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {AppStorageService} from '../../shared/service/appstorage.service';
import * as ConfigurationActions from '../configuration/configuration.actions';
import * as IDBActions from './idb.actions';
import {exhaustMap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {Action} from '@ngrx/store';
import {IDBService} from '../../shared/service/idb.service';
import * as TranscriptionActions from '../transcription/transcription.actions';
import * as UserActions from '../user/user.actions';
import * as ApplicationActions from '../application/application.actions';
import * as LoginActions from '../login/login.actions';
import * as ASRActions from '../asr/asr.actions';
import {LoginMode, OnlineSession} from '../index';
import {isUnset} from '@octra/utilities';
import {OIDBLink} from '@octra/annotation';
import {SessionStorageService} from 'ngx-webstorage';


@Injectable({
  providedIn: 'root'
})
export class IDBEffects {
  loadOptions$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.appConfigurationLoadSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.initialize(action.appConfiguration.octra.database.name).then(() => {
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
              key: 'usemode'
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
            subject.next(IDBActions.loadOptionsSuccess({variables: options}));
            subject.complete();
          },
          (error) => {
            subject.next(IDBActions.loadOptionsFailed({
              error
            }));
            subject.complete();
          }
        )
      }).catch((error) => {
        console.error(error);
      });

      return subject;
    })
  ));

  loadLogs$ = createEffect(() => this.actions$.pipe(
    ofType(IDBActions.loadOptionsSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.loadLogs().then((logs) => {
        subject.next(IDBActions.loadLogsSuccess({
          logs: logs.map(a => a.value)
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

  loadAnnotationLevels$ = createEffect(() => this.actions$.pipe(
    ofType(IDBActions.loadLogsSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.loadAnnotationLevels().then((levels) => {
        const annotationLevels = [];
        let max = 0;
        for (let i = 0; i < levels.length; i++) {
          if (levels[i].hasOwnProperty('value')) {
            if (!levels[i].value.hasOwnProperty('id')) {
              annotationLevels.push(
                {
                  id: i + 1,
                  level: levels[i].value.level,
                  sortorder: i
                }
              );
              max = Math.max(i + 1, max);
            } else {
              annotationLevels.push(levels[i].value);
              max = Math.max(levels[i].value.id, max);
            }
          }
        }

        subject.next(IDBActions.loadAnnotationLevelsSuccess({
          levels: annotationLevels,
          levelCounter: max
        }));
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.loadAnnotationLevelsFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  loadAnnotationLinks$ = createEffect(() => this.actions$.pipe(
    ofType(IDBActions.loadAnnotationLevelsSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.loadAnnotationLinks().then((links) => {
        const annotationLinks = [];
        for (let i = 0; i < links.length; i++) {
          if (links[i].hasOwnProperty('value')) {
            if (!links[i].value.hasOwnProperty('id')) {
              annotationLinks.push(
                new OIDBLink(i + 1, links[i].value.link)
              );
            } else {
              annotationLinks.push(links[i].value);
            }
          }
        }

        subject.next(IDBActions.loadAnnotationLinksSuccess({
          links: annotationLinks
        }));
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.loadAnnotationLinksFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  // TODO add loadAnnotationLinks

  clearLogs$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.clearLogs),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.clearLoggingData().then(() => {
        subject.next(IDBActions.clearLogsSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.clearLogsFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ))

  clearAllOptions$ = createEffect(() => this.actions$.pipe(
    ofType(IDBActions.clearAllOptions),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.clearOptions().then(() => {
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
  ))

  clearAnnotation$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.clearAnnotation),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.clearAnnotationData().then(() => {
        subject.next(IDBActions.clearAnnotationSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.clearAnnotationFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  overwriteAnnotation$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.overwriteAnnotation),
    exhaustMap((action) => {
        const subject = new Subject<Action>();

        if (action.saveToDB) {
          this.idbService.clearAnnotationData().then(() => {
            this.idbService.saveAnnotationLevels(action.annotation.levels).then(() => {
              this.idbService.saveAnnotationLinks(action.annotation.links).then(() => {
                subject.next(IDBActions.overwriteAnnotationSuccess());
                subject.complete();
              }).catch((error) => {
                subject.next(IDBActions.overwriteAnnotationFailed({
                  error
                }));
                subject.complete();
              });
            }).catch((error) => {
              subject.next(IDBActions.overwriteAnnotationFailed({
                error
              }));
              subject.complete();
            });
          }).catch((error) => {
            subject.next(IDBActions.overwriteAnnotationFailed({
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

  overwriteAnnotationLinks$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.overwriteLinks),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.clearIDBTable('annotation_links').then(() => {
        this.idbService.saveAnnotationLinks(action.links).then(() => {
          subject.next(IDBActions.overwriteAnnotationLinksSuccess());
          subject.complete();
        }).catch((error) => {
          subject.next(IDBActions.overwriteAnnotationLinksFailed({
            error
          }));
          subject.complete();
        });
      }).catch((error) => {
        subject.next(IDBActions.overwriteAnnotationLinksFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  clearLocalStorage$ = createEffect(() => this.actions$.pipe(
    ofType(LoginActions.clearLocalSession),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      const promises: Promise<void>[] = [];
      promises.push(this.idbService.saveOption('user', null));
      promises.push(this.idbService.saveOption('feedback', null));
      promises.push(this.idbService.saveOption('comment', ''));
      promises.push(this.idbService.saveOption('audioURL', null));
      promises.push(this.idbService.saveOption('dataID', null));

      Promise.all(promises).then(() => {
        subject.next(IDBActions.overwriteAnnotationLinksSuccess());
        subject.complete();
      }).catch((error) => {
        console.error(error);
      });

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

  saveTranscriptionSubmitted$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.setSubmitted),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('submitted', action.submitted).then(() => {
        subject.next(IDBActions.saveTranscriptionSubmittedSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveTranscriptionSubmittedFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveTranscriptionFeedback$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.setFeedback),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('feedback', action.feedback).then(() => {
        subject.next(IDBActions.saveTranscriptionFeedbackSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveTranscriptionFeedbackFailed({
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

  saveTranscriptionLogging$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.setLogging),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('logging', action.logging).then(() => {
        subject.next(IDBActions.saveTranscriptionLoggingSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveTranscriptionLoggingFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveShowLoupe$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.setShowLoupe),
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
    ofType(TranscriptionActions.setEasyMode),
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

  saveComment$ = createEffect(() => this.actions$.pipe(
    ofType(LoginActions.setComment),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveOption('comment', action.comment).then(() => {
        subject.next(IDBActions.saveTranscriptionCommentSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveTranscriptionCommentFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveSecondsPerLine$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.setSecondsPerLine),
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
    ofType(TranscriptionActions.setHighlightingEnabled),
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
    ofType(LoginActions.loginDemo),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.sessStr.store('loggedIn', true);
      this.saveOnlineSession(LoginMode.DEMO, action.onlineSession).then(() => {
        subject.next(IDBActions.saveDemoSessionSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveDemoSessionFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveLoginOnline$ = createEffect(() => this.actions$.pipe(
    ofType(LoginActions.loginOnline),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.sessStr.store('loggedIn', true);
      this.saveOnlineSession(LoginMode.ONLINE, action.onlineSession).then(() => {
        subject.next(IDBActions.saveOnlineSessionSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveOnlineSessionFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveLoginLocal = createEffect(() => this.actions$.pipe(
    ofType(LoginActions.loginLocal),
    exhaustMap((action) => {
      const subject = new Subject<Action>();
      this.sessStr.store('loggedIn', true);

      const promises: Promise<any>[] = [];
      promises.push(this.idbService.saveOption('usemode', LoginMode.LOCAL));
      promises.push(this.idbService.saveOption('sessionfile', action.sessionFile.toAny()));

      Promise.all(promises).then(() => {
        subject.next(IDBActions.saveLocalSessionSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveLocalSessionFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  savePlayOnHover$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.setPlayOnHover),
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
    ofType(TranscriptionActions.setFollowPlayCursor),
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
    ofType(LoginActions.setServerDataEntry),
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

  saveLogs$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.setLogs),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.saveLogs(action.logs).then(() => {
        subject.next(IDBActions.saveLogsSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveLogsFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveASRLanguage$ = createEffect(() => this.actions$.pipe(
    ofType(ASRActions.setASRSettings),
    exhaustMap((action) => {
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
    ofType(TranscriptionActions.setAudioSettings),
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
    ofType(TranscriptionActions.setCurrentEditor),
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

  saveLog$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.addLog),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.save('logs', action.log.timestamp, action.log).then(() => {
        subject.next(IDBActions.saveLogSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.saveLogFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  saveAnnotationLevel$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.changeAnnotationLevel),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      console.log(`save annotation level...`);
      this.idbService.save('annotation_levels', action.id, {
        id: action.id,
        level: action.level,
        sortorder: action.sortorder
      }).then(() => {
        console.log(`saved annotation level success`);
        subject.next(IDBActions.saveAnnotationLevelSuccess());
        subject.complete();
      }).catch((error) => {
        console.error(error);
        subject.next(IDBActions.saveAnnotationLevelFailed({
          error
        }));
      });

      return subject;
    })
  ));

  addAnnotationLevel$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.addAnnotationLevel),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.save('annotation_levels', action.id, {
        id: action.id,
        level: action.level,
        sortorder: action.sortorder
      }).then(() => {
        subject.next(IDBActions.addAnnotationLevelSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.addAnnotationLevelFailed({
          error
        }));
      });

      return subject;
    })
  ));

  removeAnnotationLevel$ = createEffect(() => this.actions$.pipe(
    ofType(TranscriptionActions.removeAnnotationLevel),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.remove('annotation_levels', action.id).then(() => {
        subject.next(IDBActions.removeAnnotationLevelSuccess());
        subject.complete();
      }).catch((error) => {
        subject.next(IDBActions.removeAnnotationLevelFailed({
          error
        }));
        subject.complete();
      });

      return subject;
    })
  ));

  loadConsoleEntries$ = createEffect(() => this.actions$.pipe(
    ofType(IDBActions.loadAnnotationLevelsSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      this.idbService.loadConsoleEntries().then((dbEntry: any) => {
        if (!isUnset(dbEntry) && dbEntry.hasOwnProperty('value')) {
          subject.next(IDBActions.loadConsoleEntriesSuccess({
            consoleEntries: dbEntry.value
          }));
        } else {
          subject.next(IDBActions.loadConsoleEntriesSuccess({
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

  private saveOnlineSession(mode: LoginMode, onlineSession: OnlineSession) {
    const promises: Promise<void>[] = [];

    promises.push(this.idbService.saveOption('dataID', onlineSession.dataID));
    promises.push(this.idbService.saveOption('prompttext', onlineSession.promptText));
    promises.push(this.idbService.saveOption('audioURL', onlineSession.audioURL));
    promises.push(this.idbService.saveOption('usemode', mode));
    promises.push(this.idbService.saveOption('user', {
      id: onlineSession.id,
      jobno: onlineSession.jobNumber,
      project: onlineSession.project
    }));
    this.sessStr.store('jobsLeft', onlineSession.jobsLeft);
    this.sessStr.store('serverDataEntry', onlineSession.serverDataEntry);

    return Promise.all(promises);
  }

  constructor(private actions$: Actions,
              private appStorage: AppStorageService,
              private idbService: IDBService,
              private sessStr: SessionStorageService) {

    // TODO add this as effect
    actions$.subscribe((action) => {
      if (action.type.toLocaleLowerCase().indexOf('failed') > -1) {
        const errorMessage = (action as any).error;
        console.error(`${action.type}: ${errorMessage}`);
      }
    });
  }

}
