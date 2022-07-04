export class KeepAwake {
  constructor() {
    this._wakelock = null;
    this._visibility_handler = null;
    if (navigator.wakeLock === undefined) return;
    this._visibility_handler = () => {
      if (this._wakelock !== null && document.visibilityState === 'visible') {
        this._reset();
      }
    };
    document.addEventListener('visibilitychange', this._visibility_handler);
    this._reset();
  }

  dispose() {
    if (this._visibility_handler !== null) {
      document.removeEventListener('visibilitychange', this._visibility_handler);
      this._visibility_handler = null;
    }
    this._wakelock = null;
  }

  _reset() {
    navigator.wakeLock.request('screen').then(wl => { this._wakelock = wl; });
  }
}
