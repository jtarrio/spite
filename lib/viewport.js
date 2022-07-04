import { WebGLRenderer, sRGBEncoding } from './three/three.module.js';

export function MakeViewport() {
  let canvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
  document.body.appendChild(canvas);
  return new Viewport(canvas);
}

export function Make3DViewport() {
  let renderer = new WebGLRenderer({ alpha: true });
  renderer.outputEncoding = sRGBEncoding;
  document.body.appendChild(renderer.domElement);
  return new Viewport3d(renderer);
}

export class Viewport {
  /**
   * @param {!HTMLCanvasElement} cnv 
   */
  constructor(cnv) {
    /** @private @type {!HTMLCanvasElement} */
    this._canvas = cnv;
    /** @private @type {?function()} */
    this._resizer = null;
  }

  get canvas() {
    return this._canvas;
  }

  get width() {
    return this._canvas.width;
  }

  get height() {
    return this._canvas.height;
  }

  dispose() {
    if (this._resizer != null) {
      document.removeEventListener('resize', this._resizer);
      document.removeEventListener('fullscreenchange', this._resizer);
    }
    document.body.removeChild(this._canvas);
  }

  /**
   * @param {number} aspect_ratio 
   */
  setAspectRatio(aspect_ratio) {
    let s = this._canvas.style;
    s.position = 'absolute';
    s.width = 'min(100vw, 100vh * ' + aspect_ratio + ')';
    s.height = 'min(100vh, 100vw / ' + aspect_ratio + ')';
    s.left = 'max(0px, (100vw - 100vh * ' + aspect_ratio + ') / 2)';
    s.top = 'max(0px, (100vh - 100vw / ' + aspect_ratio + ') / 2)';
  }

  /**
   * @param {number} w 
   * @param {number} h 
   */
  setSize(w, h) {
    if (this._resizer !== null) {
      document.removeEventListener('resize', this._resizer);
      document.removeEventListener('fullscreenchange', this._resizer);
      this._resizer = null;
    }
    this._internalSetSize(w, h);
  }

  useScreenSize() {
    this._resizer = () => {
      this._internalSetSize(this._canvas.scrollWidth, this._canvas.scrollHeight);
    };
    this._resizer();
    window.addEventListener('resize', this._resizer);
    window.addEventListener('fullscreenchange', this._resizer);
  }

  _internalSetSize(w, h) {
    this._canvas.width = w;
    this._canvas.height = h;
  }
}

export class Viewport3d extends Viewport {
  /**
   * @param {!WebGLRenderer} renderer 
   */
  constructor(renderer) {
    super(renderer.domElement);
    /** @private @type {!WebGLRenderer} */
    this._renderer = renderer;
  }

  get renderer() {
    return this._renderer;
  }

  /**
   * @param {number} w 
   * @param {number} h 
   */
  _internalSetSize(w, h) {
    this._renderer.setSize(w, h, /*updateStyle=*/false);
    super._internalSetSize(w, h);
  }
}