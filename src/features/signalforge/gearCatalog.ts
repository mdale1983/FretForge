import type { SignalBlockType } from "./signalChainService";

export type GearCatalogItem = {
  id: string;
  manufacturer: string;
  model: string;
  type: SignalBlockType;
  color: string;
  routingProfile?: "serial" | "detector_loop" | "send_return_loop";
  createsNoise?: boolean;
  ports?: GearPort[];
  pickupCount?: 1 | 2 | 3;
  pickupLabels?: string[];
};

export type GearPort = {
  id: "input" | "output" | "guitar_in" | "guitar_out" | "dec_in" | "dec_out" | "send" | "return";
  label: string;
  side: "left" | "right";
  offset: number;
};

export const activePickupModels = [
  "EMG 81",
  "EMG 85",
  "EMG 81/85 Set",
  "EMG 57/66 Set",
  "EMG James Hetfield Het Set",
  "Fishman Fluence Modern",
  "Fishman Fluence Classic",
  "Fishman Fluence Open Core Classic",
  "Seymour Duncan Blackouts AHB-1",
  "Seymour Duncan Mick Thomson Blackouts",
] as const;

const serialPorts: GearPort[] = [
  { id: "input", label: "IN", side: "right", offset: .28 },
  { id: "output", label: "OUT", side: "left", offset: .28 },
];

function serialPedal(
  id: string,
  manufacturer: string,
  model: string,
  type: SignalBlockType,
  color: string,
  createsNoise = false,
): GearCatalogItem {
  return { id, manufacturer, model, type, color, routingProfile: "serial", createsNoise, ports: serialPorts };
}

