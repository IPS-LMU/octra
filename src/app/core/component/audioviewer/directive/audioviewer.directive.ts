import {Directive, ElementRef, Renderer} from '@angular/core';

@Directive({
  selector: '[appAudioviewer]',
  exportAs: 'audioview'
})
export class AudioviewerDirective {

  constructor(private elementRef: ElementRef, private renderer: Renderer) {
  }

  changeStyle(attr: string, val: string) {
    this.renderer.setElementStyle(this.elementRef.nativeElement, attr, val);
  }

  changeAttr(attr: string, val: string) {
    this.renderer.setElementAttribute(this.elementRef.nativeElement, attr, val);
  }

}
