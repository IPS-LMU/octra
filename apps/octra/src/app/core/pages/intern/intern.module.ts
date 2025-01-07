import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import {
  NgbDropdown,
  NgbDropdownMenu,
  NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import { OctraComponentsModule } from '@octra/ngx-components';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { AppSharedModule } from '../../../app.shared.module';
import {
  DictaphoneEditorComponent,
  LinearEditorComponent,
  TrnEditorComponent,
  TwoDEditorComponent,
} from '../../../editors';
import { TranscrWindowComponent } from '../../../editors/2D-editor/transcr-window';
import { NewEditorComponent } from '../../../editors/new-editor/new-editor.component';
import { PermutationsReplaceModalComponent } from '../../../editors/trn-editor/modals/permutations-replace-modal/permutations-replace-modal.component';
import { AuthenticationNeededComponent } from '../../alerts/authentication-needed/authentication-needed.component';
import { ErrorOccurredComponent } from '../../alerts/error-occurred/error-occurred.component';
import { FastbarComponent } from '../../component';
import { AudioNavigationComponent } from '../../component/audio-navigation';
import { ContextMenuComponent } from '../../component/context-menu/context-menu.component';
import { DynComponentDirective } from '../../shared/directive/dyn-component.directive';
import { LoadeditorDirective } from '../../shared/directive/loadeditor.directive';
import { LoadingComponent } from '../loading';
import { AuthComponent } from './auth';
import { AuthSuccessPageComponent } from './auth-success/auth-success.page.component';
import { InternRoutingModule } from './intern-routing.module';
import { InternComponent } from './intern.component';
import { ProjectsListComponent } from './projects-list';
import { ReloadFileComponent } from './reload-file';
import { TranscriptionComponent } from './transcription';
import { TranscriptionEndComponent } from './transcription-end';

export const ALERTS: any[] = [AuthenticationNeededComponent];

export const EDITORS: any[] = [
  DictaphoneEditorComponent,
  TwoDEditorComponent,
  LinearEditorComponent,
  TrnEditorComponent,
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    OctraComponentsModule,
    InternRoutingModule,
    AppSharedModule,
    TranslocoModule,
    OctraUtilitiesModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
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
