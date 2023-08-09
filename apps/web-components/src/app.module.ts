import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  AudioplayerComponent,
  AudioViewerComponent,
  OctraComponentsModule,
} from '@octra/ngx-components';
import { createCustomElement } from '@angular/elements';
import { NgxUtilitiesPipesModule } from '@octra/ngx-utilities';

@NgModule({
  declarations: [],
  imports: [BrowserModule, NgxUtilitiesPipesModule, OctraComponentsModule],
  providers: [],
  exports: [],
})
export class AppModule implements DoBootstrap {
  constructor(private injector: Injector) {}

  ngDoBootstrap() {
    const audioPlayer = createCustomElement(AudioplayerComponent, {
      injector: this.injector,
    });
    customElements.define('oc-audioplayer', audioPlayer);

    const audioViewer = createCustomElement(AudioViewerComponent, {
      injector: this.injector,
    });
    customElements.define('oc-audioviewer', audioViewer);
  }
}
