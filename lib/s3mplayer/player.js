"use strict";

import * as Song from "./song.js";

const kEffectSpeed = 1,
  kEffectJump = 2,
  kEffectBreak = 3,
  kEffectSlide = 4,
  kEffectPitchDown = 5,
  kEffectPitchUp = 6,
  kEffectNotePortamento = 7,
  kEffectVibrato = 8,
  kEffectArpeggio = 10,
  kEffectVibratoSlide = 11,
  kEffectOffset = 15,
  kEffectRetrig = 17,
  kEffectSMulti = 19,
  kSubeffectNoteDelay = 0x0d;

const kVibratoWave = [
  0, 24, 49, 74, 97, 120, 141, 161,
  180, 197, 212, 224, 235, 244, 250, 253,
  255, 253, 250, 244, 235, 224, 212, 197,
  180, 161, 141, 120, 97, 74, 49, 24];

const kNotePeriods = [
  27392, 25856, 24384, 23040, 21696, 20480, 19328, 18240, 17216, 16256, 15360, 14496,
  13696, 12928, 12192, 11520, 10848, 10240, 9664, 9120, 8608, 8128, 7680, 7248,
  6848, 6464, 6096, 5760, 5424, 5120, 4832, 4560, 4304, 4064, 3840, 3624,
  3424, 3232, 3048, 2880, 2712, 2560, 2416, 2280, 2152, 2032, 1920, 1812,
  1712, 1616, 1524, 1440, 1356, 1280, 1208, 1140, 1076, 1016, 960, 906,
  856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,
  428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,
  214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113,
  107, 101, 95, 90, 85, 80, 75, 71, 67, 63, 60, 56
];

function FromToPeriod(playback_rate) {
  return 1712 / playback_rate;
}

function FindPeriod(period) {
  let min = 0;
  let max = kNotePeriods.length;
  while (min < max) {
    let mid = Math.floor((min + max) / 2);
    let seen = kNotePeriods[mid];
    if (period == seen) return mid;
    if (period > seen) {
      max = mid;
    } else {
      min = mid + 1;
    }
  }
  return min;
}

export class Player {
  constructor(song) {
    /** @private @type {!Song.Song} */
    this._song = song;
    /** @private @type {number} */
    this._tempo = song.tempo;
    /** @private @type {number} */
    this._speed = song.speed;
    /** @private @type {number} */
    this._order = 0;
    /** @private @type {number} */
    this._row = 0;
    /** @private @type {number} */
    this._tick = this._speed;
    /** @private @type {boolean} */
    this._jump = false;
    /** @private @type {boolean} */
    this._break = false;
    /** @private @type {boolean} */
    this._running = false;
    /** @private @type {number} */
    this._milliseconds_per_tick = 2500 / song.tempo;
    /** @private @type {number} */
    this._milliseconds_played = 0;
    /** @private @type {?AudioContext} */
    this._ctx = null;
    /** @private @type {!Map<number, !Channel>} */
    this._channels = new Map();
    /** @private @type {!Array<!Sample>} */
    this._samples = [];
    /** @private @type {!Map<string, !Array<function(!Player)>>} */
    this._cues = new Map();
  }

  play() {
    this._init();
    this._updateTimings();
    this._running = true;
    this._doFrame();
  }

  stop() {
    this._running = false;
    this._channels.forEach(chn => chn.stop());
  }

  waitForCue(order, row) {
    return new Promise((resolve) => {
      let key = order + ',' + row;
      let cue_list = this._cues.get(key);
      if (cue_list === undefined) {
        cue_list = [];
        this._cues.set(key, cue_list);
      }
      cue_list.push(resolve);
    });
  }

  getSample(num) {
    return this._samples[num];
  }

  jumpToOrder(order) {
    this._row = -1;
    if (!this._break && !this._jump) {
      this._order = order;
      if (this._order >= this._song.orders.length) {
        this._order = 0;
      }
    }
    this._jump = true;
  }

  breakPattern(row) {
    this._row = row - 1;
    if (row > 62) {
      this._row = -1;
    }
    if (!this._break && !this._jump) {
      ++this._order;
      if (this._order >= this._song.orders.length) {
        this._order = 0;
      }
    }
    this._break = true;
  }

  get milliseconds_per_tick() {
    return this._milliseconds_per_tick;
  }

  get tick() {
    return this._tick;
  }

