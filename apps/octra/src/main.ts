import '@angular/localize/init';
import { bootstrapApplication } from '@angular/platform-browser';
import 'jodit/esm/plugins/justify/justify.js';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
