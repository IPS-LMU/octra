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
    const splitted = shortcut
      .split(' ')
      .filter((a) => a !== undefined && a !== '');

    this.parts = [];
    for (const part of splitted) {
      this.parts.push({
        type: part.trim() !== '+' ? 'key' : 'separator',
        content: part,
      });
    }
  }

  private replaceWithUTF8Symbols(keyString: string) {
    let result = keyString;

    const regex = new RegExp(
      /((?:ARROW(?:(?:UP)|(?:DOWN)|(?:LEFT)|(?:RIGHT)))|(?:STRG)|(?:CMD)|(?:ENTER)|(?:BACKSPACE)|(?:TAB)|(?:ESC)|(?:ALT)|(?:SHIFT))/g
    );

    result = result.replace(regex, (g0, g1) => {
      switch (g1) {
        case 'ARROWUP':
          return '⬆';
        case 'ARROWLEFT':
          return '⬅';
        case 'ARROWRIGHT':
          return '⮕';
        case 'ARROWDOWN':
          return '⬇';
        case 'STRG':
          return 'strg';
        case 'CMD':
          return '⌘';
        case 'ENTER':
          return '⮐';
        case 'BACKSPACE':
          return '⭠';
        case 'TAB':
          return '⇥';
        case 'SHIFT':
          return '⇧';
        default:
          return g1.toLowerCase();
      }
    });

    return `${result}`;
  }
}
