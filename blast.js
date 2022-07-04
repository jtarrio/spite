import { Scene } from "./lib/scene.js";
import { loadImage } from "./lib/loaders.js";
import { MakeViewport, Viewport } from "./lib/viewport.js";
import { FirstDegreePolynomial, SecondDegreePolynomial } from "./lib/formulas.js";
import { asset_explosion, asset_planet_blasted, asset_shockwave } from "./assets/assets.js";

const kFlashDuration = 0.2;
const kBlastDuration = 1;
const kFadeDuration = 1;

const ExplosionSize = SecondDegreePolynomial(0, 201, kBlastDuration, 120, kBlastDuration + kFadeDuration, 80);
const ShockwaveWidth = FirstDegreePolynomial(0, 201, kBlastDuration + kFadeDuration, 5000);
const ShockwaveHeight = SecondDegreePolynomial(0, 201, kBlastDuration, 300, kBlastDuration + kFadeDuration, 1500);
const ShockwaveAlpha = SecondDegreePolynomial(0, 0, kBlastDuration / 2, 0.1, kBlastDuration + kFadeDuration, 0.3);

export class Blast extends Scene {
  constructor(viewport) {
    super(MakeViewport());
    /** @private @type {!Viewport} */
    this._base = viewport;
    /** @private @type {!CanvasRenderingContext2D} */
    this._ctx = this.viewport.canvas.getContext('2d');
    /** @private @type {number} */
    this._phase = 0;
    /** @private @type {?HTMLImageElement} */
    this._landscape = null;
    /** @private @type {?HTMLImageElement} */
    this._explosion = null;
    /** @private @type {?Array<HTMLImageElement>} */
    this._shockwave = null;
    this.viewport.setAspectRatio(16 / 9);
    this.viewport.setSize(1920, 1080);
  }

  dispose() {
    this.viewport.dispose();
  }

  async load() {
    this._shockwave = new Array(3);
    return Promise.all([
      loadImage(asset_planet_blasted)
        .then(img => { this._landscape = img; }),
      loadImage(asset_explosion)
        .then(img => { this._explosion = img; }),
      loadImage(asset_shockwave[0])
        .then(img => { this._shockwave[0] = img; }),
      loadImage(asset_shockwave[1])
        .then(img => { this._shockwave[1] = img; }),
      loadImage(asset_shockwave[2])
        .then(img => { this._shockwave[2] = img; }),
    ]).then(() => undefined);
  }

  render(elapsed) {
    if (this._phase < 1) {
      this._ctx.clearRect(0, 0, 1920, 1080);
      this._ctx.globalAlpha = 1;
      let n = Math.floor(elapsed / kFlashDuration);
      if (elapsed <= kFlashDuration) {
        this._ctx.fillStyle = 'white';
        this._ctx.fillRect(0, 0, 1920, 1080);
        return;
      }
      this._phase = 1;
    }
    elapsed -= kFlashDuration;

    if (this._phase < 2) {
      this._ctx.globalCompositeOperation = 'source-over';
      this._ctx.globalAlpha = elapsed <= kBlastDuration ? elapsed / kBlastDuration : 1;
      this._ctx.drawImage(this._landscape, 0, 0);

      this._ctx.globalAlpha = 1;
      this._ctx.globalCompositeOperation = 'lighten';
      let explosion_size = ExplosionSize(elapsed);
      this._ctx.drawImage(this._explosion, 960 - explosion_size / 2, 540 - explosion_size / 2, explosion_size, explosion_size);
      let shockwave_width = ShockwaveWidth(elapsed);
      let shockwave_height = ShockwaveHeight(elapsed);
      this._ctx.globalAlpha = ShockwaveAlpha(elapsed);
      for (let i = 0; i < 3; ++i) {
        let w = shockwave_width + i * 20;
        let h = shockwave_height + i * 10;
        this._ctx.drawImage(this._shockwave[i], 960 - w / 2, 540 - h / 2, w, h);
      }
      this._ctx.globalCompositeOperation = 'source-over';


      if (elapsed <= kBlastDuration) return;
      elapsed -= kBlastDuration;

      this._ctx.globalAlpha = 1;
      let opacity = elapsed <= kFadeDuration ? elapsed / kFadeDuration : 1;
      this._ctx.fillStyle = 'rgba(255,255,255,' + opacity + ')';
      this._ctx.fillRect(0, 0, 1920, 1080);
      if (elapsed <= kFadeDuration) return;
      this._phase = 3;
    }

    let ctx = this._base.canvas.getContext("2d");
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return this.stop();
  }
}
