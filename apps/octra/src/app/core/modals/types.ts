import { Subject } from "rxjs";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

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
