/***
 * Creates new Line Object for the canvas
 * @param number
 * @param size {width:w, height:h}
 * @param pos {x: x, y: y}
 * @constructor
 */
export class Line {

  public number = -1;
  mouseIn = function (x, y) {
    const result =
      (x > this.pos.x && x < (this.pos.x + this.size.width)) &&
      (y > this.pos.y && y < (this.pos.y + this.size.height));

    return result;
  };
  private size = {
    width: 0,
    height: 0
  };
  private pos = {
    x: 0,
    y: 0
  };


  /*
   GETTER / SETTER
   */
  private isMouseIn = false;

  get Size(): any {
    return {
      width: this.size.width,
      height: this.size.height
    };
  }

  set Size(any) {
    this.size.width = any.width;
    this.size.height = any.height;
  }

  get Pos(): any {
    return this.pos;
  }

  set Pos(any) {
    this.pos.x = any.x;
    this.pos.y = any.y;
  }

  constructor(number: number, size: any, pos: any) {
    this.number = number;
    this.size = {
      width: size.width,
      height: size.height
    };
    this.pos = {
      x: pos.x,
      y: pos.y
    };
  }
}
