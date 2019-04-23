declare var window: any;

export class CanvasAnimation {
  private readonly requestAnimationFrame: any;

  constructor(private interval: number) {
    this.requestAnimationFrame = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, interval / 60);
        console.warn('Browser does not support requestAnimation. Drawing set manual to ' + interval + ' per second');
      };
  }

  public requestFrame(callback: FrameRequestCallback) {
    this.requestAnimationFrame(callback);
  }
}
