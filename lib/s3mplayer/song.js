"use strict";

export class Channel {
  /**
   * @param {string} name
   * @param {number} pan
   */
  constructor(name, pan) {
    /** @type {string} */
    this.name = name;
    /**
     * 0 = left, 7 = middle, 15 = right
     * @type {number}
     */
    this.pan = pan;
  }
}

export class Instrument {
  /**
   * @param {string} name 
   * @param {number} volume 
   * @param {boolean} looped 
   * @param {number} loop_begin 
   * @param {number} loop_end 
   * @param {number} middle_c_freq 
   * @param {!Float32Array} sample 
   */
  constructor(name, volume, looped, loop_begin, loop_end, middle_c_freq, sample) {
    /** @type {string} */
    this.name = name;
    /** @type {number} */
    this.volume = volume;
    /** @type {boolean} */
    this.looped = looped;
    /** @type {number} */
    this.loop_begin = loop_begin;
    /** @type {number} */
    this.loop_end = loop_end;
    /** @type {number} */
    this.middle_c_freq = middle_c_freq;
    /** @type {!Float32Array} */
    this.sample = sample;
  }
}

export class Command {
  /**
   * @param {number} channel
   * @param {?number} note 
   * @param {?number} instrument 
   * @param {?number} volume 
   * @param {?number} effect 
   * @param {?number} info 
   */
  constructor(channel, note, instrument, volume, effect, info) {
    /** @type {number} */
    this.channel = channel;
    /**
     * 0 is C0, 1 is C#0, 11 is B0, 12 is C1, 48 is C4, and so on.
     * 254 is key-off.
     * @type {?number}
     */
    this.note = note;
    /** @type {?number} */
    this.instrument = instrument;
    /** @type {?number} */
    this.volume = volume;
    /** @type {?number} */
    this.effect = effect;
    /** @type {?number} */
    this.info = info;
  }
}

export class Row {
  /**
   * @param {!Array<!Command>} commands 
   */
  constructor(commands) {
    /** @type {!Array<!Command>} */
    this.commands = commands;
  }
}

export class Pattern {
  /**
   * @param {!Array<!Row>} rows
   */
  constructor(rows) {
    /** @type {!Array<!Row>} */
    this.rows = rows;
  }
}

export class Song {
  /**
   * @param {string} name 
   * @param {number} volume 
   * @param {number} speed 
   * @param {number} tempo 
   * @param {!Map<number, !Channel>} channels 
   * @param {!Array<!Instrument>} instruments 
   * @param {!Array<number>} orders 
   * @param {!Array<!Pattern>} patterns 
   */
  constructor(name, volume, speed, tempo, channels, instruments, orders, patterns) {
    /** @type {string} */
    this.name = name;
    /** @type {number} */
    this.volume = volume;
    /** @type {number} */
    this.speed = speed;
    /** @type {number} */
    this.tempo = tempo;
    /** @type {!Map<number, !Channel>} */
    this.channels = channels;
    /** @type {!Array<!Instrument>} */
    this.instruments = instruments;
    /** @type {!Array<number>} */
    this.orders = orders;
    /** @type {!Array<!Pattern>} */
    this.patterns = patterns;
  }
}