  get speed() {
    return this._speed;
  }

  set speed(speed) {
    this._speed = speed;
    this._updateTimings();
  }

  /** @private */
  _init() {
    if (this._ctx === null) {
      let ctx = new AudioContext();
      this._ctx = ctx;
      this._song.channels.forEach(
        (chn, num) => this._channels.set(
          num,
          new Channel(ctx, this, chn)));
      this._song.instruments.forEach(
        instrument => this._samples.push(
          Sample.FromInstrument(ctx, instrument)));
    }
  }

  /** @private */
  _updateTimings() {
    this._milliseconds_per_tick = 2500 / this._tempo;
  }

  /** @private */
  _doFrame() {
    while (this._ctx.currentTime * 1000 - this._milliseconds_played > 0) {
      this._doTick();
      this._milliseconds_played += this._milliseconds_per_tick;
    }
    if (this._running) requestAnimationFrame(() => this._doFrame());
  }

  /** @private */
  _doTick() {
    if (!this._running) {
      return;
    }

    this._tick++;
    if (this._tick >= this._speed) {
      let cues = this._cues.get(this._order + ',' + this._row);
      if (cues) {
        cues.forEach(c => c(this));
      }
      if (!this._running) {
        this.stop();
        return;
      }
      if (this._row >= 64) {
        this._row = 0;
        this._order++;
      }
      if (this._order == this._song.orders.length) {
        this.stop();
        return;
      }
      this._break = false;
      this._jump = false;
      this._tick = 0;
      this._doRow();
      this._row++;
    } else {
      this._updateEffects();
    }
  }

  /** @private */
  _doRow() {
    let pattern = this._song.patterns[this._song.orders[this._order]];
    let row = pattern.rows[this._row];
    for (const [num, chn] of this._channels.entries()) {
      chn.doRow();
    }
    for (const cmd of row.commands) {
      this._channels.get(cmd.channel).doCommand(cmd);
    }
  }

  /** @private */
  _updateEffects() {
    for (const [num, chn] of this._channels.entries()) {
      chn.updateEffects();
    }
  }
}

class Channel {
  /**
   * @param {!AudioContext} ctx 
   * @param {!Player} player 
   * @param {!Song.Channel} chn 
   */
  constructor(ctx, player, chn) {
    /** @private @type {!AudioContext} */
    this._ctx = ctx;
    /** @private @type {!Player} */
    this._player = player;
    /** @private @type {!GainNode} */
    this._gain = ctx.createGain();
    /** @private @type {!StereoPannerNode} */
    this._panner = ctx.createStereoPanner();
    /** @private @type {?AudioBufferSourceNode} */
    this._sound = null;
    /** @private @type {!EffectInfo} */
    this._effect_info = new EffectInfo();
    /** @private @type {!ChannelState} */
    this._state = ChannelState.InitialState();
    /** @private @type {!ChannelState} */
    this._next_state = ChannelState.EmptyState();

    this._gain.gain.value = 1;
    this._panner.pan.value = chn.pan;
    this._gain.connect(this._panner);
    this._panner.connect(this._ctx.destination);
  }

  stop() {
    if (this._sound !== null) {
      this._sound.stop();
      this._sound = null;
    }
  }

  doRow() {
    this._effect_info.current_effect = null;
  }

