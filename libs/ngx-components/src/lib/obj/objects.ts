/**
 * collections
 */
export interface IInterval {
  start: number;
  end: number;
}

export class Interval implements IInterval {
  constructor(
    public start: number,
    public end: number,
  ) {}
}

/**
 * SHAPES
 */

export interface IRectangle {
  position: IPosition;
  size: ISize;
}

export interface IPosition {
  x: number;
  y: number;
}

export interface ISize {
  width: number;
  height: number;
}

export interface ICircle {
  position: IPosition;
  radius: number;
}

export interface IMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export class Rectangle implements IRectangle {
  constructor(
    public position: Position,
    public size: Size,
  ) {}
}

export class Position implements Position {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

export class Size implements ISize {
  constructor(
    public width: number,
    public height: number,
  ) {}
}

export class Margin implements IMargin {
  constructor(
    public top: number,
    public right: number,
    public bottom: number,
    public left: number,
  ) {}
}
