import { GLTFLoader } from "./three/GLTFLoader.js";
import { ParseS3M } from "./s3mplayer/s3m.js";
import { Song } from "./s3mplayer/song.js";

/**
 * @param {string} src 
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    let image = new Image();
    image.onload = () => resolve(image);
    image.onerror = e => reject(e);
    image.src = src;
  });
}

/**
 * @param {string} src 
 * @returns {Promise<*>}
 */
export function loadModel(src) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(src, gltf => resolve(gltf), undefined, e => reject(e));
  });
}

/**
 * @param {string} src 
 * @returns {Promise<HTMLAudioElement>}
 */
export function loadAudio(src) {
  return new Promise((resolve, reject) => {
    let audio = new Audio(src);
    audio.oncanplay = () => resolve(audio);
    audio.onerror = e => reject(e);
  });
}

/**
 * @param {string} name 
 * @returns {Promise<ArrayBuffer>}
 */
export async function loadFile(name) {
  return fetch(name).then(response => response.arrayBuffer());
}

/**
 * @param {string} src 
 * @returns {Promise<Song>}
 */
export async function loadS3M(src) {
  return loadFile(src).then(s3m => ParseS3M(new Uint8Array(s3m)));
}