  /**
   * @param {Song.Command} cmd
   */
  doCommand(cmd) {
    if (cmd.instrument !== null && cmd.instrument != 0) {
      let sample = this._player.getSample(cmd.instrument - 1);
      this._next_state.sample = sample;
      this._next_state.volume = sample.volume;
    }

    if (cmd.volume !== null) {
      this._next_state.volume = cmd.volume;
    }

    if (cmd.note !== null) {
      if (cmd.note == 254) {
        this._next_state.period = 0;
      } else {
        this._next_state.period = kNotePeriods[cmd.note];
      }
    }

    this._effect_info.current_effect = cmd.effect;
    switch (cmd.effect) {
      case null:
        break;
      case kEffectSpeed:
        this._player.speed = cmd.info;
        break;
      case kEffectJump:
        this._player.jumpToOrder(cmd.info);
        break;
      case kEffectBreak: {
        let row = ((cmd.info & 0xf0) >> 4) * 10 + (cmd.info & 0x0f);
        this._player.breakPattern(row);
        break;
      }
      case kEffectSlide:
        if (cmd.info) this._effect_info.slide_speed = cmd.info;
        this._doEffectSlide();
        break;
      case kEffectPitchDown:
        if (cmd.info) this._effect_info.portamento_speed = cmd.info;
        this._doEffectPitchDown();
        break;
      case kEffectPitchUp:
        if (cmd.info) this._effect_info.portamento_speed = cmd.info;
        this._doEffectPitchUp();
        break;
      case kEffectNotePortamento:
        if (this._next_state.period != null) {
          this._effect_info.period_to_portamento = this._next_state.period;
          this._next_state.period = null;
        }
        if (cmd.info) this._effect_info.portamento_speed = cmd.info;
        this._doEffectNotePortamento();
        break;
      case kEffectVibrato:
        if (cmd.info) this._effect_info.vibrato = cmd.info;
        this._doEffectVibrato();
        break;
      case kEffectArpeggio:
        if (cmd.info) this._effect_info.arpeggio = cmd.info
        break;
      case kEffectVibratoSlide:
        if (cmd.info) this._effect_info.slide_speed = cmd.info;
        break;
      case kEffectOffset:
        this._doEffectOffset(cmd.info);
        break;
      case kEffectRetrig:
        if (cmd.info) this._effect_info.retrig = cmd.info;
        break;
      case kEffectSMulti:
        {
          this._effect_info.current_subeffect = (cmd.info & 0xf0) >> 4;
          let subinfo = cmd.info & 0x0f;
          switch (this._effect_info.current_subeffect) {
            case kSubeffectNoteDelay: {
              this._effect_info.note_delay = subinfo;
              this._effect_info.delayed_state = this._next_state;
              this._next_state = ChannelState.EmptyState();
              break;
            }
            default:
              throw "Unknown subeffect: " + this._effect_info.current_subeffect.toString().toUpperCase();
          }
          break;
        }
      default:
        throw "Unknown effect: " + String.fromCharCode(64 + cmd.effect) + " (" + cmd.effect + ")";
    }

    this._applyNextState();
  }

  updateEffects() {
    switch (this._effect_info.current_effect) {
      case null:
        break;
      case kEffectSlide:
        this._doEffectSlide();
        break;
      case kEffectPitchDown:
        this._doEffectPitchDown();
        break;
      case kEffectPitchUp:
        this._doEffectPitchUp();
        break;
      case kEffectNotePortamento:
        this._doEffectNotePortamento();
        break;
      case kEffectVibrato:
        this._doEffectVibrato();
        break;
      case kEffectArpeggio:
        this._doEffectArpeggio();
        break;
      case kEffectVibratoSlide:
        this._doEffectVibratoSlide();
        break;
      case kEffectRetrig:
        this._doEffectRetrig();
        break;
      case kEffectSMulti:
        {
          switch (this._effect_info.current_subeffect) {
            case kSubeffectNoteDelay: {
              this._doSubeffectNoteDelay();
              break;
            }
            // Fallthrough
          }
        }
    }
    this._applyNextState();
  }

  /** @private */
  _applyNextState() {
    let end_of_tick = this._ctx.currentTime + this._player.milliseconds_per_tick / 1000;
    if (this._next_state.sample !== null) {
      this._state.sample = this._next_state.sample;
      if (this._sound !== null) this._sound.stop();
      this._sound = this._makeNewSound(this._state.sample);
      this._sound.connect(this._gain);
      this._sound.start(0, this._next_state.offset || 0);
    }

    if (this._next_state.vibrato_position !== null) {
      this._state.vibrato_position = this._next_state.vibrato_position;
    }

    if (this._next_state.period == 0) {
      if (this._sound !== null) {
        this._sound.stop();
        this._sound = null;
      }
    } else if (this._next_state.period !== null || this._next_state.period_delta != this._state.period_delta) {
      if (this._next_state.period !== null) {
        this._state.period = this._next_state.period;
      }
      this._state.period_delta = this._next_state.period_delta;
      if (this._sound !== null) {
        this._sound.playbackRate.value = FromToPeriod(this._state.period + this._state.period_delta);
      }
    }

    if (this._next_state.volume !== null) {
      this._state.volume = this._next_state.volume;
      this._gain.gain.value = this._state.volume;
    }

    this._next_state = ChannelState.EmptyState();
  }

