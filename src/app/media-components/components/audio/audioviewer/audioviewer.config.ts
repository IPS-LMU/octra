export class AudioviewerConfig {
  public multi_line = false;
  public pixel_per_sec = 200; // only relevant for multiline
  public justify_signal_height = true;
  public cropping = 'none';
  public lineheight = 150;
  public backgroundcolor = 'rgb(255, 248, 248)';
  public margin: {
    top: number,
    right: number,
    bottom: number,
    left: number
  } = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
  public cursor: {
    color: string
  } = {
    color: 'rgb(255, 0, 0)'
  };

  public playcursor: {
    height: number
    width: number;
    color: string
  } = {
    height: 20,
    width: 10,
    color: 'purple'
  };
  public boundaries: {
    enabled: boolean,
    readonly: boolean,
    width: number;
    color: string
  } = {
    enabled: true,
    readonly: false,
    width: 3,
    color: '#ebaf4c'
  };
  public grid: {
    enabled: true;
    color: string
  } = {
    enabled: true,
    color: 'rgb(224, 224, 224)'
  };
  public data: {
    color: string
  } = {
    color: 'rgb(0, 127, 0)'
  };

  public selection: {
    enabled: boolean,
    color: string
  } = {
    enabled: true,
    color: 'gray'
  };
  public frame: {
    color: string
  } = {
    color: '#b5b5b5'
  };


  // SHORTCUTS
  // SHORTCUTS sheme= KeyMapping [+ <char or charCode>]
  public shortcuts_enabled = true;
  public shortcuts = {
    play_pause: {
      keys: {
        mac: 'TAB',
        pc: 'TAB'
      },
      focusonly: false,
      title: 'play pause'
    },
    stop: {
      keys: {
        mac: 'ESC',
        pc: 'ESC'
      },
      focusonly: false,
      title: 'stop playback'
    },
    set_boundary: {
      keys: {
        mac: 'S',
        pc: 'S'
      },
      focusonly: true,
      title: 'set segment'
    },
    set_break: {
      keys: {
        mac: 'A',
        pc: 'A'
      },
      focusonly: true,
      title: 'set break'
    },
    play_selection: {
      keys: {
        mac: 'C',
        pc: 'C'
      },
      focusonly: true,
      title: 'play selection'
    },
    step_backward: {
      keys: {
        mac: 'SHIFT + BACKSPACE',
        pc: 'SHIFT + BACKSPACE'
      },
      focusonly: false,
      title: 'step backward'
    },
    step_backwardtime: {
      keys: {
        mac: 'SHIFT + TAB',
        pc: 'SHIFT + TAB'
      },
      title: 'step backward time',
      focusonly: false
    },
    segment_enter: {
      keys: {
        mac: 'ENTER',
        pc: 'ENTER'
      },
      focusonly: true,
      title: 'transcribe segment'
    },
    cursor_left: {
      keys: {
        mac: 'ARROWLEFT',
        pc: 'ARROWLEFT'
      },
      focusonly: true,
      title: 'move cursor left'
    },
    cursor_right: {
      keys: {
        mac: 'ARROWRIGHT',
        pc: 'ARROWRIGHT'
      },
      focusonly: true,
      title: 'move cursor right'
    },
    playonhover: {
      keys: {
        mac: 'H',
        pc: 'H'
      },
      focusonly: true,
      title: 'play audio on hover'
    }
  };

  public disabled_keys = ['SHIFT + SPACE'];
  public timeline: {
    enabled: boolean,
    height: number,
    fontSize: number,
    fontWeight: string,
    font: string,
    foreColor: string
  } = {
    enabled: false,
    height: 15,
    fontSize: 9,
    fontWeight: 'light',
    font: 'Arial',
    foreColor: 'black'
  };

  public step_width_ratio = 0.0226;
  public scrollable = false;
  public type: string;
  public round_values = true;

  public showTimePerLine = false;
  public showTranscripts = false;
}
