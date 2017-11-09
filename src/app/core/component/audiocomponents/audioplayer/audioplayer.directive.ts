import {Directive, ElementRef, Renderer2} from '@angular/core';

@Directive({
  selector: '[appAudioPlayer]',
  exportAs: 'audioplay'
})
export class AudioplayerDirective {

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
  }

  changeStyle(attr: string, val: string) {
    this.renderer.setStyle(this.elementRef.nativeElement, attr, val);
  }

}
