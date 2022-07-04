import { Scene } from "./lib/scene.js";
import { loadImage } from "./lib/loaders.js";
import { asset_final } from "./assets/assets.js";

const kFadeDuration = 0.75;
const kSceneEnd = 4;

export class Final extends Scene {
  constructor(viewport) {
    super(viewport);
    /** @private @type {!CanvasRenderingContext2D} */
    this._ctx = this.viewport.canvas.getContext('2d');
    /** @private @type {?HTMLImageElement} */
    this._image = null;
  }

  async load() {
    return loadImage(asset_final).then(img => this._image = img);
  }

  start() {
    this.viewport.useScreenSize();
    this._ctx.imageSmoothingEnabled = false;
    this._ctx.fillStyle = 'white';
    this._ctx.fillRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);
  }

  render(elapsed) {
    let width = this._ctx.canvas.width;
    let height = this._ctx.canvas.height;
    let img_height = Math.min(this._ctx.canvas.height, this._ctx.canvas.width * 3 / 4);
    let img_width = 4 * img_height / 3;
    let left = width / 2 - img_width / 2;
    let top = height / 2 - img_height / 2;
    this._ctx.clearRect(0, 0, width, height);
    this._ctx.drawImage(this._image, left, top, img_width, img_height);
    if (elapsed <= kFadeDuration) {
      let alpha = 1 - elapsed / kFadeDuration;
      this._ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      this._ctx.fillRect(0, 0, width, height);
      return;
    }

    if (elapsed <= kSceneEnd - kFadeDuration) return;

    let alpha = 1 - (kSceneEnd - elapsed) / kFadeDuration;
    this._ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    this._ctx.fillRect(0, 0, width, height);

    if (elapsed >= kSceneEnd) return this.stop();
  }
}
