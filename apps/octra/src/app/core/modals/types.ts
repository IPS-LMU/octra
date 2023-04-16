import { EventEmitter } from "@angular/core";
import { Subject } from "rxjs";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

export const modalConfigurations = {
  bugreport: {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: false,
    class: "modal-xl"
  },
  error: {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: true
  },
  export: {
    keyboard: true,
    backdrop: true,
    scroll: true,
    ignoreBackdropClick: false,
    class: "modal-xl"
  },
  help: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true,
    class: "modal-lg"
  },
  inactivity: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  },
  missingPermission: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  },
  prompt: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    scroll: true,
    class: "modal-lg"
  },
  tools: {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: false,
    scroll: true,
    class: "modal-xl"
  },
  protected: {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: true
  },
  transcriptionDelete: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  },
  transcriptionDemoEnd: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: true
  },
  transcriptionGuidelines: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    scroll: true,
    class: "modal-lg"
  },
  transcriptionSend: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  },
  transcriptionSending: {
    keyboard: false,
    backdrop: true,
    ignoreBackdropClick: true
  },
  transcriptionStop: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  },
  yesNo: {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  }
};

export class OctraModal {
  public readonly name: string;
  protected activeModal: NgbActiveModal;
  public action: Subject<unknown>;

  protected constructor(name: string, activeModal: NgbActiveModal) {
    this.name = name;
    this.activeModal = activeModal;
  }

  public close(action?: unknown) {
    this.activeModal.close(action);
  }

  public applyAction(action: any) {
    this.action.next(action);
  }
}
