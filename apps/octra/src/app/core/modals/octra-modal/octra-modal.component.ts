import { Component, EventEmitter, OnDestroy, OnInit } from "@angular/core";
import { AppInfo } from "../../../app.info";
import { hasProperty, SubscriptionManager } from "@octra/utilities";
import { APIService } from "../../shared/service";
import { AppStorageService } from "../../shared/service/appstorage.service";
import { BugReportService } from "../../shared/service/bug-report.service";
import { ModalService } from "../modal.service";
import { Subscription } from "rxjs";
import { YesNoModalComponent } from "../yes-no-modal/yes-no-modal.component";
import { LoginInvalidModalComponent } from "../login-invalid-modal/login-invalid-modal.component";
import { TranscriptionDeleteModalComponent } from "../transcription-delete-modal/transcription-delete-modal.component";
import { TranscriptionStopModalComponent } from "../transcription-stop-modal/transcription-stop-modal.component";
import { ErrorModalComponent } from "../error-modal/error-modal.component";
import { BugreportModalComponent } from "../bugreport-modal/bugreport-modal.component";
import { SupportedFilesModalComponent } from "../supportedfiles-modal/supportedfiles-modal.component";

@Component({
  selector: "octra-modal",
  templateUrl: "./octra-modal.component.html",
  styleUrls: ["./octra-modal.component.scss"]
})
export class OctraModalComponent implements OnInit, OnDestroy {
  modals = {
    error: {
      visible: false,
      type: ErrorModalComponent
    },
    bugreport: {
      visible: false,
      type: BugreportModalComponent
    },
    supportedfiles: {
      visible: false,
      type: SupportedFilesModalComponent
    },
    yesno: {
      visible: false,
      type: YesNoModalComponent
    },
    loginInvalid: {
      visible: false,
      type: LoginInvalidModalComponent
    },
    transcriptionDelete: {
      visible: false,
      type: TranscriptionDeleteModalComponent
    },
    transcriptionStop: {
      visible: false,
      type: TranscriptionStopModalComponent
    }
  };

  public bgdescr = "";
  public bgemail = "";
  public sendproObj = true;
  public bugsent = false;
  public data: any;
  private _subscrmanager: SubscriptionManager<Subscription>;

  public get AppInfo(): any {
    return AppInfo;
  }

  constructor(private modService: ModalService,
              public bugService: BugReportService,
              private api: APIService,
              private appStorage: AppStorageService) {
  }

  ngOnInit() {
    this.bgemail = (this.appStorage.userProfile.email !== undefined) ? this.appStorage.userProfile.email : "";
    this._subscrmanager = new SubscriptionManager<Subscription>();

    this._subscrmanager.add(this.modService.showmodal.subscribe(
      (result: any) => {
        this.data = result;

        if (result.type !== undefined) {
          this.openModal(result.type).then((answer) => {
            result.emitter.emit(answer);
          }).catch((error) => {
            console.error(error);
          });
        } else {
          const emitter: EventEmitter<any> = result.emitter;
          emitter.error("modal function not supported");
        }
      }));
  }

  ngOnDestroy() {
    this._subscrmanager.destroy();
  }

  openModal(name: string, data?: any): Promise<any> {
    if (hasProperty(this.modals, name)) {
      if (hasProperty(this.modals, name)) {
        if (!this.modals[name].visible) {
          this.modals[name].visible = true;
          return this.modService.openModal(this.modals[name].type, this.modals[name].type.options, data).then(() => {
            this.modals[name].visible = false;
          });
        }
        return new Promise<void>((resolve) => {
          resolve();
        });
      } else {
        return new Promise<any>((reject) => {
          reject(new Error(`Can't find modal configuration for name ${name}`));
        });
      }
    }
    return new Promise<any>((reject) => {
      reject(new Error("Can't find modal with that name."));
    });
  }
}
