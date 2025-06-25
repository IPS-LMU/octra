import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'octra-error404',
  templateUrl: './error404.component.html',
  styleUrls: ['./error404.component.scss'],
})
export class Error404Component {
  router = inject(Router);
}
