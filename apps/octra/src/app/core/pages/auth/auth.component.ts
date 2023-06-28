import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { interval } from "rxjs";
import { NavbarService } from "../../component/navbar/navbar.service";
import { DefaultComponent } from "../../component/default.component";

@Component({
  selector: "octra-auth",
  templateUrl: "./auth.component.html",
  styleUrls: ["./auth.component.scss"]
})
export class AuthComponent extends DefaultComponent implements OnInit {
  private _secondsToClose = 10;

  get secondsToClose(): number {
    return this._secondsToClose;
  }

  constructor(private router: Router, private navbarService: NavbarService) {
    super();
    this.navbarService.showNavbar = false;
    this.subscrManager.add(interval(1000).subscribe({
      next: () => {
        if (this._secondsToClose <= 0) {
          window.close();
        }
        this._secondsToClose--;
      }
    }));
  }

  ngOnInit() {
    // if this is accessed, the authentication was valid
    window.postMessage("authenticated", window.origin);
  }
}
