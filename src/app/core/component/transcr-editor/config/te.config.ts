export class TranscrEditorConfig {
  public settings: any = {
    markers: [],
    // disabled shortcuts
    disabledKeys: ['ENTER', 'SHIFT + ENTER', 'TAB', 'ALT + SHIFT + 1', 'ALT + SHIFT + 2', 'ALT + SHIFT + 3'],
    height: 300,
    responsive: false,
    btnPopover: true,
    special_markers: {
      boundary: false
    }
  };
}
