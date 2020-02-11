export class AudioviewerConfig {
  public multiLine = false;
  public pixelPerSec = 50; // only relevant for multiline
  public justifySignalHeight = true;
  public cropping = 'none';
  public lineheight = 60;
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

  public scrollbar = {
    enabled: false,
    width: 20,
    background: {
      color: 'white',
      stroke: 'gray',
      strokeWidth: 1
    },
    selector: {
      color: 'green',
      stroke: 'gray',
      strokeWidth: 1,
      width: 20
    }
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

  public asr = {
    enabled: false
  };


  // SHORTCUTS
  // SHORTCUTS sheme= KeyMapping [+ <char or charCode>]
  public shortcutsEnabled = true;
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
    },
    delete_boundaries: {
      keys: {
        mac: 'D',
        pc: 'D'
      },
      focusonly: true,
      title: 'delete boundaries'
    },
    do_asr: {
      keys: {
        mac: 'R',
        pc: 'R'
      },
      focusonly: true,
      title: 'do asr'
    },
    do_asr_maus: {
      keys: {
        mac: 'M',
        pc: 'M'
      },
      focusonly: true,
      title: 'do asr maus'
    },
    do_maus: {
      keys: {
        mac: 'W',
        pc: 'W'
      },
      focusonly: true,
      title: 'do maus only'
    }
  };

  public disabledKeys = ['SHIFT + SPACE'];
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

  public stepWidthRatio = 0.0226;
  public type: string;
  public roundValues = true;

  public showTimePerLine = false;
  public showTranscripts = false;
}
