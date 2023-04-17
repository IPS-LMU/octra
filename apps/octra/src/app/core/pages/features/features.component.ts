import { Component } from "@angular/core";

@Component({
  selector: 'octra-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss']
})
export class FeaturesComponent {

  public loaded = false;

  onLoad() {
    this.loaded = true;
  }
}
