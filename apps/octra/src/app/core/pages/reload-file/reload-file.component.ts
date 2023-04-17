import { Component, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { TranslocoService } from "@ngneat/transloco";
import { AppInfo } from "../../../app.info";
import { ModalService } from "../../modals/modal.service";
import {
  TranscriptionStopModalAnswer,
  TranscriptionStopModalComponent
} from "../../modals/transcription-stop-modal/transcription-stop-modal.component";
import { SessionFile } from "../../obj/SessionFile";
import { AudioService, TranscriptionService } from "../../shared/service";
import { AppStorageService } from "../../shared/service/appstorage.service";
import { OctraDropzoneComponent } from "../../component/octra-dropzone/octra-dropzone.component";
import { FileSize, getFileSize, navigateTo } from "@octra/utilities";
import { OIDBLevel, OIDBLink } from "@octra/annotation";
import {
  TranscriptionDeleteModalComponent
} from "../../modals/transcription-delete-modal/transcription-delete-modal.component";
import { ErrorModalComponent } from "../../modals/error-modal/error-modal.component";

@Component({
  selector: "octra-reload-file",
  templateUrl: "./reload-file.component.html",
  styleUrls: ["./reload-file.component.scss"]
})
export class ReloadFileComponent {

  @ViewChild("dropzone", { static: true }) dropzone: OctraDropzoneComponent;
  private error = "";

  get sessionfile(): SessionFile {
    return this.appStorage.sessionfile;
  }

  constructor(public router: Router,
              public appStorage: AppStorageService,
              public transcrServ: TranscriptionService,
              public modService: ModalService,
              public langService: TranslocoService,
              private audioService: AudioService) {
  }

  abortTranscription = () => {
    this.transcrServ.endTranscription();
    this.appStorage.logout();
  };

  newTranscription = () => {
    this.modService.openModal(TranscriptionDeleteModalComponent, TranscriptionDeleteModalComponent.options).then((decision) => {
      if (decision === "DELETE") {
        let keepData = false;

        new Promise<void>((resolve) => {
          if (!(this.dropzone.oannotation === undefined)) {
            const newLevels: OIDBLevel[] = [];
            for (let i = 0; i < this.dropzone.oannotation.levels.length; i++) {
              newLevels.push(new OIDBLevel(i + 1, this.dropzone.oannotation.levels[i], i));
            }

            const newLinks: OIDBLink[] = [];
            for (let i = 0; i < this.dropzone.oannotation.links.length; i++) {
              newLinks.push(new OIDBLink(i + 1, this.dropzone.oannotation.links[i]));
            }
            this.appStorage.overwriteAnnotation(newLevels, newLinks);

            keepData = true;
            resolve();
          } else {
            this.appStorage.clearAnnotationPermanently();
            resolve();
          }
        }).then(() => {
          this.audioService.registerAudioManager(this.dropzone.audioManager);
          this.appStorage.clearLoggingDataPermanently();
          this.appStorage.beginLocalSession(this.dropzone.files, keepData).then(this.navigate).catch((error) => {
            if (error === "file not supported") {
              this.showErrorMessage(this.langService.translate("reload-file.file not supported", { type: "" }));
            }
          });
        });
      } else {
        // do nothing because abort
      }
    }).catch((error) => {
      console.error(error);
    });
  };

  onOfflineSubmit = () => {
    this.audioService.registerAudioManager(this.dropzone.audioManager);
    this.appStorage.beginLocalSession(this.dropzone.files, true).then(this.navigate).catch((error) => {
      if (error === "file not supported") {
        this.showErrorMessage(this.langService.translate("reload-file.file not supported", { type: "" }));
      }
    });
  };

  public isN(obj: any): boolean {
    return (obj === undefined || false);
  }

  getDropzoneFileString(file: File | SessionFile) {
    if (!(file === undefined)) {
      const fsize: FileSize = getFileSize(file.size);
      return `${file.name} (${(Math.round(fsize.size * 100) / 100)} ${fsize.label})`;
    }
    return "[FILE UNDEFINED]";
  }

  askForAbort() {
    this.modService.openModal(TranscriptionStopModalComponent, TranscriptionStopModalComponent.options).then((answer: TranscriptionStopModalAnswer) => {
      if (answer === TranscriptionStopModalAnswer.QUIT) {
        this.abortTranscription();
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  private navigate = () => {
    navigateTo(this.router, ["/user/load"], AppInfo.queryParamsHandling).catch((error) => {
      console.error(error);
    });
  };

  private showErrorMessage(err: string) {
    this.error = err;
    this.modService.openModal(ErrorModalComponent, ErrorModalComponent.options, {
      text: err
    }).catch((error) => {
      console.error(error);
    });
  }
}