  /**
   * @param {!Sample} sample 
   * @returns {!AudioBufferSourceNode}
   * @private
   */
  _makeNewSound(sample) {
    let sound = this._ctx.createBufferSource();
    sound.buffer = sample.buffer;
    if (sample.looped) {
      sound.loop = true;
      sound.loopStart = sample.loop_begin / sample.middle_c_freq;
      sound.loopEnd = sample.loop_end / sample.middle_c_freq;
    }
    return sound;
  }

  /** @private */
  _doEffectSlide() {
    let state = this._state.MergeWith(this._next_state);
    let tick = this._player.tick;
    let param = this._effect_info.slide_speed;
    let gain = Math.round(state.volume * 64);
    if (tick == 0) {
      if ((param & 0x0f) == 0x0f) {
        gain += ((param & 0xf0) >> 4);
      } else if ((param & 0xf0) == 0xf0) {
        gain -= (param & 0x0f);
      }
    } else {
      if ((param & 0x0f) == 0) {
        gain += ((param & 0xf0) >> 4);
      } else if ((param & 0xf0) == 0) {
        gain -= (param & 0x0f);
      }
    }
    gain = Math.max(0, Math.min(64, gain));
    this._next_state.volume = gain / 64;
  }

  /** @private */
  _doEffectPitchDown() {
    let state = this._state.MergeWith(this._next_state);
    let tick = this._player.tick;
    let param = this._effect_info.portamento_speed;
    let period = state.period;
    if (tick == 0) {
      if ((param & 0xf0) == 0xf0) {
        period += (param & 0x0f) * 4;
      } else if ((param & 0xf0) == 0xe0) {
        period += param & 0x0f;
      }
    } else {
      if (param < 0xe0) {
        period += param * 4;
      }
    }
    period = Math.min(kNotePeriods[0], period);
    this._next_state.period = period;
  }

  /** @private */
  _doEffectPitchUp() {
    let state = this._state.MergeWith(this._next_state);
    let tick = this._player.tick;
    let param = this._effect_info.portamento_speed;
    let period = state.period;
    if (tick == 0) {
      if ((param & 0xf0) == 0xf0) {
        period -= (param & 0x0f) * 4;
      } else if ((param & 0xf0) == 0xe0) {
        period -= param & 0x0f;
      }
    } else {
      if (param < 0xe0) {
        period -= param * 4;
      }
    }
    period = Math.max(kNotePeriods[kNotePeriods.length - 1], period);
    this._next_state.period = period;
  }

  /** @private */
  _doEffectNotePortamento() {
    let state = this._state.MergeWith(this._next_state);
    let tick = this._player.tick;
    let param = this._effect_info.portamento_speed;
    let target = this._effect_info.period_to_portamento;
    let period = state.period;
    if (tick > 0) {
      if (target > period) {
        period = Math.min(target, period + param * 4);
      } else if (target < period) {
        period = Math.max(target, period - param * 4);
      }
    }
    this._next_state.period = period;
  }

  /** @private */
  _doEffectVibrato() {
    let state = this._state.MergeWith(this._next_state);
    let tick = this._player.tick;
    let param = this._effect_info.vibrato;
    let speed = (param & 0xf0) >> 4;
    let depth = param & 0x0f;
    let position = state.vibrato_position || 0;
    let delta = Math.floor(kVibratoWave[position >= 0 ? position : 32 + position] * depth / 128);
    if (state.vibrato_position < 0) delta *= -1;
    if (tick > 0) {
      position += speed;
      if (position > 31) position -= 64;
    }
    this._next_state.vibrato_position = position;
    this._next_state.period_delta = delta * 4;
  }

  /** @private */
  _doEffectArpeggio() {
    let state = this._state.MergeWith(this._next_state);
    let tick = this._player.tick;
    let param = this._effect_info.arpeggio;
    let semitone = [(param & 0xf0) >> 4, param & 0x0f];
    let note = tick % 3;
    if (note == 0) {
      this._next_state.period_delta = 0;
    } else {
      let index = FindPeriod(state.period);
      index += semitone[note - 1];
      index = Math.max(0, Math.min(kNotePeriods.length - 1, index));
      this._next_state.period_delta = kNotePeriods[index] - state.period;
    }
  }

  /** @private */
  _doEffectVibratoSlide() {
    this._doEffectVibrato();
    this._doEffectSlide();
  }

