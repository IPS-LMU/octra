import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Action } from "@ngrx/store";
import { ConfigurationService } from "../../shared/service/configuration.service";
import { uniqueHTTPRequest } from "@octra/ngx-utilities";
import { HttpClient } from "@angular/common/http";
import { TranslocoService } from "@ngneat/transloco";
import { ConfigurationActions } from "./configuration.actions";
import { Subject } from "rxjs";
import { exhaustMap } from "rxjs/operators";
import "../../schemata/appconfig.schema";

declare let validateAnnotation: ((string, any) => any);
declare let tidyUpAnnotation: ((string, any) => any);

@Injectable()
export class ConfigurationEffects {
  // TODO remove this class
  loadValidationMethods$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.loadGuidelinesSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      uniqueHTTPRequest(this.http, false, {
        responseType: "text"
      }, action.guidelines.meta.validation_url, undefined).subscribe(
        () => {
          const js = document.createElement("script");

          js.type = "text/javascript";
          js.src = action.guidelines.meta.validation_url;
          js.id = "validationJS";
          js.onload = () => {
            if (
              (typeof validateAnnotation !== "undefined") && typeof validateAnnotation === "function" &&
              (typeof tidyUpAnnotation !== "undefined") && typeof tidyUpAnnotation === "function"
            ) {
              subject.next(ConfigurationActions.loadMethodsSuccess({
                validate: validateAnnotation,
                tidyUp: tidyUpAnnotation
              }));
              console.log("Methods loaded.");
            } else {
              subject.next(ConfigurationActions.loadMethodsFailed({
                error: "Loading functions failed [Error: S02]"
              }));
            }
          };
          document.body.appendChild(js);
        },
        () => {
          subject.next(ConfigurationActions.loadMethodsFailed({
            error: "Loading functions failed [Error: S01]"
          }));
        }
      );

      return subject;
    })
  ));

  constructor(private actions$: Actions,
              private configurationService: ConfigurationService,
              private http: HttpClient,
              private languageService: TranslocoService) {
  }

}
