import { Injectable } from "@angular/core";
import { RootState } from "../index";
import { Store } from "@ngrx/store";
import { ApplicationActions } from "./application.actions";

@Injectable({
  providedIn: "root"
})
export class ApplicationStoreService {
  constructor(private store: Store<RootState>) {
  }

  public initApplication() {
    this.store.dispatch(ApplicationActions.initApplication.do());
  }
}
