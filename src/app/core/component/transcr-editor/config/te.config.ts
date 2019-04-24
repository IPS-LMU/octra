export class TranscrEditorConfig {
  public settings: any = {
    markers: [],
    // disabled shortcuts
    disabledKeys: ['ENTER', 'SHIFT + ENTER', 'TAB'],
    height: 300,
    responsive: false,
    btnPopover: true,
    special_markers: {
      boundary: false
    }
  };
}
