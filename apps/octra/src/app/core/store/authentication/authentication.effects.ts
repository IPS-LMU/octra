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
  from,
  map,
  of,
  tap,
  withLatestFrom,
} from 'rxjs';
import { AuthenticationActions } from './authentication.actions';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { LoginMode, RootState } from '../index';
import { OctraModalService } from '../../modals/octra-modal.service';
import { RoutingService } from '../../shared/service/routing.service';
import { ErrorModalComponent } from '../../modals/error-modal/error-modal.component';
import { LoginModeActions } from '../login-mode/login-mode.actions';
import {
  ModalDeleteAnswer,
  TranscriptionDeleteModalComponent,
} from '../../modals/transcription-delete-modal/transcription-delete-modal.component';
import { AudioManager } from '@octra/media';
import { AppInfo } from '../../../app.info';
import { SessionFile } from '../../obj/SessionFile';
import { joinURL } from '@octra/utilities';

@Injectable()
export class AuthenticationEffects {
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AuthenticationActions.loginOnline.do,
        AuthenticationActions.reauthenticate.do
      ),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        return this.apiService.login(a.method, a.username, a.password).pipe(
          map((auth) => {
            if (auth.openURL !== undefined) {
              // need to open windowURL
              const cid = Date.now();
              let url = `${auth.openURL}`;
              localStorage.setItem('cid', cid.toString());

              if (a.type === AuthenticationActions.loginOnline.do.type) {
                // redirect directly
                url = `${url}?cid=${cid}&r=${encodeURIComponent(
                  joinURL(
                    document.location.href.replace(/login\/?/g, ''),
                    'intern',
                    'projects'
                  )
                )}`;

                if (auth.agreementToken) {
                  url = `${url}&t=${auth.agreementToken}`;
                  this.sessionStorageService.store('authType', a.method);
                  this.sessionStorageService.store('authenticated', false);
                }

                return AuthenticationActions.loginOnline.redirecttourl({
                  mode: LoginMode.ONLINE,
                  url,
                });
              } else {
                // redirect to new tab
                const match = /(.+\/intern\/)/g.exec(document.location.href);
                const baseURL =
                  match && match.length === 2
                    ? match[1]
                    : document.location.href;
                console.log('OPEN WINDOW');
                console.log(joinURL(baseURL, 're-authentication'));

                const bc = new BroadcastChannel('ocb_authentication');
                bc.addEventListener('message', (e) => {
                  if (e.data === true) {
                    this.store.dispatch(
                      AuthenticationActions.needReAuthentication.success({
                        actionAfterSuccess: a.actionAfterSuccess,
                      })
                    );
                    bc.close();
                  }
                });

                window.open(
                  `${url}?cid=${cid}&r=${encodeURIComponent(
                    joinURL(baseURL, 're-authentication')
                  )}`,
                  '_blank'
                );

                return AuthenticationActions.reauthenticate.wait();
              }
            } else if (auth.me) {
              this.sessionStorageService.store('webToken', auth.accessToken);
              this.sessionStorageService.store('authType', a.method);
              this.sessionStorageService.store('authenticated', true);

              if (a.type === AuthenticationActions.loginOnline.do.type) {
                if (!auth.me.last_login) {
                  this.routingService.navigate("first login", ['/load'], {
                    queryParams: {
                      first_login: true,
                    },
                  });
                } else {
                  this.routingService.navigate("normal login", ['/load']);
                }
                return AuthenticationActions.loginOnline.success({
                  mode: LoginMode.ONLINE,
                  auth,
                  method: a.method,
                });
              } else {
                return AuthenticationActions.needReAuthentication.success({
                  actionAfterSuccess: a.actionAfterSuccess,
                });
              }
            }

            return AuthenticationActions.loginOnline.success({
              mode: LoginMode.LOCAL,
              method: a.method,
              auth,
            });
          }),
          catchError((err: HttpErrorResponse) => {
            if (a.type === AuthenticationActions.loginOnline.do.type) {
              return of(AuthenticationActions.loginOnline.fail({ error: err }));
            } else {
              return of(
                AuthenticationActions.reauthenticate.fail({ error: err })
              );
            }
          })
        );
      })
    )
  );

  onLoginDemo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.loginDemo.do),
      exhaustMap(() =>
        of(
          AuthenticationActions.loginDemo.success({
            mode: LoginMode.DEMO,
          })
        )
      )
    )
  );

  onLoginLocal$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.loginLocal.do),
      exhaustMap((a) => {
        const checkInputs = () => {
          if (a.files !== undefined) {
            // get audio file
            let audiofile: File | undefined;
            for (const file of a.files) {
              if (
                AudioManager.isValidAudioFileName(
                  file.name,
                  AppInfo.audioformats
                )
              ) {
                audiofile = file;
                break;
              }
            }

            if (audiofile !== undefined) {
              return of(
                AuthenticationActions.loginLocal.success({
                  ...a,
                  sessionFile: this.getSessionFile(audiofile),
                })
              );
            } else {
              return of(
                AuthenticationActions.loginLocal.fail(
                  new Error('file not supported')
                )
              );
            }
          } else {
            return of(
              AuthenticationActions.loginLocal.fail(
                new Error('files are undefined')
              )
            );
          }
        };

        if (!a.removeData) {
          // continue with old transcript
          return checkInputs();
        } else {
          // ask for deletion of old transcript
          return from(
            this.modalsService.openModal(
              TranscriptionDeleteModalComponent,
              TranscriptionDeleteModalComponent.options
            )
          ).pipe(
            exhaustMap((value) => {
              if (value === ModalDeleteAnswer.DELETE) {
                return checkInputs();
              } else {
                return of();
              }
            })
          );
        }
      })
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.logout.do),
      exhaustMap((a) => {
        return this.apiService.logout().pipe(
          map(() => {
            this.sessionStorageService.clear();
            return AuthenticationActions.logout.success(a);
          }),
          catchError((err: HttpErrorResponse) => {
            // ignore
            this.sessionStorageService.clear();
            return of(AuthenticationActions.logout.success(a));
          })
        );
      })
    )
  );

  loginAuto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.loginAuto.do),
      exhaustMap((a) => {
        this.routingService.addStaticParams(a.params);
        return of(
          AuthenticationActions.loginAuto.success({
            method: a.method,
          })
        );
      })
    )
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.logout.success),
        tap((a) => {
          this.routingService.navigate("logout", ['/login']);
        })
      ),
    { dispatch: false }
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          AuthenticationActions.loginOnline.success,
          AuthenticationActions.loginDemo.success,
          AuthenticationActions.loginLocal.success
        ),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          if (a.mode === LoginMode.ONLINE) {
            if (state.authentication.me && state.authentication.previousUser) {
              if (
                state.authentication.me.id ===
                state.authentication.previousUser.id
              ) {
                if (state.application.mode === LoginMode.ONLINE) {
                  if (
                    state.onlineMode.previousSession?.project.id &&
                    state.onlineMode.previousSession?.task.id
                  ) {
                    // load online data after login
                    this.store.dispatch(
                      LoginModeActions.loadOnlineInformationAfterIDBLoaded.do({
                        projectID: state.onlineMode.previousSession.project.id,
                        taskID: state.onlineMode.previousSession.task.id,
                        mode: a.mode,
                        actionAfterSuccess:
                          AuthenticationActions.redirectToProjects.do(),
                      })
                    );
                  }
                }
              } else {
                this.store.dispatch(
                  AuthenticationActions.redirectToProjects.do()
                );
              }
            } else {
              this.store.dispatch(
                AuthenticationActions.redirectToProjects.do()
              );
            }
          } else {
            // is not online => load local configuration
            this.store.dispatch(
              LoginModeActions.loadOnlineInformationAfterIDBLoaded.do({
                projectID: '7234892',
                taskID: '73482',
                mode: a.mode,
              })
            );
          }
        })
      ),
    { dispatch: false }
  );

  afterIDLoadedSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoginModeActions.loadOnlineInformationAfterIDBLoaded.success),
      exhaustMap((a) => {
        if (a.actionAfterSuccess) {
          return of(a.actionAfterSuccess);
        }
        return of();
      })
    )
  );

  redirectToProjects$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.redirectToProjects.do),
        tap((a) => {
          this.routingService.navigate("redirect to projects after authentication", ['/intern/projects']);
        })
      ),
    { dispatch: false }
  );

  loadCurrentAccountInformation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoginModeActions.loadCurrentAccountInformation.do),
      exhaustMap((a) => {
        return this.apiService.getMyAccountInformation().pipe(
          exhaustMap((me) =>
            of(
              LoginModeActions.loadCurrentAccountInformation.success({
                mode: a.mode,
                actionAfterSuccess: a.actionAfterSuccess,
                me,
              })
            )
          ),
          catchError((error: HttpErrorResponse) =>
            of(
              LoginModeActions.loadCurrentAccountInformation.fail({
                error: error.error.message ?? error.message,
              })
            )
          )
        );
      })
    )
  );

  loadCurrentAccountInformationSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LoginModeActions.loadCurrentAccountInformation.success),
        tap((a) => {
          if (a.actionAfterSuccess) {
            return this.store.dispatch(a.actionAfterSuccess);
          }
        })
      ),
    { dispatch: false }
  );

  continueSessionAfterAgreement$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.continueSessionAfterAgreement.do),
      exhaustMap((a) => {
        this.apiService.webToken = a.sessionToken;
        return this.apiService.getMyAccountInformation().pipe(
          map((me) => {
            this.sessionStorageService.store('webToken', a.sessionToken);
            this.sessionStorageService.store('authType', a.method);
            this.sessionStorageService.store('authenticated', true);

            return AuthenticationActions.continueSessionAfterAgreement.success({
              sessionToken: a.sessionToken,
              me,
              method: a.method,
              params: a.params,
            });
          }),
          catchError((error: HttpErrorResponse) => {
            return of(
              AuthenticationActions.continueSessionAfterAgreement.fail({
                error,
              })
            );
          })
        );
      })
    )
  );

  continueSessionAfterAgreementSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.continueSessionAfterAgreement.success),
        tap((a) => {
          this.routingService.navigate(
              "continue after agreement",
            ['/load'],
            { queryParams: a.params },
            null
          );
        })
      ),
    { dispatch: false }
  );

  reauthenticationNeedded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.needReAuthentication.do),
        tap((a) => {
          if (!this.reauthenticationRef) {
            // TODO change
            // this.reauthenticationRef = this.modalsService.openReAuthenticationModal(this.apiService.authType, a.actionAfterSuccess);
          }
        })
      ),
    { dispatch: false }
  );

  reauthenticationSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.needReAuthentication.success),
        tap((a) => {
          this.reauthenticationRef?.close();
          this.reauthenticationRef = undefined;
          this.store.dispatch((a as any).actionAfterSuccess);
        })
      ),
    { dispatch: false }
  );

  showErrorModal$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.loginOnline.fail),
        tap((a) => {
          console.log('show error on login fail');
          this.modalsService.openModal(
            ErrorModalComponent,
            ErrorModalComponent.options,
            {
              text:
                typeof a.error === 'string'
                  ? a.error
                  : a.error?.message ?? a.error.error?.message,
            }
          );
        })
      ),
    { dispatch: false }
  );

  redirectToURL$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.loginOnline.redirecttourl),
        tap((a) => {
          setTimeout(()=> {
            document.location.href = a.url;
          }, 1000);
        })
      ),
    { dispatch: false }
  );

  private reauthenticationRef?: NgbModalRef;

  getSessionFile = (file: File) => {
    return new SessionFile(
      file.name,
      file.size,
      new Date(file.lastModified),
      file.type
    );
  };

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
    private modalsService: OctraModalService
  ) {}
}
