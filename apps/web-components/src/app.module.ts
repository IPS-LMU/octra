import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  AudioplayerComponent,
  AudioViewerComponent,
  OctraComponentsModule,
} from '@octra/ngx-components';
import { createCustomElement } from '@angular/elements';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';

@NgModule({
  declarations: [],
  imports: [BrowserModule, OctraUtilitiesModule, OctraComponentsModule],
  providers: [],
  exports: [],
})
export class AppModule implements DoBootstrap {
  constructor(private injector: Injector) {}

  ngDoBootstrap() {
    const audioPlayer = createCustomElement(AudioplayerComponent, {
      injector: this.injector,
    });
    customElements.define('octra-audioplayer', audioPlayer);

    const audioViewer = createCustomElement(AudioViewerComponent, {
      injector: this.injector,
    });
    customElements.define('octra-audioviewer', audioViewer);
  }
}
