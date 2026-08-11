const frequencies = { boot: 220, click: 330, window: 440, notice: 660 };

export function createAudioService(initialEnabled = false) {
  let enabled = Boolean(initialEnabled);
  let context = null;

  const ensureContext = () => {
    if (context) return context;
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) return null;
    try {
      context = new AudioContext();
      return context;
    } catch {
      return null;
    }
  };

  return {
    get enabled() { return enabled; },
    setEnabled(value) {
      enabled = Boolean(value);
      if (enabled) ensureContext();
      return enabled;
    },
    play(cue = 'click') {
      if (!enabled) return;
      try {
        const target = ensureContext();
        if (!target) return;
        const oscillator = target.createOscillator();
        const gain = target.createGain();
        oscillator.type = 'square';
        oscillator.frequency.value = frequencies[cue] ?? frequencies.click;
        gain.gain.setValueAtTime(0.025, target.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, target.currentTime + 0.06);
        oscillator.connect(gain).connect(target.destination);
        oscillator.start();
        oscillator.stop(target.currentTime + 0.06);
      } catch {
        // Audio is optional; visual interaction continues silently.
      }
    },
  };
}
