import { Scene } from "./lib/scene.js";
import { loadFile } from "./lib/loaders.js";
import { MakeViewport } from "./lib/viewport.js";

const kFadeDuration = .3;

const kCredits = [
  [15.5, 22, .2, "A", .4, "Future Crew", .6, "Production"],
  [23, 30, .4, "First Presented", .6, "at Assembly 93"],
  [31, 35, .3, "in", .5, "Dolby Surround"],
  [49, 53, .3, "Graphics", .45, "Marvel", .6, "Pixel"],
  [56, 60, .3, "Music", .45, "Purple Motion", .6, "Skaven"],
  [64, 69, .225, "Code", .375, "Psi", .525, "Trug", .675, "Wildfire"],
  [72, 76, .3, "Additional Design", .45, "Abyss", .6, "Gore"]
];

export class StartCredits extends Scene {
  constructor(viewport) {
    super(viewport);
    /** @private @type {!Array<Array>} */
    this._titles = [];
    /** @private @type {number} */
    this._title = -1;
    /** @private @type {number} */
    this._opacity = -1;
  }

  dispose() {
    for (let title of this._titles) {
      title[2].dispose();
    }
    this._titles = [];
  }

  precalculate() {
    for (let credit of kCredits) {
      let viewport = MakeViewport();
      viewport.canvas.style.zIndex = 10;
      viewport.canvas.style.opacity = 0;
      viewport.setAspectRatio(16 / 9);
      viewport.setSize(1920, 1080);
      let width = viewport.width;
      let height = viewport.height;
      let font_size = height * 0.09;
      let ctx = viewport.canvas.getContext('2d');
      ctx.font = font_size + "px srserif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.lineWidth = height / 960;
      ctx.fillStyle = '#dfdfcf';
      ctx.strokeStyle = '#ffffff';
      ctx.clearRect(0, 0, width, height);
      let lines = credit.slice(2);
      while (lines.length > 1) {
        let position = lines[0];
        let line = lines[1];
        lines.splice(0, 2);
        ctx.fillText(line, width / 2, height * position);
        ctx.filter = 'blur(' + (ctx.lineWidth * 0.75) + 'px)';
        ctx.strokeText(line, width / 2, height * position);
        ctx.filter = 'none';
      }
      this._titles.push([credit[0], credit[1], viewport]);
    }
  }

  render(elapsed) {
    if (this._title < 0 && elapsed < this._titles[0][0]) return;

    let title = Math.max(0, this._title);
    while (title < this._titles.length && elapsed > this._titles[title][1]) {
      this._titles[title][2].canvas.style.opacity = 0;
      ++title;
    }

    if (title == this._titles.length) return this.stop();

    let slide = this._titles[title];
    if (elapsed < slide[0]) return;

    let opacity = 1;
    if (elapsed < slide[0] + kFadeDuration) {
      opacity = (elapsed - slide[0]) / kFadeDuration;
    } else if (slide[1] - kFadeDuration < elapsed) {
      opacity = (slide[1] - elapsed) / kFadeDuration;
    }
    if (opacity == this._opacity && title == this._title) return;

    this._opacity = opacity;
    this._title = title;
    slide[2].canvas.style.opacity = opacity;
  }
}