  /** @private */
  _doEffectOffset(param) {
    let state = this._state.MergeWith(this._next_state);
    let skip = param * 0x100;
    this._next_state.offset = skip / state.sample.middle_c_freq;
  }

  /** @private */
  _doEffectRetrig() {
    let tick = this._player.tick;
    let param = this._effect_info.retrig;
    let slide = (param & 0xf0) >> 4;
    let ticks = param & 0x0f;
    if ((ticks % tick) != 0) return;
    this._next_state.period = this._state.period;
    this._next_state.sample = this._state.sample;
    let gain = Math.round(this._state.volume * 64);
    const slide_amounts = [0, -1, -2, -4, -8, -16, 2 / 3, 1 / 2, 0, 1, 2, 4, 8, 16, 3 / 2, 2];
    let amount = slide_amounts[slide];
    gain += amount;
    gain = Math.max(0, Math.min(64, gain));
    this._next_state.volume = gain / 64;
  }

  /** @private */
  _doSubeffectNoteDelay() {
    let tick = this._player.tick;
    let param = this._effect_info.note_delay;
    if (tick == param && this._effect_info.delayed_state) {
      this._next_state = this._effect_info.delayed_state;
    }
  }
}

class EffectInfo {
  /** @type {?number} */
  current_effect = null;

  /** @type {number} */
  current_subeffect = 0;

  /** @type {number} */
  slide_speed = 0;

  /** @type {number} */
  portamento_speed = 0;

  /** @type {number} */
  period_to_portamento = 0;

  /** @type {number} */
  vibrato = 0;

  /** @type {number} */
  arpeggio = 0;

  /** @type {number} */
  note_delay = 0;

  /** @type {?ChannelState} */
  delayed_state = null;

  /** @type {number} */
  retrig = 0
}

class Sample {
  /**
   * @param {!AudioBuffer} buffer 
   * @param {number} middle_c_freq 
   * @param {number} volume
   * @param {boolean} looped 
   * @param {number} loop_begin 
   * @param {number} loop_end 
   */
  constructor(buffer, middle_c_freq, volume, looped, loop_begin, loop_end) {
    /** @type {!AudioBuffer} */
    this.buffer = buffer;
    /** @type {number} */
    this.middle_c_freq = middle_c_freq;
    /** @type {number} */
    this.volume = volume;
    /** @type {boolean} */
    this.looped = looped;
    /** @type {number} */
    this.loop_begin = loop_begin;
    /** @type {number} */
    this.loop_end = loop_end;
  }

  /**
   * @param {!AudioContext} ctx 
   * @param {!Song.Instrument} instrument 
   * @returns {!Sample}
   */
  static FromInstrument(ctx, instrument) {
    let buffer = ctx.createBuffer(1, instrument.sample.length, instrument.middle_c_freq);
    buffer.copyToChannel(instrument.sample, 0);
    return new Sample(buffer, instrument.middle_c_freq, instrument.volume, instrument.looped, instrument.loop_begin, instrument.loop_end);
  }
}

class ChannelState {
  /**
   * @param {?Sample} sample
   * @param {?number} period 
   * @param {?number} volume 
   * @param {?number} offset
   * @param {?number} vibrato_position
   * @param {number} period_delta
   */
  constructor(sample, period, volume, offset, vibrato_position, period_delta) {
    /** @type {?Sample} */
    this.sample = sample;
    /** @type {?number} */
    this.period = period;
    /** @type {?number} */
    this.volume = volume;
    /** @type {?number} */
    this.offset = offset;
    /** @type {?number} */
    this.vibrato_position = vibrato_position;
    /** @type {number} */
    this.period_delta = period_delta;
  }

  /**
   * @returns {!ChannelState}
   */
  static EmptyState() {
    return new ChannelState(null, null, null, null, null, 0);
  }

  /**
   * @returns {!ChannelState}
   */
  static InitialState() {
    return new ChannelState(null, 1712, 0, 0, 0, 0);
  }

  /**
   * @param {!ChannelState} other
   * @returns {!ChannelState}
   */
  MergeWith(other) {
    return new ChannelState(
      other.sample === null ? this.sample : other.sample,
      other.period === null ? this.period : other.period,
      other.volume === null ? this.volume : other.volume,
      other.offset === null ? this.offset : other.offset,
      other.vibrato_position === null ? this.vibrato_position : other.vibrato_position,
      other.period_delta === null ? this.period_delta : other.period_delta);
  }
}
