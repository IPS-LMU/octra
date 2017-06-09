import {Converter} from './shared/Converters/Converter';
import {TextConverter} from './shared/Converters/TextConverter';
import {AnnotJSONConverter} from './shared/Converters/AnnotJSONConverter';
import {PraatTableConverter} from './shared/Converters/PraatTableConverter';
import {CTMConverter} from './shared/Converters/CTMConverter';
import {Component} from '@angular/core';
import {TwoDEditorComponent} from './editors/2D-editor/2D-editor.component';
import {EditorWSignaldisplayComponent} from './editors/editor-without-signaldisplay/editor-w-signaldisplay.component';
import {LinearEditorComponent} from './editors/linear-editor/linear-editor.component';

export class AppInfo {
  static get editors(): { name: string; editor: Component }[] {
    return this._editors;
  }

  public static get converters(): {
    appendix: string,
    converter: Converter
  }[] {
    return this._converters;
  }

  static get version(): string {
    return this._version;
  }

  private static _version = '1.2.0';


  // defined editors
  private static _editors: {
    name: string,
    editor: Component,
    translate: string,
    icon: string
  }[] = [
    {
      name: EditorWSignaldisplayComponent.editorname,
      editor: EditorWSignaldisplayComponent,
      translate: 'interfaces.simple editor',
      icon: '<span class="glyphicon glyphicon-minus navbar-icon"></span>'
    },
    {
      name: LinearEditorComponent.editorname,
      editor: LinearEditorComponent,
      translate: 'interfaces.linear editor',
      icon: '<span class="glyphicon glyphicon-modal-window navbar-icon">'
    },
    {
      name: TwoDEditorComponent.editorname,
      editor: TwoDEditorComponent,
      translate: 'interfaces.2D editor',
      icon: '<span class="glyphicon glyphicon-align-justify navbar-icon"></span>'
    }
  ];

  // defined converters
  private static _converters: {
    appendix: string,
    converter: Converter
  }[] = [
    {
      appendix: '.txt',
      converter: new TextConverter()
    },
    {
      appendix: '.Table',
      converter: new PraatTableConverter()
    },
    {
      appendix: '_annot.json',
      converter: new AnnotJSONConverter()
    },
    {
      appendix: '.ctm',
      converter: new CTMConverter()
    }
  ];
}
