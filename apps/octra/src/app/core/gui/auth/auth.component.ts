import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {interval, Subscription} from 'rxjs';
import {NavbarService} from '../navbar/navbar.service';

@Component({
  selector: 'octra-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, OnDestroy {
  private interval: Subscription;

  private _secondsToClose = 10;

  get secondsToClose(): number {
    return this._secondsToClose;
  }

  constructor(private router: Router, private navbarService: NavbarService) {
    this.navbarService.showNavbar = false;
    this.interval = interval(1000).subscribe(() => {
      if (this._secondsToClose <= 0) {
        window.close();
      }
      this._secondsToClose--;
    });
  }

  ngOnInit() {
    // if this is accessed, the authentication was valid
    window.postMessage('authenticated', window.origin);
  }

  ngOnDestroy(): void {
    this.interval.unsubscribe();
  }
}