export const gearCatalog: GearCatalogItem[] = [
  { id: "single-pickup-guitar", manufacturer: "Guitar", model: "Single Pickup", type: "instrument", color: "#202020", pickupCount: 1, pickupLabels: ["BRIDGE"] },
  { id: "emg-81-85", manufacturer: "EMG", model: "81/85", type: "instrument", color: "#202020", pickupCount: 2, pickupLabels: ["EMG 85", "EMG 81"] },
  { id: "three-pickup-guitar", manufacturer: "Guitar", model: "Three Pickup", type: "instrument", color: "#202020", pickupCount: 3, pickupLabels: ["NECK", "MIDDLE", "BRIDGE"] },
  { id: "shure-glxd16-plus", manufacturer: "Shure", model: "GLXD16+", type: "wireless", color: "#25282b", routingProfile: "serial", ports: serialPorts },
  serialPedal("line6-relay-g10s", "Line 6", "Relay G10S", "wireless", "#20252a"),
  serialPedal("boss-wl-50", "BOSS", "WL-50", "wireless", "#30343a"),
  serialPedal("xvive-u2", "Xvive", "U2", "wireless", "#27272a"),
  { id: "boss-tu-2", manufacturer: "BOSS", model: "TU-2", type: "tuner", color: "#f1f1e8", routingProfile: "serial", ports: serialPorts },
  serialPedal("boss-tu-3", "BOSS", "TU-3 Chromatic Tuner", "tuner", "#f4f1e8"),
  serialPedal("tc-polytune-3", "TC Electronic", "PolyTune 3", "tuner", "#f1f1ed"),
  serialPedal("peterson-strobostomp-hd", "Peterson", "StroboStomp HD", "tuner", "#23262a"),
  serialPedal("korg-pitchblack-x", "Korg", "Pitchblack X", "tuner", "#191b1d"),
  { id: "isp-decimator-g-string", manufacturer: "ISP Technologies", model: "Decimator G-String", type: "noise_gate", color: "#c9c9c3", routingProfile: "detector_loop", ports: [
    { id: "guitar_in", label: "G IN", side: "right", offset: .14 },
    { id: "guitar_out", label: "G OUT", side: "right", offset: .28 },
    { id: "dec_in", label: "DEC IN", side: "right", offset: .42 },
    { id: "dec_out", label: "DEC OUT", side: "left", offset: .28 },
  ] },
  { id: "boss-ns-2", manufacturer: "BOSS", model: "NS-2 Noise Suppressor", type: "noise_gate", color: "#d8d6c8", routingProfile: "send_return_loop", ports: [
    { id: "input", label: "IN", side: "right", offset: .18 },
    { id: "return", label: "RETURN", side: "right", offset: .38 },
    { id: "output", label: "OUT", side: "left", offset: .18 },
    { id: "send", label: "SEND", side: "left", offset: .38 },
  ] },
  serialPedal("isp-decimator-ii", "ISP Technologies", "Decimator II", "noise_gate", "#c8c8c2"),
  serialPedal("tc-sentry", "TC Electronic", "Sentry Noise Gate", "noise_gate", "#22272b"),
  serialPedal("mxr-smart-gate", "MXR", "M135 Smart Gate", "noise_gate", "#24272a"),
  serialPedal("fortin-zuul-plus", "Fortin", "ZUUL+", "noise_gate", "#16181a"),
  { id: "boss-cs-3", manufacturer: "BOSS", model: "CS-3 Compression Sustainer", type: "compressor", color: "#6aa7d8", routingProfile: "serial", createsNoise: true, ports: serialPorts },
  serialPedal("mxr-dyna-comp", "MXR", "M102 Dyna Comp", "compressor", "#b52c2c"),
  serialPedal("keeley-compressor-plus", "Keeley", "Compressor Plus", "compressor", "#f0f0e8"),
  serialPedal("xotic-sp-compressor", "Xotic", "SP Compressor", "compressor", "#e8e4d8"),
  serialPedal("wampler-ego", "Wampler", "Ego Compressor", "compressor", "#3c7fc4"),
  serialPedal("empress-compressor-mkii", "Empress Effects", "Compressor MKII", "compressor", "#3f7fbe"),
  { id: "maxon-od808", manufacturer: "Maxon", model: "OD808", type: "overdrive", color: "#65a968", routingProfile: "serial", createsNoise: true, ports: serialPorts },
  serialPedal("ibanez-ts9", "Ibanez", "TS9 Tube Screamer", "overdrive", "#4f9f61", true),
  serialPedal("ibanez-ts808", "Ibanez", "TS808 Tube Screamer", "overdrive", "#5c9b63", true),
  serialPedal("boss-sd-1", "BOSS", "SD-1 Super OverDrive", "overdrive", "#e5c83f", true),
  serialPedal("boss-bd-2", "BOSS", "BD-2 Blues Driver", "overdrive", "#3d72b8", true),
  serialPedal("fulltone-ocd", "Fulltone", "OCD", "overdrive", "#e8e5dc", true),
  serialPedal("jhs-morning-glory", "JHS", "Morning Glory V4", "overdrive", "#d9d4c4", true),
  serialPedal("earthquaker-plumes", "EarthQuaker Devices", "Plumes", "overdrive", "#d4bc45", true),
  serialPedal("mxr-timmy", "MXR", "Timmy Overdrive", "overdrive", "#4b78b7", true),
  { id: "boss-ds-1", manufacturer: "BOSS", model: "DS-1 Distortion", type: "distortion", color: "#e86f24", routingProfile: "serial", createsNoise: true, ports: serialPorts },
  serialPedal("boss-mt-2", "BOSS", "MT-2 Metal Zone", "distortion", "#20262b", true),
  serialPedal("proco-rat-2", "Pro Co", "RAT 2", "distortion", "#181a1c", true),
  serialPedal("mxr-super-badass", "MXR", "Super Badass Distortion", "distortion", "#7b1f29", true),
  serialPedal("friedman-be-od", "Friedman", "BE-OD", "distortion", "#d4b145", true),
  serialPedal("revv-g3", "Revv", "G3 Distortion", "distortion", "#6b3e9e", true),
  serialPedal("ehx-big-muff-pi", "Electro-Harmonix", "Big Muff Pi", "distortion", "#b8b8b1", true),
  serialPedal("walrus-eras", "Walrus Audio", "Eras Five-State Distortion", "distortion", "#b33939", true),
  { id: "boss-dd-8", manufacturer: "BOSS", model: "DD-8 Digital Delay", type: "delay", color: "#f4f1e8", routingProfile: "serial", ports: serialPorts },
  serialPedal("boss-dd-3t", "BOSS", "DD-3T Digital Delay", "delay", "#f2efe6"),
  serialPedal("tc-flashback-2", "TC Electronic", "Flashback 2", "delay", "#3d70ae"),
  serialPedal("mxr-carbon-copy", "MXR", "Carbon Copy Analog Delay", "delay", "#2f6a4d"),
  serialPedal("strymon-timeline", "Strymon", "Timeline", "delay", "#393c42"),
  serialPedal("strymon-el-capistan", "Strymon", "El Capistan V2", "delay", "#d7d0b7"),
  serialPedal("ehx-canyon", "Electro-Harmonix", "Canyon", "delay", "#efebe0"),
  serialPedal("walrus-arp87", "Walrus Audio", "ARP-87", "delay", "#36637a"),
  { id: "empress-paraeq-mkii-deluxe", manufacturer: "Empress Effects", model: "ParaEQ MKII Deluxe", type: "eq", color: "#d4d0bd", routingProfile: "serial", ports: serialPorts },
  serialPedal("boss-ge-7", "BOSS", "GE-7 Equalizer", "eq", "#e4e2d8"),
  serialPedal("mxr-ten-band-eq", "MXR", "Ten Band EQ", "eq", "#2a2d31"),
  serialPedal("source-audio-eq2", "Source Audio", "EQ2 Programmable Equalizer", "eq", "#272a2e"),
  serialPedal("wampler-equinox", "Wampler", "Equator Advanced EQ", "eq", "#d2b84a"),
  serialPedal("dunlop-cry-baby", "Dunlop", "Cry Baby GCB95", "pedal", "#17191b"),
  serialPedal("voodoo-lab-pedal-switcher", "Voodoo Lab", "Pedal Switcher", "pedal", "#25282c"),
  { id: "axe-io-one", manufacturer: "IK Multimedia", model: "AXE I/O One", type: "interface", color: "#242424" },
  { id: "axe-io", manufacturer: "IK Multimedia", model: "AXE I/O", type: "interface", color: "#242424" },
  { id: "axe-io-solo", manufacturer: "IK Multimedia", model: "AXE I/O Solo", type: "interface", color: "#242424" },
  { id: "focusrite-scarlett-solo-4th", manufacturer: "Focusrite", model: "Scarlett Solo 4th Gen", type: "interface", color: "#9b1f24" },
  { id: "focusrite-scarlett-2i2-4th", manufacturer: "Focusrite", model: "Scarlett 2i2 4th Gen", type: "interface", color: "#9b1f24" },
  { id: "focusrite-scarlett-4i4-4th", manufacturer: "Focusrite", model: "Scarlett 4i4 4th Gen", type: "interface", color: "#9b1f24" },
  { id: "universal-audio-volt-2", manufacturer: "Universal Audio", model: "Volt 2", type: "interface", color: "#e4dfd0" },
  { id: "universal-audio-apollo-solo", manufacturer: "Universal Audio", model: "Apollo Solo", type: "interface", color: "#22262a" },
  { id: "universal-audio-apollo-twin-x", manufacturer: "Universal Audio", model: "Apollo Twin X", type: "interface", color: "#22262a" },
  { id: "audient-id4-mkii", manufacturer: "Audient", model: "iD4 MKII", type: "interface", color: "#22262a" },
  { id: "audient-id14-mkii", manufacturer: "Audient", model: "iD14 MKII", type: "interface", color: "#22262a" },
  { id: "motu-m2", manufacturer: "MOTU", model: "M2", type: "interface", color: "#202327" },
  { id: "ssl-2-plus-mkii", manufacturer: "Solid State Logic", model: "SSL 2+ MKII", type: "interface", color: "#26292d" },
  { id: "steinberg-ur22c", manufacturer: "Steinberg", model: "UR22C", type: "interface", color: "#272a2d" },
  { id: "presonus-audiobox-usb-96", manufacturer: "PreSonus", model: "AudioBox USB 96", type: "interface", color: "#315f85" },
];

export function catalogLabel(item: GearCatalogItem) {
  return `${item.manufacturer} ${item.model}`;
}

export function findCatalogItem(label: string, type?: SignalBlockType) {
  const normalized = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  return gearCatalog.find((item) => {
    if (type && item.type !== type) return false;
    const model = item.model.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fullName = catalogLabel(item).toLowerCase().replace(/[^a-z0-9]/g, "");
    return normalized === model || normalized === fullName || fullName.includes(normalized) || normalized.includes(model);
  });
}
