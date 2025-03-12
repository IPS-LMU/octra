import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RootState } from '../index';
import { APIActions } from './api.actions';

@Injectable()
export class APIEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(APIActions.init.do),
      exhaustMap((a) => {
        return this.apiService
          .init(a.url, a.appToken, a.webToken, environment.useCookies)
          .pipe(
            map((appFeatures) =>
              APIActions.init.success({
                serverOnline: true,
                authenticated: this.apiService.authenticated,
                webToken: this.apiService.webToken,
                authType: a.authType || this.apiService.authType,
                url: a.url,
              }),
            ),
            catchError((error) => {
              // ignore error
              return of(
                APIActions.init.success({
                  serverOnline: false,
                  authenticated: this.apiService.authenticated,
                  webToken: this.apiService.webToken,
                  authType: a.authType || this.apiService.authType,
                  url: a.url,
                }),
              );
            }),
          );
      }),
    ),
  );

  constructor(
    private actions$: Actions,
    private store: Store<RootState>,
    private apiService: OctraAPIService,
  ) {}
}
