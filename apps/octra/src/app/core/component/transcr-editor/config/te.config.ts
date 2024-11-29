export class TranscrEditorConfig {
  public markers: any[] = [];
  // disabled shortcuts
  public disabledKeys = [
    'ENTER',
    'SHIFT + ENTER',
    'TAB',
    'SHIFT + ALT + 1',
    'SHIFT + ALT + 2',
    'SHIFT + ALT + 3',
    'ALT + 8',
    'ALT + 9',
    'ALT + 0',
  ];
  public height = 300;
  public responsive = false;
  public btnPopover = true;
  public specialMarkers = {
    boundary: false,
  };
  public highlightingEnabled = false;

  constructor(partial?: Partial<TranscrEditorConfig>) {
    if (partial) {
      Object.assign(partial);
    }
  }
}
