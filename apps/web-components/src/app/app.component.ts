import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OctraComponentsModule } from '@octra/ngx-components';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';

@Component({
  imports: [RouterOutlet, OctraUtilitiesModule, OctraComponentsModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  /* ngDoBootstrap() {
    const audioPlayer = createCustomElement(AudioplayerComponent, {
      injector: this.injector,
    });
    customElements.define('octra-audioplayer', audioPlayer);

    const audioViewer = createCustomElement(AudioViewerComponent, {
      injector: this.injector,
    });
    customElements.define('octra-audioviewer', audioViewer);
  } */
}
