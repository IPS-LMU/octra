import { NgModule } from '@angular/core';
import { OctraComponentsModule } from '@octra/ngx-components';
import { AuthComponent } from './auth';
import { LoadingComponent } from '../loading';
import { ProjectsListComponent } from './projects-list';
import { ReloadFileComponent } from './reload-file';
import { TranscriptionComponent } from './transcription';
import { TranscriptionEndComponent } from './transcription-end';
import { InternComponent } from './intern.component';
import { FastbarComponent } from '../../component';
import { AudioNavigationComponent } from '../../component/audio-navigation';
import { LoadeditorDirective } from '../../shared/directive/loadeditor.directive';
import {
  DictaphoneEditorComponent,
  LinearEditorComponent,
  TrnEditorComponent,
  TwoDEditorComponent,
} from '../../../editors';
import { NewEditorComponent } from '../../../editors/new-editor/new-editor.component';
import { TranscrWindowComponent } from '../../../editors/2D-editor/transcr-window';
import { ErrorOccurredComponent } from '../../alerts/error-occurred/error-occurred.component';
import { ContextMenuComponent } from '../../component/context-menu/context-menu.component';
import { DynComponentDirective } from '../../shared/directive/dyn-component.directive';
import { PermutationsReplaceModalComponent } from '../../../editors/trn-editor/modals/permutations-replace-modal/permutations-replace-modal.component';
import { CommonModule } from '@angular/common';
import { AppSharedModule } from '../../../app.shared.module';
import { AuthenticationNeededComponent } from '../../alerts/authentication-needed/authentication-needed.component';
import { InternRoutingModule } from './intern-routing.module';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { StoreModule } from '@ngrx/store';
import { LoginModeReducers } from '../../store/login-mode';
import { LoginMode } from '../../store';
import { EffectsModule } from '@ngrx/effects';
import { AnnotationEffects } from '../../store/login-mode/annotation/annotation.effects';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { AuthSuccessPageComponent } from './auth-success/auth-success.page.component';
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';

export const ALERTS: any[] = [AuthenticationNeededComponent];

export const EDITORS: any[] = [
  DictaphoneEditorComponent,
  TwoDEditorComponent,
  LinearEditorComponent,
  TrnEditorComponent,
];

@NgModule({
  declarations: [
    AuthComponent,
    LoadingComponent,
    ProjectsListComponent,
    ReloadFileComponent,
    TranscriptionComponent,
    TranscriptionEndComponent,
    FastbarComponent,
    AudioNavigationComponent,
    LoadingComponent,
    LoadeditorDirective,
    EDITORS,
    NewEditorComponent,
    InternComponent,
    TranscrWindowComponent,
    AuthComponent,
    ErrorOccurredComponent,
    ContextMenuComponent,
    ProjectsListComponent,
    DynComponentDirective,
    PermutationsReplaceModalComponent,
    AuthSuccessPageComponent,
    ALERTS,
  ],
  imports: [
    CommonModule,
    FormsModule,
    OctraComponentsModule,
    InternRoutingModule,
    AppSharedModule,
    TranslocoModule,
    StoreModule.forFeature(
      'onlineMode',
      new LoginModeReducers(LoginMode.ONLINE).create()
    ),
    StoreModule.forFeature(
      'demoMode',
      new LoginModeReducers(LoginMode.DEMO).create()
    ),
    StoreModule.forFeature(
      'localMode',
      new LoginModeReducers(LoginMode.LOCAL).create()
    ),
    StoreModule.forFeature(
      'urlMode',
      new LoginModeReducers(LoginMode.URL).create()
    ),
    EffectsModule.forFeature([AnnotationEffects]),
    OctraUtilitiesModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
  ],
  exports: [
    AuthComponent,
    LoadingComponent,
    ProjectsListComponent,
    ReloadFileComponent,
    TranscriptionComponent,
    TranscriptionEndComponent,
    FastbarComponent,
    AudioNavigationComponent,
    LoadingComponent,
    LoadeditorDirective,
    EDITORS,
    NewEditorComponent,
    InternComponent,
    TranscrWindowComponent,
    AuthComponent,
    ErrorOccurredComponent,
    ContextMenuComponent,
    ProjectsListComponent,
    DynComponentDirective,
    PermutationsReplaceModalComponent,
    ALERTS,
  ],
  bootstrap: [],
  providers: [],
})
export class InternModule {}
