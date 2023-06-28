import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { SettingsService, TranscriptionService, UserInteractionsService } from "../../shared/service";
import { AsrService } from "../../shared/service/asr.service";
import { DefaultComponent } from "../../component/default.component";

@Component({
  selector: "octra-members-area",
  templateUrl: "./members-area.component.html",
  styleUrls: ["./members-area.component.scss"],
  providers: [UserInteractionsService, TranscriptionService, AsrService]
})
export class MembersAreaComponent extends DefaultComponent {

  constructor(private router: Router,
              private settService: SettingsService) {
    super();
    document.body.setAttribute("style", "overflow:hidden");
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    document.body.removeAttribute("style");
  }
}
