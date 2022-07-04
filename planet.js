import { Scene } from "./lib/scene.js";
import { loadImage } from "./lib/loaders.js";
import { asset_planet } from "./assets/assets.js";

const kFadeDuration = .5;
const kSceneEnd = 40;

export class Planet extends Scene {
  constructor(viewport) {
    super(viewport);
    /** @private @type {?CanvasRenderingContext2D} */
    this._ctx = null;
    /** @private @type {?HTMLImageElement} */
    this._image = null;
  }

  async load() {
    return loadImage(asset_planet).then(img => this._image = img);
  }

  start() {
    this.viewport.setAspectRatio(16 / 9);
    this.viewport.setSize(1920, 1080);
    this._ctx = this.viewport.canvas.getContext('2d');
  }

  render(elapsed) {
    this._ctx.globalAlpha = elapsed <= kFadeDuration ? elapsed / kFadeDuration : 1;
    const x = Math.floor(-1920 * elapsed / kSceneEnd);
    this._ctx.drawImage(this._image, x, 0);

    if (elapsed >= kSceneEnd) return this.stop();
  }
}
