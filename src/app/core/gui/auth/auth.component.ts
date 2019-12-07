import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AppStorageService} from '../../shared/service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  constructor(private router: Router, private appStorage: AppStorageService) {
  }

  ngOnInit() {
    // if this is accessed, the authentication was valid
    this.router.navigate(['/user/transcr'])
  }
}
