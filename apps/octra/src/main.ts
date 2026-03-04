import { bootstrapApplication } from '@angular/platform-browser';
import 'jodit/esm/plugins/justify/justify.js';
import { AppComponent, appConfig } from './app';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
