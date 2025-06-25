import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { appendURLQueryParams, joinURL } from '@octra/utilities';
import {
  AudioManager,
  getBaseHrefURL,
  normalizeMimeType,
  popupCenter,
} from '@octra/web-media';
import { SessionStorageService } from 'ngx-webstorage';
import {
  catchError,
  exhaustMap,
  from,
  map,
  of,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';
import { AppInfo } from '../../../app.info';
import { ErrorModalComponent } from '../../modals/error-modal/error-modal.component';
import { OctraModalService } from '../../modals/octra-modal.service';
import {
  ModalDeleteAnswer,
  TranscriptionDeleteModalComponent,
} from '../../modals/transcription-delete-modal/transcription-delete-modal.component';
import { SessionFile } from '../../obj/SessionFile';
import { AlertService } from '../../shared/service';
import { RoutingService } from '../../shared/service/routing.service';
import { ApplicationActions } from '../application/application.actions';
import { checkAndThrowError } from '../error.handlers';
import { IDBActions } from '../idb/idb.actions';
import { LoginMode, RootState } from '../index';
import { LoginModeActions } from '../login-mode/login-mode.actions';
import { AuthenticationActions } from './authentication.actions';

@Injectable()
export class AuthenticationEffects {
  private actions$ = inject(Actions);
  private store = inject<Store<RootState>>(Store);
  private apiService = inject(OctraAPIService);
  private alertService = inject(AlertService);
  private sessionStorageService = inject(SessionStorageService);
  private transloco = inject(TranslocoService);
  private routingService = inject(RoutingService);
  private modalsService = inject(OctraModalService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AuthenticationActions.loginOnline.do,
        AuthenticationActions.reauthenticate.do,
      ),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        const waitForWindowResponse = (
          actionAfterSuccess: Action | undefined,
          url: string,
          params: Record<string, string | number | undefined | null | boolean>,
        ) => {
          const baseURL = getBaseHrefURL();

          const bc = new BroadcastChannel('ocb_authentication');
          bc.addEventListener('message', (e) => {
            if (e.data === true) {
              this.store.dispatch(
                AuthenticationActions.needReAuthentication.success({
                  actionAfterSuccess,
                }),
              );
              bc.close();
            }
          });

          params = {
            ...params,
            r: joinURL(baseURL, 'auth-success'),
          };

          const newURL = appendURLQueryParams(url, params);
          popupCenter(
            newURL,
            'Octra-Backend - Authenticate via Shibboleth',
            760,
            760,
          );

          return AuthenticationActions.reauthenticate.wait();
        };

        if (
          a.type === AuthenticationActions.reauthenticate.do.type &&
          [LoginMode.DEMO, LoginMode.LOCAL].includes(state.application.mode!)
        ) {
          // local re-authentication
          if (
            state.application.appConfiguration?.octra.plugins?.asr
              ?.shibbolethURL
          ) {
            return of(
              waitForWindowResponse(
                a.actionAfterSuccess,
                state.application.appConfiguration?.octra.plugins.asr
                  .shibbolethURL,
                {
                  nc: true,
                  cid: Date.now(),
                },
              ),
            );
          } else {
            return of(
              AuthenticationActions.reauthenticate.fail({
                error: 'Missing Shibboleth URL in application settings.',
              }),
            );
          }
        }

        return this.apiService.login(a.method, a.username, a.password).pipe(
          map((auth) => {
            if (auth.openURL !== undefined) {
              // need to open windowURL
              const urlParams = {
                cid: Date.now(),
                r: joinURL(
                  document.location.href.replace(/login\/?/g, ''),
                  'intern',
                  'projects',
                ),
                uuid: this.apiService.appProperties.server.uuid,
                t: auth.agreementToken,
              };
              let url = `${auth.openURL}`;
              localStorage.setItem('cid', urlParams.cid.toString());

              if (a.type === AuthenticationActions.loginOnline.do.type) {
                // redirect directly
                url = appendURLQueryParams(url, urlParams);

                if (auth.agreementToken) {
                  this.sessionStorageService.store('authType', a.method);
                  this.sessionStorageService.store('authenticated', false);
                }

                return AuthenticationActions.loginOnline.redirectToURL({
                  mode: LoginMode.ONLINE,
                  url,
                });
              } else {
                // redirect to new window
                return waitForWindowResponse(
                  a.actionAfterSuccess,
                  url,
                  urlParams,
                );
              }
            } else if (auth.me) {
              this.sessionStorageService.store('webToken', auth.accessToken);
              this.sessionStorageService.store('authType', a.method);
              this.sessionStorageService.store('authenticated', true);

              if (a.type === AuthenticationActions.loginOnline.do.type) {
                if (!auth.me.last_login) {
                  this.routingService.navigate('first login', ['/load'], {
                    queryParams: {
                      first_login: true,
                    },
                  });
                } else {
                  this.routingService.navigate('normal login', ['/load']);
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
                AuthenticationActions.reauthenticate.fail({
                  error: err?.error?.message ?? err?.message,
                }),
              );
            }
          }),
        );
      }),
    ),
  );

  onLoginDemo$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.loginDemo.do),
      exhaustMap(() => {
        this.store.dispatch(ApplicationActions.waitForEffects.do());
        return of(
          AuthenticationActions.loginDemo.success({
            mode: LoginMode.DEMO,
          }),
        );
      }),
    ),
  );

  onLoginURL$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.loginURL.do),
      exhaustMap(() => {
        this.store.dispatch(ApplicationActions.waitForEffects.do());
        return of(
          AuthenticationActions.loginURL.success({
            mode: LoginMode.URL,
          }),
        );
      }),
    ),
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
                  AppInfo.audioformats,
                )
              ) {
                audiofile = file;
                break;
              }
            }

            if (audiofile !== undefined) {
              this.store.dispatch(
                AuthenticationActions.loginLocal.prepare({
                  ...a,
                  sessionFile: this.getSessionFile(audiofile),
                }),
              );
              return this.actions$.pipe(
                ofType(IDBActions.saveModeOptions.success),
                take(1),
                exhaustMap(() => {
                  return of(
                    AuthenticationActions.loginLocal.success({
                      ...a,
                      sessionFile: this.getSessionFile(audiofile!),
                    }),
                  );
                }),
              );
            } else {
              return of(
                AuthenticationActions.loginLocal.fail(
                  new Error('file not supported'),
                ),
              );
            }
          } else {
            return of(
              AuthenticationActions.loginLocal.fail(
                new Error('files are undefined'),
              ),
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
              TranscriptionDeleteModalComponent.options,
            ),
          ).pipe(
            exhaustMap((value) => {
              if (value === ModalDeleteAnswer.DELETE) {
                return checkInputs();
              } else {
                return of();
              }
            }),
          );
        }
      }),
    ),
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.logout.do),
      withLatestFrom(this.store),
      exhaustMap(([action, state]) => {
        if (state.application.mode === LoginMode.ONLINE) {
          return this.apiService.logout().pipe(
            map(() => {
              this.sessionStorageService.clear();
              return AuthenticationActions.logout.success(action);
            }),
            catchError((err: HttpErrorResponse) => {
              // ignore
              this.sessionStorageService.clear();
              return of(AuthenticationActions.logout.success(action));
            }),
          );
        }
        this.sessionStorageService.clear();
        return of(AuthenticationActions.logout.success(action));
      }),
    ),
  );

  loginAuto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthenticationActions.loginAuto.do),
      exhaustMap((a) => {
        this.routingService.addStaticParams(a.params);
        return of(
          AuthenticationActions.loginAuto.success({
            method: a.method,
          }),
        );
      }),
    ),
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          AuthenticationActions.loginOnline.success,
          AuthenticationActions.loginDemo.success,
          AuthenticationActions.loginURL.success,
          AuthenticationActions.loginLocal.success,
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
                      LoginModeActions.loadProjectAndTaskInformation.do({
                        projectID: state.onlineMode.previousSession.project.id,
                        taskID: state.onlineMode.previousSession.task.id,
                        mode: a.mode,
                      }),
                    );
                  } else {
                    this.store.dispatch(
                      AuthenticationActions.redirectToProjects.do(),
                    );
                  }
                }
              } else {
                this.store.dispatch(
                  AuthenticationActions.redirectToProjects.do(),
                );
              }
            } else {
              this.store.dispatch(
                AuthenticationActions.redirectToProjects.do(),
              );
            }
          } else if (state.application.mode) {
            // is not online => load local configuration
            this.store.dispatch(
              LoginModeActions.loadProjectAndTaskInformation.do({
                projectID: '7234892',
                taskID: '73482',
                mode: a.mode,
              }),
            );
          } else {
            // mode is undefined
            this.routingService.navigate('redirect because mode is undefined', [
              '/login',
            ]);
          }
        }),
      ),
    { dispatch: false },
  );

  redirectToProjects$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.redirectToProjects.do),
        tap((a) => {
          this.routingService.navigate(
            'redirect to projects after authentication',
            ['/intern/projects'],
          );
        }),
      ),
    { dispatch: false },
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
              }),
            ),
          ),
          catchError((error: HttpErrorResponse) =>
            checkAndThrowError(
              {
                statusCode: error.status,
                message: error.error?.message ?? error.message,
              },
              a,
              LoginModeActions.loadCurrentAccountInformation.fail({
                error: error.error.message ?? error.message,
              }),
              this.store,
              () => {
                this.alertService.showAlert(
                  'danger',
                  error.error?.message ?? error.message,
                );
              },
            ),
          ),
        );
      }),
    ),
  );

  loadCurrentAccountInformationSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LoginModeActions.loadCurrentAccountInformation.success),
        tap((a) => {
          if (a.actionAfterSuccess) {
            return this.store.dispatch(a.actionAfterSuccess);
          }
        }),
      ),
    { dispatch: false },
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
              }),
            );
          }),
        );
      }),
    ),
  );

  continueSessionAfterAgreementSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.continueSessionAfterAgreement.success),
        tap((a) => {
          this.routingService.navigate(
            'continue after agreement',
            ['/load'],
            { queryParams: a.params },
            null,
          );
        }),
      ),
    { dispatch: false },
  );

  reauthenticationNeedded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.needReAuthentication.do),
        withLatestFrom(this.store),
        tap(([a, state]) => {
          if (!this.reauthenticationRef) {
            this.reauthenticationRef =
              this.modalsService.openReAuthenticationModal(
                a.forceAuthentication ?? state.authentication.type!,
                a.forceLogout,
                a.actionAfterSuccess,
              );
            const subscr = this.reauthenticationRef.closed.subscribe({
              next: () => {
                subscr.unsubscribe();
                this.reauthenticationRef = undefined;
              },
            });
          }
        }),
      ),
    { dispatch: false },
  );

  reauthenticationSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.needReAuthentication.success),
        tap((a) => {
          this.reauthenticationRef?.close();
          this.reauthenticationRef = undefined;
          if (a.actionAfterSuccess) {
            this.store.dispatch((a as any).actionAfterSuccess);
          }
        }),
      ),
    { dispatch: false },
  );

  showErrorModal$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.loginOnline.fail),
        tap((a) => {
          this.modalsService.openModal(
            ErrorModalComponent,
            ErrorModalComponent.options,
            {
              text: a.error.error?.message ?? a.error?.message ?? a.error,
            },
          );
        }),
      ),
    { dispatch: false },
  );

  redirectToURL$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.loginOnline.redirectToURL),
        tap((a) => {
          setTimeout(() => {
            document.location.href = a.url;
          }, 1000);
        }),
      ),
    { dispatch: false },
  );

  private reauthenticationRef?: NgbModalRef;
  forceLogout = false;

  getSessionFile = (file: File) => {
    return new SessionFile(
      file.name,
      file.size,
      new Date(file.lastModified),
      normalizeMimeType(file.type),
    );
  };
}
