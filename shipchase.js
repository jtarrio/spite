import * as THREE from './lib/three/three.module.js';
import { RoomEnvironment } from './lib/three/RoomEnvironment.js';
import { Scene } from './lib/scene.js';
import { Make3DViewport, Viewport, Viewport3d } from './lib/viewport.js';
import { loadModel } from './lib/loaders.js';
import { FirstDegreePolynomial, SecondDegreePolynomial } from './lib/formulas.js';
import { asset_huge_ship, asset_small_ship } from './assets/assets.js';

const chaserStart = 3;
const chaseDuration = 6.5;

const CruiserDistance = SecondDegreePolynomial(0, 0, .3 * chaseDuration, 9000, chaseDuration, 100000);
const ChaserDistance = FirstDegreePolynomial(chaserStart, 0, chaseDuration, 2000);
const ChaserTrajectory = FirstDegreePolynomial(chaserStart, 0, chaseDuration, 20);

export class Shipchase extends Scene {
  constructor(unused) {
    super(Make3DViewport());

    this.viewport.setAspectRatio(16 / 9);
    this.viewport.useScreenSize();

    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(/** @type {Viewport3d} */(this.viewport).renderer);

    /** @type {!THREE.Scene} */
    this._scene = new THREE.Scene();
    this._scene.environment = pmremGenerator.fromScene(environment).texture;

    /** @type {!THREE.PerspectiveCamera} */
    this._camera = new THREE.PerspectiveCamera(90, 16 / 9, 1, 200000);

    /** @type {*} */
    this._cruiser = null;
    /** @type {Array<*>} */
    this._chaser = [];
  }

  dispose() {
    this.viewport.dispose();
  }

  async load() {
    return Promise.all([
      loadModel(asset_huge_ship),
      loadModel(asset_small_ship),
    ])
      .then(([huge, small]) => {
        this._cruiser = huge.scene.children[0];
        this._cruiser.rotation.y = Math.PI;
        this._scene.add(this._cruiser);
        let chaser = small.scene.children[0];
        chaser.rotation.y = Math.PI;
        this._chaser = [chaser, chaser.clone(), chaser.clone()];
        this._chaser.forEach(s => this._scene.add(s));
      });
  }

  render(elapsed) {
    this._cruiser.position.set(0, 600, 4500 - CruiserDistance(elapsed));
    let chaser_distance = -ChaserDistance(elapsed);
    let chaser_height = ChaserTrajectory(elapsed);
    this._chaser[0].position.set(-50, chaser_height - 10, chaser_distance);
    this._chaser[0].rotation.z = 2 * Math.PI * elapsed * .2;
    this._chaser[1].position.set(0, chaser_height + 10, chaser_distance);
    this._chaser[1].rotation.z = 2 * Math.PI * (elapsed - 5) * .1;
    this._chaser[2].position.set(40, chaser_height, chaser_distance);
    this._chaser[2].rotation.z = 2 * Math.PI * elapsed * -0.15;

    /** @type {Viewport3d} */ (this.viewport).renderer.render(this._scene, this._camera);
    if (elapsed > 2 * chaseDuration) this.stop();
  }
}
