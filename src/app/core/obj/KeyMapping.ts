export class KeyMapping {
  /**
   * mapping for special keys
   */
  private static table: any = [
    {
      name: 'ALT',
      keyCode: 18
    }, {
      name: 'META',
      keyCode: -1
    }, {
      name: 'CTRL',
      keyCode: 17
    }, {
      name: 'TAB',
      keyCode: 9
    },
    {
      name: 'BACKSPACE',
      keyCode: 8
    }, {
      name: 'ENTER',
      keyCode: 13
    }, {
      name: 'ESC',
      keyCode: 27
    }, {
      name: 'SPACE',
      keyCode: 32
    }, {
      name: 'SHIFT',
      keyCode: 16
    }, {
      name: 'ARROWLEFT',
      keyCode: 37
    }, {
      name: 'ARROWUP',
      keyCode: 38
    }, {
      name: 'ARROWRIGHT',
      keyCode: 39
    }, {
      name: 'ARROWDOWN',
      keyCode: 40
    }
  ];

  /**
   *
   * gets the name of a special Key by number
   */
  public static getNameByCode(code: number): string {
    for (let i = 0; i < this.table.length; i++) {
      if (this.table[i].keyCode === code) {
        return this.table[i].name;
      }
    }
    return '';
  }

  /**
   * returns combination of shurtcut as a string
   */
  public static getShortcutCombination($event): string {
    const keyCode = $event.which; // which has better browser compatibility
    const alt = $event.altKey;
    const ctrl = $event.ctrlKey;
    const meta = $event.metaKey;
    const shift = $event.shiftKey;

    let name = this.getNameByCode(keyCode);
    if (name === '' && !($event.which === null || $event.which === undefined)) {
      name = String.fromCharCode($event.which).toUpperCase();
    }

    if (!name) {
      name = '';
    }

    if (name === 'CONTROL') {
      name = 'CTRL';
    }

    let isCombination = false;
    let comboKey = '';

    // only one kombination permitted
    if (alt && !(ctrl || meta || shift)) {
      isCombination = true;
    } else if (ctrl && !(alt || meta || shift)) {
      isCombination = true;
    } else if (meta && !(alt || ctrl || shift)) {
      isCombination = true;
    } else if (shift && !(alt || ctrl || meta)) {
      isCombination = true;
    }

    if (isCombination) {
      if (alt) {
        comboKey = 'ALT';
      } else if (ctrl) {
        comboKey = 'CTRL';
      } else if (meta) {
        comboKey = 'META';
      } else if (shift) {
        comboKey = 'SHIFT';
      }
    }

    // if name == comboKey, only one special Key pressed
    if (name !== comboKey) {
      if (comboKey !== '') {
        comboKey += ' + ';
      }

      if ($event.key !== '' && name !== '') {
        if (name.length === 1) {
          // keyName is normal char
          name = String.fromCharCode(keyCode);
        }
        comboKey += name;
      }
    }
    return comboKey;
  }
}
