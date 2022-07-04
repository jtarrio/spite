"use strict";

import { Channel, Command, Instrument, Pattern, Row, Song } from "./song.js";

/**
 * @param {!Uint8Array} s3m 
 * @returns {Song}
 */
export function ParseS3M(s3m) {
  const data = new Data(s3m);
  let mark1 = data.byte(0x1c);
  let type = data.byte(0x1d);
  let ffi = data.word(0x2a);
  let mark2 = data.ascii(0x2c, 4);
  if (mark1 != 0x1a || type != 16 || ffi != 2 || mark2 != "SCRM") {
    throw "Not an S3M file";
  }
  let name = data.asciiz(0, 28);
  let num_orders = data.word(0x20);
  let num_instruments = data.word(0x22);
  let num_patterns = data.word(0x24);
  let global_volume = data.byte(0x30);
  let initial_speed = data.byte(0x31);
  let initial_tempo = data.byte(0x32);
  let master_volume = data.byte(0x33);
  let default_pan = data.byte(0x34);
  let channels = new Map();
  for (let i = 0; i < 32; ++i) {
    let pan = data.byte(0x40 + i);
    if (pan > 15) continue;
    let name = pan <= 7 ? "L" + (pan + 1) : "R" + (pan - 7);
    channels.set(i, new Channel(name, pan <= 7 ? -0.6 : 0.6));
  }
  let orders = [];
  for (let i = 0; i < num_orders; ++i) {
    let order = data.byte(0x60 + i);
    if (order == 254) continue;
    if (order == 255) break;
    orders.push(order);
  }
  let instruments = [];
  for (let i = 0; i < num_instruments; ++i) {
    let parapointer = data.word(0x60 + num_orders + i * 2);
    let instrument = ParseInstrument(data, parapointer * 16);
    if (instrument !== undefined) {
      instruments.push(instrument);
    }
  }
  let patterns = [];
  for (let i = 0; i < num_patterns; ++i) {
    let parapointer = data.word(0x60 + num_orders + (num_instruments + i) * 2);
    let pattern = ParsePattern(data, parapointer * 16);
    patterns.push(pattern);
  }
  if (default_pan == 252) {
    for (let [num, chan] of channels) {
      let pan = data.word(0x60 + num_orders + (num_instruments + num_patterns) * 2 + num);
      chan.pan = pan / 7.5 - 1;
    }
  }
  if (master_volume & 0x80 == 0) {
    for (let [num, chan] of channels) {
      chan.pan = 0;
    }
  }

  return new Song(name, global_volume / 64, initial_speed, initial_tempo, channels, instruments, orders, patterns);
}

/**
 * @param {Data} data 
 * @param {number} offset 
 * @return {Pattern}
 */
function ParsePattern(data, offset) {
  let length = data.word(offset);
  let rows = [];
  let row = [];
  for (let i = 2; i < length; ++i) {
    let c = data.byte(offset + i);
    if (c == 0) {
      rows.push(new Row(row));
      row = [];
      continue;
    }
    let channel = c & 0x1f;
    let note = null;
    let instrument = null;
    let volume = null;
    let effect = null;
    let info = null;
    if (c & 0x20) {
      let n = data.byte(offset + i + 1);
      if (n == 254) {
        note = n;
      } else if (n != 255) {
        note = ((n % 0xf0) >> 4) * 12 + (n & 0x0f);
        instrument = data.byte(offset + i + 2);
      }
      i += 2;
    }
    if (c & 0x40) {
      volume = data.byte(offset + i + 1) / 64;
      ++i;
    }
    if (c & 0x80) {
      effect = data.byte(offset + i + 1);
      info = data.byte(offset + i + 2);
      i += 2;
    }
    row.push(new Command(channel, note, instrument, volume, effect, info));
  }
  if (row.length != 0) {
    rows.push(new Row(row));
  }
  return new Pattern(rows);
}

/**
* @param {Data} data 
* @param {number} offset 
* @returns {Instrument|undefined}
*/
function ParseInstrument(data, offset) {
  let type = data.byte(0 + offset);
  let packed = data.byte(0x1e + offset);
  let mark = data.ascii(0x4c + offset, 4);
  if (type == 0) return;
  if (type != 1 || packed || mark != "SCRS") {
    throw "Not a supported instrument";
  }
  let ptr = (data.byte(0x0d + offset) << 16) + data.word(0x0e + offset);
  let length = data.word(0x10 + offset);
  let loop_begin = data.word(0x14 + offset);
  let loop_end = data.word(0x18 + offset);
  let volume = data.word(0x1c + offset);
  let flags = data.byte(0x1f + offset);
  if (flags & 6) {
    throw "Unsupported sample type";
  }
  let middle_c_freq = data.word(0x20 + offset);
  let name = data.asciiz(0x30 + offset, 28);
  let byte_sample = data.byteArray(ptr * 16, length);
  let sample = new Float32Array(byte_sample.length);
  for (let i = 0; i < byte_sample.length; ++i) {
    sample[i] = byte_sample[i] / 127.5 - 1;
  }

  return new Instrument(name, volume / 64, !!(flags & 1), loop_begin, loop_end, middle_c_freq, sample);
}

class Data {
  /**
   * @param {!Uint8Array} data
   */
  constructor(data) {
    /** @private @type {!Uint8Array} */
    this._data = data;
  }

  /**
   * @param {number} offset
   * @returns {number}
   */
  byte(offset) {
    return this._data[offset];
  }

  /**
   * @param {number} offset
   * @returns {number}
   */
  word(offset) {
    return this._data[offset] +
      (this._data[offset + 1] << 8);
  }

  /**
   * @param {number} offset
   * @returns {number}
   */
  dword(offset) {
    return this._data[offset] +
      (this._data[offset + 1] << 8) +
      (this._data[offset + 2] << 16) +
      (this._data[offset + 3] << 24);
  }

  /**
   * @param {number} offset
   * @param {number} length
   * @returns {string}
   */
  ascii(offset, length) {
    let str = "";
    for (let i = 0; i < length; ++i) {
      str += String.fromCodePoint(this._data[i + offset]);
    }
    return str;
  }

  /**
   * @param {number} offset
   * @param {number} length
   * @returns {string}
   */
  asciiz(offset, length) {
    let str = "";
    for (let i = 0; i < length; ++i) {
      if (this._data[i + offset] == 0) return str;
      str += String.fromCodePoint(this._data[i + offset]);
    }
    return str;
  }

  /**
   * @param {number} offset
   * @param {number} length
   * @returns {Uint8Array}
   */
  byteArray(offset, length) {
    return this._data.slice(offset, offset + length);
  }
}

