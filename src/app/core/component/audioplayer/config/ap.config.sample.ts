/*
 THIS IS JUST A SAMPLE. Do not change anything here. To create a new config file just copy this file.
 */
export class AudioplayerConfig {
  public Settings: any = {
    audiosrc: '',
    height: 30,
    backgroundcolor: 'rgb(055,055,155)',
    framecolor: 'rgb(0,0,0)',
    margin: {
      top: 5,
      right: 15,
      bottom: 10,
      left: 15
    },
    cursor: {
      color: 'rgb(0, 0, 0)'
    },
    playcursor: {
      height: 20,
      width: 10,
      color: 'rgb(77, 122, 105)'
    },
    slider: {
      height: 5,
      color: 'rgb(177, 222, 205)'
    },
    // SHORTCUTS
    // SHORTCUTS scheme: KeyMapping [+ <char or charCode>]
    shortcuts_enabled: true,
    shortcuts: {
      play_pause: {
        keys: {
          mac: 'TAB',
          pc: 'SHIFT + ENTER'
        },
        title: 'Abspielen / Pausieren',
        focusonly: false
      },
      stop: {
        keys: {
          mac: 'ESC',
          pc: 'ESC'
        },
        title: 'Wiedergabe beenden',
        focusonly: false
      },
      step_backward: {
        keys: {
          mac: 'ALT + G',
          pc: 'ALT + G'
        },
        title: 'Zur zuletzt pausierten Stelle springen',
        focusonly: false
      }
    }
  };
}
