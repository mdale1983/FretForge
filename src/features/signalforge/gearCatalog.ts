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

const serialPorts: GearPort[] = [
  { id: "input", label: "IN", side: "right", offset: .5 },
  { id: "output", label: "OUT", side: "left", offset: .5 },
];

export const gearCatalog: GearCatalogItem[] = [
  { id: "single-pickup-guitar", manufacturer: "Guitar", model: "Single Pickup", type: "instrument", color: "#202020", pickupCount: 1, pickupLabels: ["BRIDGE"] },
  { id: "emg-81-85", manufacturer: "EMG", model: "81/85", type: "instrument", color: "#202020", pickupCount: 2, pickupLabels: ["EMG 85", "EMG 81"] },
  { id: "three-pickup-guitar", manufacturer: "Guitar", model: "Three Pickup", type: "instrument", color: "#202020", pickupCount: 3, pickupLabels: ["NECK", "MIDDLE", "BRIDGE"] },
  { id: "shure-glxd16-plus", manufacturer: "Shure", model: "GLXD16+", type: "wireless", color: "#25282b" },
  { id: "boss-tu-2", manufacturer: "BOSS", model: "TU-2", type: "tuner", color: "#f1f1e8", routingProfile: "serial", ports: serialPorts },
  { id: "isp-decimator-g-string", manufacturer: "ISP Technologies", model: "Decimator G-String", type: "noise_gate", color: "#c9c9c3", routingProfile: "detector_loop", ports: [
    { id: "guitar_in", label: "G IN", side: "right", offset: .18 },
    { id: "guitar_out", label: "G OUT", side: "right", offset: .5 },
    { id: "dec_in", label: "DEC IN", side: "right", offset: .82 },
    { id: "dec_out", label: "DEC OUT", side: "left", offset: .5 },
  ] },
  { id: "boss-ns-2", manufacturer: "BOSS", model: "NS-2 Noise Suppressor", type: "noise_gate", color: "#d8d6c8", routingProfile: "send_return_loop", ports: [
    { id: "input", label: "IN", side: "right", offset: .28 },
    { id: "return", label: "RETURN", side: "right", offset: .72 },
    { id: "output", label: "OUT", side: "left", offset: .28 },
    { id: "send", label: "SEND", side: "left", offset: .72 },
  ] },
  { id: "boss-cs-3", manufacturer: "BOSS", model: "CS-3 Compression Sustainer", type: "compressor", color: "#6aa7d8", routingProfile: "serial", createsNoise: true, ports: serialPorts },
  { id: "maxon-od808", manufacturer: "Maxon", model: "OD808", type: "overdrive", color: "#65a968", routingProfile: "serial", createsNoise: true, ports: serialPorts },
  { id: "boss-ds-1", manufacturer: "BOSS", model: "DS-1 Distortion", type: "distortion", color: "#e86f24", routingProfile: "serial", createsNoise: true, ports: serialPorts },
  { id: "boss-dd-8", manufacturer: "BOSS", model: "DD-8 Digital Delay", type: "delay", color: "#f4f1e8", routingProfile: "serial", ports: serialPorts },
  { id: "empress-paraeq-mkii-deluxe", manufacturer: "Empress Effects", model: "ParaEQ MKII Deluxe", type: "eq", color: "#d4d0bd", routingProfile: "serial", ports: serialPorts },
  { id: "axe-io-one", manufacturer: "IK Multimedia", model: "AXE I/O One", type: "interface", color: "#242424" },
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
