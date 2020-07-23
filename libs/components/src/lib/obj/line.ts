/***
 * Creates new Line Object for the canvas
 */
export class Line {

  public number = -1;
  private size = {
    width: 0,
    height: 0
  };
  private readonly pos = {
    x: 0,
    y: 0
  };

  get Size(): { width: number, height: number } {
    return {
      width: this.size.width,
      height: this.size.height
    };
  }

  set Size(value: { width: number, height: number }) {
    this.size.width = value.width;
    this.size.height = value.height;
  }

  get Pos(): { x: number, y: number } {
    return this.pos;
  }

  set Pos(value: { x: number, y: number }) {
    this.pos.x = value.x;
    this.pos.y = value.y;
  }

  constructor(lineNumber: number, size: any, pos: any) {
    this.number = lineNumber;
    this.size = {
      width: size.width,
      height: size.height
    };
    this.pos = {
      x: pos.x,
      y: pos.y
    };
  }

  mouseIn = (x, y) => {
    return (x > this.pos.x && x < (this.pos.x + this.size.width)) &&
      (y > this.pos.y && y < (this.pos.y + this.size.height));
  }
}
