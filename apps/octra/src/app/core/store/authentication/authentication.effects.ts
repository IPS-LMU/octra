import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { TranslocoService } from '@ngneat/transloco';
import { catchError, exhaustMap, map, of, tap } from 'rxjs';
import { AuthenticationActions } from './authentication.actions';
import { joinURL } from '@octra/api-types';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RootState } from '../index';
import { OctraModalService } from '../../modals/octra-modal.service';
import { RoutingService } from '../../shared/service/routing.service';
import { ErrorModalComponent } from '../../modals/error-modal/error-modal.component';
import { withLatestFrom } from 'rxjs/operators';

@Injectable()
export class AuthenticationEffects {
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        AuthenticationActions.login.do,
        AuthenticationActions.reauthenticate.do
      ),
      withLatestFrom(this.store),
      exhaustMap(([a, state]) => {
        return this.apiService.login(a.method, a.username, a.password).pipe(
          map((dto) => {
            if (dto.openURL !== undefined) {
              // need to open windowURL
              const cid = Date.now();
              let url = `${dto.openURL}`;
              localStorage.setItem('cid', cid.toString());

              if (a.type === AuthenticationActions.login.do.type) {
                // redirect directly
                url = `${url}?cid=${cid}&r=${encodeURIComponent(
                  document.location.href
                )}`;

                if (dto.agreementToken) {
                  url = `${url}&t=${dto.agreementToken}`;
                  this.sessionStorageService.store('authType', a.method);
                  this.sessionStorageService.store('authenticated', false);
                }

                document.location.href = url;

                return AuthenticationActions.login.success({
                  auth: dto,
                  method: a.method,
                  mode: state.application.mode!,
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
            } else if (dto.me) {
              this.sessionStorageService.store('webToken', dto.accessToken);
              this.sessionStorageService.store('authType', a.method);
              this.sessionStorageService.store('authenticated', true);

              if (a.type === AuthenticationActions.login.do.type) {
                if (!dto.me.last_login) {
                  this.routingService.navigate(['/loading'], {
                    queryParams: {
                      first_login: true,
                    },
                  });
                } else {
                  this.routingService.navigate(['/loading']);
                }
                return AuthenticationActions.login.success({
                  auth: dto,
                  method: a.method,
                  mode: state.application.mode!,
                });
              } else {
                return AuthenticationActions.needReAuthentication.success({
                  actionAfterSuccess: a.actionAfterSuccess,
                });
              }
            }
            return AuthenticationActions.login.success({
              auth: dto,
              method: a.method,
              mode: state.application.mode!,
            });
          }),
          catchError((err: HttpErrorResponse) => {
            if (a.type === AuthenticationActions.login.do.type) {
              return of(AuthenticationActions.login.fail({ error: err }));
            } else {
              return of(AuthenticationActions.login.fail({ error: err }));
            }
          })
        );
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
          this.routingService.navigate(['/login']);
        })
      ),
    { dispatch: false }
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthenticationActions.login.success),
        tap((a) => {
          this.routingService.navigate(['/user/projects']);

          // TODO api
          // 1. Save loginData to store and IDB
          // 2. Create Actions and Reducers for startOnlineAnnotation
          // 4. After project selected, dispatch startOnlineAnnotation with retrieved transcript, save data to store and IDB
          // 5. Redirect to transcr section
          // 6. Make sure that all data persists, even after reload
          // 7. Send transcription to server and retrieve next one (it's AnnotJSON). Make sure it's saved.
          // 8. Load new transcript and redirect to transcr
          // 9. Check logout/login
          // 10. Add person icon to navbar with menu for signout, etc.
          // 11. Add information about project to the navbar.
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
            ['/loading'],
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
        ofType(AuthenticationActions.login.fail),
        tap((a) => {
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

  private reauthenticationRef?: NgbModalRef;

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
