import {
  getPreferredAudioDeviceName,
  routeAudioContextToPreferredDevice,
} from "../../services/audioRoutingService";

let context: AudioContext | null = null;
let routedPreference = "";
let routeAvailable = false;

export async function getForgePulseAudioContext(requirePreferredRoute = false) {
  const AudioContextClass = window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) throw new Error("Web Audio is unavailable.");

  context ??= new AudioContextClass();
  if (context.state === "suspended") await context.resume();

  const preferredDevice = getPreferredAudioDeviceName();
  if (preferredDevice !== routedPreference || !routeAvailable) {
    routeAvailable = await routeAudioContextToPreferredDevice(context);
    routedPreference = preferredDevice;
  }

  if (requirePreferredRoute && !routeAvailable) {
    throw new Error("The selected FretForge audio output is not available to Voice Coach.");
  }
  return context;
}
