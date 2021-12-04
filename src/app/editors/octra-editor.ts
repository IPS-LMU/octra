export abstract class OCTRAEditor {
  constructor() {
  }

  public abstract afterFirstInitialization();

  public abstract disableAllShortcuts();

  public abstract enableAllShortcuts();

  public abstract save();
}

