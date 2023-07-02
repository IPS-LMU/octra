export class ControlType {
  private readonly _type: string;

  get type(): string {
    return this._type;
  }

  constructor(type: string) {
    switch (type) {
      case 'radiobutton':
        this._type = 'radiobutton';
        break;
      case 'checkbox':
        this._type = 'checkbox';
        break;
      case 'textarea':
        this._type = 'textarea';
        break;
      default:
        console.error(
          "type '${type}' not valid control type for the feedback form"
        );
        break;
    }
  }
}
