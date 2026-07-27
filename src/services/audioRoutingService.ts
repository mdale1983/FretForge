export const audioPreferenceChangedEvent = "fretforge:audio-preference-changed";

const genericDeviceWords = new Set([
  "audio",
  "device",
  "input",
  "output",
  "line",
  "microphone",
  "speakers",
  "headphones",
  "default",
  "digital",
  "sound",
]);

function deviceWords(label: string) {
  return label
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 1 && !genericDeviceWords.has(word));
}

export function getPreferredAudioDeviceName() {
  return localStorage.getItem("fretforge.selectedAudioDevice") ?? "";
}

export function findPreferredMediaDevice(
  devices: MediaDeviceInfo[],
  kind: MediaDeviceKind
) {
  const preferredName = getPreferredAudioDeviceName();
  if (!preferredName) return null;

  const preferredWords = deviceWords(preferredName);
  let bestMatch: MediaDeviceInfo | null = null;
  let bestScore = 0;

  for (const device of devices) {
    if (device.kind !== kind || !device.label) continue;
    const words = deviceWords(device.label);
    const score = words.filter((word) => preferredWords.includes(word)).length;

    if (score > bestScore) {
      bestMatch = device;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

type SinkSelectableAudioContext = AudioContext & {
  setSinkId?: (sinkId: string) => Promise<void>;
};

type SinkSelectableMediaElement = HTMLMediaElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
};

export async function routeAudioContextToPreferredDevice(
  context: AudioContext
) {
  const routableContext = context as SinkSelectableAudioContext;

  if (!routableContext.setSinkId || !navigator.mediaDevices?.enumerateDevices) {
    return false;
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const output = findPreferredMediaDevice(devices, "audiooutput");

  if (!output) return false;
  await routableContext.setSinkId(output.deviceId);
  return true;
}

export async function routeMediaElementToPreferredDevice(
  element: HTMLMediaElement
) {
  const routableElement = element as SinkSelectableMediaElement;

  if (!routableElement.setSinkId || !navigator.mediaDevices?.enumerateDevices) {
    return false;
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const output = findPreferredMediaDevice(devices, "audiooutput");

  if (!output) return false;
  await routableElement.setSinkId(output.deviceId);
  return true;
}
