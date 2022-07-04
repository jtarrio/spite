import { MakeViewport, Viewport } from "./lib/viewport.js";
import { KeepAwake } from "./lib/keepawake.js";
import { loadS3M } from "./lib/loaders.js";
import { Player } from "./lib/s3mplayer/player.js";
import { Scene } from "./lib/scene.js";
import { StartCredits } from "./start_credits.js";
import { Planet } from "./planet.js";
import { Shipchase } from './shipchase.js';
import { Blast } from "./blast.js";
import { Final } from "./final.js";
import { asset_music } from "./assets/assets.js";

const kCmdEnd = "end";

const kScenes = [
  ["startcredits", StartCredits, 0, 0, 9, 64],
  ["planet", Planet, 4, 64, 10, 64],
  ["shipchase", Shipchase, 11, 58, 12, 64],
  ["blast", Blast, 12, 64, 14, 0],
  ["final", Final, 14, 0, 15, 0],
  [kCmdEnd, null, 14, 0]
];

async function main() {
  await allLoaded();
  let scene = getWantedScene();
  if (scene != "") {
    runDemo();
    return;
  }

  let button = document.getElementById("startButton");
  button.onclick = runDemo;
}

async function allLoaded() {
  await new Promise(r => setTimeout(r, 1000));
  let loading = document.getElementById("loading");
  loading.style.transition = "opacity 1s";
  loading.style.opacity = 0;
  await new Promise(r => setTimeout(r, 1000));
  document.body.removeChild(loading);
}

function getWantedScene() {
  let s = window.location.hash;
  if (!s || !s.startsWith("#scene=")) return '';
  return s.substring(7);
}

let original_document = [];

function clearPage() {
  while (document.body.hasChildNodes()) {
    let child = document.body.firstChild;
    original_document.push(child);
    document.body.removeChild(child);
  }
}

function restorePage() {
  document.exitFullscreen();
  while (document.body.hasChildNodes()) {
    document.body.removeChild(document.body.lastChild);
  }
  original_document.forEach(c => document.body.appendChild(c));
  original_document = [];
}

async function runDemo() {
  let loadingS3M = loadS3M(asset_music);
  clearPage();

  let viewport = MakeViewport();

  let wantedScene = getWantedScene();
  if (wantedScene) {
    return runScene(viewport, wantedScene);
  }

  document.body.requestFullscreen();
  let keepawake = new KeepAwake();
  let player = new Player(await loadingS3M);
  await runScenes(viewport, player, keepawake);
}

/**
 * @param {Viewport} viewport 
 * @param {typeof Scene} scene 
 */
async function runScene(viewport, scene) {
  for (const [name, ctr] of kScenes) {
    if (name == scene) {
      let scene = new ctr(viewport);
      let loading = scene.load();
      scene.precalculate();
      await loading;
      return scene.run();
    }
  }
}

var stop_demo_handler;

/**
 * @param {Viewport} viewport 
 * @param {Player} player 
 * @param {KeepAwake} keepawake
 */
async function runScenes(viewport, player, keepawake) {
  let loading = [];
  let running = new Set();
  stop_demo_handler = e => {
    if (e.key != 'Enter' && e.key != 'q') return;
    stopDemo(running, player, keepawake);
    return false;
  };
  document.addEventListener('keydown', stop_demo_handler);
  for (const [name, ctr, start_order, start_row, end_order, end_row] of kScenes) {
    if (ctr === null) {
      switch (name) {
        case kCmdEnd:
          player.waitForCue(start_order, start_row).then(() => endDemo(running, player, keepawake));
          break;
      }
    } else {
      let scene = new ctr(viewport);
      loading.push(scene.load());
      scene.precalculate();
      player.waitForCue(start_order, start_row).then(() => {
        running.add(scene);
        scene.run();
      });
      player.waitForCue(end_order, end_row).then(() => {
        scene.stop();
      });
    }
  }
  await Promise.all(loading);
  player.play();
}

function stopDemo(running, player, keepawake) {
  document.removeEventListener('keydown', stop_demo_handler);
  player.stop();
  keepawake.dispose();
  [...running].forEach(scene => scene.stop());
  Promise.all(running).then(restorePage);
}

function endDemo(running, player, keepawake) {
  document.removeEventListener('keydown', stop_demo_handler);
  player.stop();
  keepawake.dispose();
  setTimeout(() => {
    [...running].forEach(scene => scene.stop());
    Promise.all(running).then(restorePage);
  }, 5000);
}

window.onload = main;
