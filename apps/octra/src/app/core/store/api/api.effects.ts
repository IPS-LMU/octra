import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { OctraAPIService } from "@octra/ngx-octra-api";
import { exhaustMap, of } from "rxjs";
import { APIActions } from "./api.actions";
import { RootState } from "../index";
import { environment } from "../../../../environments/environment";

@Injectable()
export class APIEffects {
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(APIActions.init.do),
      exhaustMap((a) => {
        this.apiService.init(a.url, a.appToken, a.webToken, environment.production);
        return of(
          APIActions.init.success({
            authenticated: a.authenticated,
            webToken: a.webToken,
            authType: a.authType,
            url: a.url
          })
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store<RootState>,
    private apiService: OctraAPIService
  ) {
  }
}
