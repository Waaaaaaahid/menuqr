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

const playBellStrike = (context, startAt, fundamental, volume) => {
  // Several inharmonic partials create a bright, metallic bell-like ring.
  const partials = [
    { ratio: 1, level: 1 },
    { ratio: 2.756, level: 0.42 },
    { ratio: 5.404, level: 0.16 },
  ];

  partials.forEach(({ ratio, level }) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(fundamental * ratio, startAt);
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * level), startAt + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.05);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 1.08);
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
    [880, 784, 880].forEach((frequency, index) => {
      playBellStrike(context, now + index * 0.48, frequency, 0.13);
    });
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
