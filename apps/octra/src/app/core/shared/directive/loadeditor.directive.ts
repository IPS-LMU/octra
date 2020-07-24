import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[octraLoadeditor]'
})
export class LoadeditorDirective {

  constructor(public viewContainerRef: ViewContainerRef) {
  }

}
