import { NgModule } from '@angular/core';
import { NgxJoditModule } from 'ngx-jodit';
import { OctraComponentsModule } from '@octra/ngx-components';
import { AuthComponent } from './auth';
import { LoadingComponent } from '../loading';
import { ProjectsListComponent } from './projects-list';
import { ReloadFileComponent } from './reload-file';
import { TranscriptionComponent } from './transcription';
import { TranscriptionEndComponent } from './transcription-end';
import { InternComponent } from './intern.component';
import { FastbarComponent, TranscrEditorComponent } from '../../component';
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
import { ValidationPopoverComponent } from '../../component/transcr-editor/validation-popover/validation-popover.component';
import { ErrorOccurredComponent } from '../../alerts/error-occurred/error-occurred.component';
import { ContextMenuComponent } from '../../component/context-menu/context-menu.component';
import { DynComponentDirective } from '../../shared/directive/dyn-component.directive';
import { PermutationsReplaceModalComponent } from '../../../editors/trn-editor/modals/permutations-replace-modal/permutations-replace-modal.component';
import { CommonModule } from '@angular/common';
import { AppSharedModule } from '../../../app.shared.module';
import { AuthenticationNeededComponent } from '../../alerts/authentication-needed/authentication-needed.component';
import { InternRoutingModule } from './intern-routing.module';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';
import { StoreModule } from '@ngrx/store';
import { LoginModeReducers } from '../../store/login-mode/login-mode.reducer';
import { LoginMode } from '../../store';
import { EffectsModule } from '@ngrx/effects';
import { AnnotationEffects } from '../../store/login-mode/annotation/annotation.effects';
import { AsrService } from '../../shared/service/asr.service';

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
    TranscrEditorComponent,
    TranscrWindowComponent,
    ValidationPopoverComponent,
    AuthComponent,
    ErrorOccurredComponent,
    ContextMenuComponent,
    ProjectsListComponent,
    DynComponentDirective,
    PermutationsReplaceModalComponent,
    ALERTS,
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgxJoditModule,
    OctraComponentsModule,
    InternRoutingModule,
    AppSharedModule,
    NgxJoditModule,
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
    EffectsModule.forFeature([AnnotationEffects]),
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
    TranscrEditorComponent,
    TranscrWindowComponent,
    ValidationPopoverComponent,
    AuthComponent,
    ErrorOccurredComponent,
    ContextMenuComponent,
    ProjectsListComponent,
    DynComponentDirective,
    PermutationsReplaceModalComponent,
    ALERTS,
  ],
  bootstrap: [],
  providers: [AsrService],
})
export class InternModule {}
