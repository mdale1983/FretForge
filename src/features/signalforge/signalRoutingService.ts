import { findCatalogItem } from "./gearCatalog";
import type { SignalBlock, SignalBlockType } from "./signalChainService";

export type RoutingStep = {
  from: SignalBlock;
  fromPort: string;
  to: SignalBlock;
  toPort: string;
  reason?: string;
};

export type SignalChainIssue = {
  id: string;
  severity: "error" | "warning";
  message: string;
};

export function routingStepKey(step: RoutingStep) {
  return `${step.from.id}:${step.fromPort}>${step.to.id}:${step.toPort}`;
}

const endpointTypes: SignalBlockType[] = ["interface", "daw"];
const gainTypes: SignalBlockType[] = ["overdrive", "distortion", "amp"];

function isNoiseSource(block: SignalBlock) {
  return Boolean(findCatalogItem(block.label, block.type)?.createsNoise || gainTypes.includes(block.type));
}

export function buildRoutingSteps(blocks: SignalBlock[]): RoutingStep[] {
  const activeBlocks = blocks.filter((block) => !block.bypassed);
  const gateIndex = activeBlocks.findIndex((block) => {
    const profile = findCatalogItem(block.label, block.type)?.routingProfile;
    return profile === "detector_loop" || profile === "send_return_loop";
  });
  const gateProfile = gateIndex >= 0
    ? findCatalogItem(activeBlocks[gateIndex].label, activeBlocks[gateIndex].type)?.routingProfile
    : undefined;

  if (gateIndex < 0) {
    return activeBlocks.slice(0, -1).map((block, index) => ({
      from: block,
      fromPort: "OUTPUT",
      to: activeBlocks[index + 1],
      toPort: "INPUT",
    }));
  }

  const gate = activeBlocks[gateIndex];
  const noiseSources = activeBlocks.filter((block) => block.id !== gate.id && isNoiseSource(block));
  if (noiseSources.length === 0) {
    return activeBlocks.slice(0, -1).map((block, index) => ({
      from: block,
      fromPort: "OUTPUT",
      to: activeBlocks[index + 1],
      toPort: "INPUT",
    }));
  }

  const cleanBeforeGate = activeBlocks.slice(0, gateIndex).filter((block) => !isNoiseSource(block));
  const cleanAfterCandidates = activeBlocks.slice(gateIndex + 1).filter((block) => !isNoiseSource(block));
  const cleanAfterGate = [
    ...cleanAfterCandidates.filter((block) => !endpointTypes.includes(block.type)),
    ...cleanAfterCandidates.filter((block) => endpointTypes.includes(block.type)),
  ];
  const steps: RoutingStep[] = [];

  for (let index = 0; index < cleanBeforeGate.length - 1; index += 1) {
    steps.push({ from: cleanBeforeGate[index], fromPort: "OUTPUT", to: cleanBeforeGate[index + 1], toPort: "INPUT" });
  }
  if (cleanBeforeGate.length > 0) {
    steps.push({ from: cleanBeforeGate[cleanBeforeGate.length - 1], fromPort: "OUTPUT", to: gate, toPort: gateProfile === "send_return_loop" ? "INPUT" : "GUITAR IN" });
  }
  steps.push({ from: gate, fromPort: gateProfile === "send_return_loop" ? "SEND" : "GUITAR OUT", to: noiseSources[0], toPort: "INPUT" });
  for (let index = 0; index < noiseSources.length - 1; index += 1) {
    steps.push({ from: noiseSources[index], fromPort: "OUTPUT", to: noiseSources[index + 1], toPort: "INPUT" });
  }
  steps.push({ from: noiseSources[noiseSources.length - 1], fromPort: "OUTPUT", to: gate, toPort: gateProfile === "send_return_loop" ? "RETURN" : "DEC IN" });
  if (cleanAfterGate.length > 0) {
    steps.push({ from: gate, fromPort: gateProfile === "send_return_loop" ? "OUTPUT" : "DEC OUT", to: cleanAfterGate[0], toPort: "INPUT" });
    for (let index = 0; index < cleanAfterGate.length - 1; index += 1) {
      steps.push({ from: cleanAfterGate[index], fromPort: "OUTPUT", to: cleanAfterGate[index + 1], toPort: "INPUT" });
    }
  }
  return steps;
}

export function validateSignalChain(blocks: SignalBlock[]): SignalChainIssue[] {
  const issues: SignalChainIssue[] = [];
  const active = blocks.filter((block) => !block.bypassed);
  const instruments = active.filter((block) => block.type === "instrument");
  const destinations = active.filter((block) => endpointTypes.includes(block.type));
  const tuners = active.filter((block) => block.type === "tuner");
  const activeGate = active.find((block) => block.type === "noise_gate");
  const noisyPedals = active.filter(isNoiseSource);

  if (instruments.length === 0) issues.push({ id: "missing-instrument", severity: "error", message: "Add a guitar or pickup source." });
  if (instruments.length > 1) issues.push({ id: "multiple-instruments", severity: "error", message: "Use one guitar source per physical chain." });
  if (destinations.length === 0) issues.push({ id: "missing-destination", severity: "error", message: "Add an audio interface, amplifier, or recording destination." });
  if (destinations.length > 1) issues.push({ id: "multiple-destinations", severity: "warning", message: "Multiple destinations are active; verify which output ends this chain." });
  if (tuners.length === 0) issues.push({ id: "missing-tuner", severity: "warning", message: "No tuner pedal is included in this rig." });
  if (tuners.length > 1) issues.push({ id: "multiple-tuners", severity: "warning", message: "Multiple tuner pedals are active in this rig." });
  if (noisyPedals.length > 0 && !activeGate) issues.push({ id: "missing-gate", severity: "warning", message: "Gain pedals are active without a noise gate." });
  if (blocks.some((block) => block.type === "noise_gate" && block.bypassed) && noisyPedals.length > 0) {
    issues.push({ id: "bypassed-gate", severity: "warning", message: "The noise gate is bypassed, so gain pedals are routed in series." });
  }
  if (active.length < 2) issues.push({ id: "incomplete-route", severity: "error", message: "At least two active devices are required to create a route." });

  const duplicateLabels = [...new Set(active.map((block) => block.label))].filter((label) => active.filter((block) => block.label === label).length > 1);
  if (duplicateLabels.length > 0) issues.push({ id: "duplicate-models", severity: "warning", message: `Repeated device${duplicateLabels.length === 1 ? "" : "s"}: ${duplicateLabels.join(", ")}.` });
  return issues;
}
