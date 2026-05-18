import { TwoDEditorComponent } from './2D-editor';
import { DictaphoneEditorComponent } from './dictaphone-editor';
import { EmuWebAppEditorComponent } from './emu-webapp';
import { LinearEditorComponent } from './linear-editor';
import { OCTRAEditor } from './octra-editor';
import { MatrixEditorComponent } from './matrix-editor';

export const editorComponents: (typeof OCTRAEditor)[] = [
  DictaphoneEditorComponent,
  MatrixEditorComponent,
  LinearEditorComponent,
  TwoDEditorComponent,
  EmuWebAppEditorComponent,
];
