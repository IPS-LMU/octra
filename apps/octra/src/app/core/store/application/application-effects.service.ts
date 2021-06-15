import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {exhaustMap} from 'rxjs/operators';
import {Subject, timer} from 'rxjs';
import {Action, Store} from '@ngrx/store';
import {SessionStorageService} from 'ngx-webstorage';
import {ApplicationActions} from '../application/application.actions';
import {OnlineModeActions} from '../modes/online-mode/online-mode.actions';
import {LocalModeActions} from '../modes/local-mode/local-mode.actions';


@Injectable({
  providedIn: 'root'
})
export class ApplicationEffects {
  logoutSession$ = createEffect(() => this.actions$.pipe(
    ofType(OnlineModeActions.logout, LocalModeActions.logout),
    exhaustMap((action) => {
      this.sessStr.clear();
      // clear undo history
      this.store.dispatch(ApplicationActions.clear());

      const subject = new Subject<Action>();

      timer(10).subscribe(() => {
        if (action.type === OnlineModeActions.logout.type) {
          subject.next(OnlineModeActions.clearSessionStorageSuccess());
        } else {
          subject.next(LocalModeActions.clearSessionStorageSuccess());
        }
        subject.complete();
      });

      return subject;
    })
  ));

  constructor(private actions$: Actions,
              private sessStr: SessionStorageService,
              private store: Store) {
  }
}
