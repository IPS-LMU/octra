import { NgStyle } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'octra-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
  imports: [NgStyle],
})
export class FeaturesComponent {
  public loaded = false;

  onLoad() {
    this.loaded = true;
  }
}
