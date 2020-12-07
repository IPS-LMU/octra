import {TwoDEditorComponent} from './2D-editor';
import {DictaphoneEditorComponent} from './dictaphone-editor';
import {LinearEditorComponent} from './linear-editor';
import {IconName} from '@fortawesome/fontawesome-common-types';
import {TrnEditorComponent} from './trn-editor';

export const editorComponents: {
  name: string,
  editor: any,
  translate: string,
  icon: IconName
}[] = [
  {
    name: DictaphoneEditorComponent.editorname,
    editor: DictaphoneEditorComponent,
    translate: 'interfaces.simple editor',
    icon: 'minus'
  },
  {
    name: LinearEditorComponent.editorname,
    editor: LinearEditorComponent,
    translate: 'interfaces.linear editor',
    icon: 'window-maximize'
  },
  {
    name: TwoDEditorComponent.editorname,
    editor: TwoDEditorComponent,
    translate: 'interfaces.2D editor',
    icon: 'align-justify'
  },
  {
    name: TrnEditorComponent.editorname,
    editor: TrnEditorComponent,
    translate: 'interfaces.TRN editor',
    icon: 'table'
  }
];
