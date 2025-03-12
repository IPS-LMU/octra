import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { interval } from 'rxjs';
import { DefaultComponent } from '../../../component/default.component';
import { NavbarService } from '../../../component/navbar/navbar.service';

@Component({
  selector: 'octra-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  imports: [TranslocoPipe],
})
export class AuthComponent extends DefaultComponent implements OnInit {
  private _secondsToClose = 10;

  get secondsToClose(): number {
    return this._secondsToClose;
  }

  constructor(
    private router: Router,
    private navbarService: NavbarService,
  ) {
    super();
    this.navbarService.showNavbar = false;
    this.subscribe(interval(1000), {
      next: () => {
        if (this._secondsToClose <= 0) {
          window.close();
        }
        this._secondsToClose--;
      },
    });
  }

  ngOnInit() {
    // if this is accessed, the authentication was valid
    window.postMessage('authenticated', window.origin);
  }
}
