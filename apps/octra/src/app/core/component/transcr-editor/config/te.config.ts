export class TranscrEditorConfig {
  public markers = [];
  // disabled shortcuts
  public disabledKeys = ['ENTER', 'SHIFT + ENTER', 'TAB', 'ALT + SHIFT + 1', 'ALT + SHIFT + 2', 'ALT + SHIFT + 3'];
  public height = 300;
  public responsive = false;
  public btnPopover = true;
  public specialMarkers = {
    boundary: false
  };
  public highlightingEnabled = false;
}
