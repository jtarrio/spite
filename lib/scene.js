import { Viewport } from "./viewport.js";

export class Scene {
  /**
   * @param {!Viewport} viewport 
   */
  constructor(viewport) {
    /** @type {!Viewport} */
    this.viewport = viewport;
    /** @type {?DOMHighResTimeStamp} */
    this.startTimestamp = null;
    /** @type {boolean} */
    this.done = false;
  }

  dispose() { }

  precalculate() { }

  async load() { }

  async run() {
    this.start();
    return new Promise((resolve, reject) => {
      requestAnimationFrame(t => this.paint(t, resolve));
    });
  }

  stop() {
    this.done = true;
  }

  /**
   * @param {DOMHighResTimeStamp} timestamp 
   * @param {function()} stop_function 
   */
  paint(timestamp, stop_function) {
    if (this.startTimestamp === null) {
      this.startTimestamp = timestamp;
    }
    const elapsed = (timestamp - this.startTimestamp) / 1000;
    this.render(elapsed);
    if (!this.done) {
      requestAnimationFrame(t => this.paint(t, stop_function));
    } else {
      this.dispose();
      stop_function();
    }
  }

  start() { }

  /**
   * @param {number} elapsed 
   */
  render(elapsed) {
  }
}
