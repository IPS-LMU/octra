import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'octra-shortcut',
  templateUrl: './shortcut.component.html',
  styleUrls: ['./shortcut.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class ShortcutComponent implements OnInit {
  parts: {
    type: 'key' | 'separator';
    content: string;
  }[] = [];

  @Input() shortcut = '';
  @Input() theme: 'dark' | 'light' = 'light';

  ngOnInit(): void {
    const shortcut = this.replaceWithUTF8Symbols(this.shortcut);
    const splitted =
      shortcut !== '+'
        ? shortcut.split('+').filter((a) => a !== undefined && a !== '')
        : ['+'];

    this.parts = [];
    for (let i = 0; i < splitted.length; i++) {
      const part = splitted[i];

      this.parts.push({
        type: 'key',
        content: part,
      });
      if (i < splitted.length - 1) {
        this.parts.push({
          type: 'separator',
          content: '<i class="bi bi-plus-lg"></i>',
        });
      }
    }
  }

  private replaceWithUTF8Symbols(keyString: string) {
    let result = keyString;

    const regex = new RegExp(
      /((?:(ARROW)?(?:(?:UP)|(?:DOWN)|(?:LEFT)|(?:RIGHT)))|(?:STRG)|(?:CMD)|(?:ENTER)|(?:BACKSPACE)|(?:TAB)|(?:ESC)|(?:ALT)|(?:SHIFT))/g,
    );

    result = result.replace(regex, (g0, g1) => {
      switch (g1) {
        case 'ARROWUP':
        case 'UP':
          return '<i class="bi bi-arrow-up"></i>';
        case 'ARROWLEFT':
        case 'LEFT':
          return '<i class="bi bi-arrow-left"></i>';
        case 'ARROWRIGHT':
        case 'RIGHT':
          return '<i class="bi bi-arrow-right"></i>';
        case 'ARROWDOWN':
        case 'DOWN':
          return '<i class="bi bi-arrow-down"></i>';
        case 'STRG':
          return 'strg';
        case 'CMD':
          return '<i class="bi bi-command"></i>';
        case 'ENTER':
          return '<i class="bi bi-arrow-return-left"></i>';
        case 'BACKSPACE':
          return '<i class="bi bi-backspace"></i>';
        case 'TAB':
          return '<i class="bi bi-indent"></i>';
        case 'SHIFT':
          return '<i class="bi bi-shift"></i>';
        default:
          return g1.toLowerCase();
      }
    });

    return `${result}`;
  }
}
