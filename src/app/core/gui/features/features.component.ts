import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css']
})
export class FeaturesComponent implements OnInit {

  public loaded = false;

  constructor() {
  }

  ngOnInit() {
  }

  onLoad() {
    this.loaded = true;
  }
}
