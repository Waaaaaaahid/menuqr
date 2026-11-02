// Small Web Audio notification sounds; no external audio files or network requests required.
let sharedAudioContext = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContextClass();
  }
  return sharedAudioContext;
};

// Call this from a real user gesture (tap/click/key) to satisfy browser autoplay policies.
export const unlockNotificationAudio = () => {
  const context = getAudioContext();
  if (context?.state === 'suspended') return context.resume().catch(() => {});
  return Promise.resolve();
};

const playTelephoneRingBurst = (context, startAt) => {
  // Two slightly detuned tones create the classic loud, old-school telephone trill.
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, startAt);
  master.gain.setValueAtTime(0.22, startAt + 0.015);
  master.gain.setValueAtTime(0.22, startAt + 0.52);
  master.gain.setValueAtTime(0.0001, startAt + 0.54);
  master.gain.setValueAtTime(0.22, startAt + 0.72);
  master.gain.setValueAtTime(0.22, startAt + 1.24);
  master.gain.setValueAtTime(0.0001, startAt + 1.26);
  master.connect(context.destination);

  [440, 480].forEach((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.connect(master);
    oscillator.start(startAt);
    oscillator.stop(startAt + 1.28);
  });
};

const playChimeStrike = (context, startAt, fundamental, volume) => {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(fundamental, startAt);
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(volume, startAt + 0.025);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.72);
  oscillator.connect(envelope);
  envelope.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + 0.75);
};

export const playAdminNewOrderBell = () => {
  const context = getAudioContext();
  if (!context) return;
  const play = () => {
    const now = context.currentTime + 0.025;
    // Two unmistakable "TRRING... TRRING..." telephone-style bursts.
    playTelephoneRingBurst(context, now);
    playTelephoneRingBurst(context, now + 1.75);
  };
  if (context.state === 'running') play();
  else context.resume().then(() => { if (context.state === 'running') play(); }).catch(() => {});
};

export const playCustomerReadyChime = () => {
  const context = getAudioContext();
  if (!context) return;
  const play = () => {
    const now = context.currentTime + 0.025;
    playChimeStrike(context, now, 659.25, 0.075);
    playChimeStrike(context, now + 0.22, 987.77, 0.065);
  };
  if (context.state === 'running') play();
  else context.resume().then(() => { if (context.state === 'running') play(); }).catch(() => {});
};
