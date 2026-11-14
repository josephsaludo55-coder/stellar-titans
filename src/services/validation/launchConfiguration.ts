import { instrumentCatalog } from '../../data/instruments';
import { launchVehicleCatalog, trajectoryCatalog } from '../../data/launchVehicles';
import { spacecraftDesignCatalog } from '../../data/spacecraftDesigner';
import type { GameState, MissionConfiguration } from '../../state/gameTypes';

export function calculateLaunchMassKg(componentIds: string[], instrumentIds: string[]): number {
  const componentsMass = spacecraftDesignCatalog
    .filter((component) => componentIds.includes(component.id))
    .reduce((total, component) => total + component.massKg, 0);
  const instrumentMass = instrumentCatalog
    .filter((instrument) => instrumentIds.includes(instrument.id))
    .reduce((total, instrument) => total + instrument.massKg, 0);
  return componentsMass + instrumentMass;
}

export interface LaunchConfigurationValidation {
  isValid: boolean;
  issues: string[];
  spacecraftMassKg: number;
  remainingPayloadMarginKg: number | null;
  launchVehicleName: string | null;
  trajectoryName: string | null;
}

export function validateLaunchConfiguration(state: Pick<GameState,
  'missionConfiguration' | 'selectedSpacecraftComponentIds' | 'selectedInstrumentIds' | 'selectedLaunchVehicleId' | 'selectedTrajectoryId'
>): LaunchConfigurationValidation {
  const { missionConfiguration, selectedSpacecraftComponentIds, selectedInstrumentIds, selectedLaunchVehicleId, selectedTrajectoryId } = state;
  const spacecraftMassKg = calculateLaunchMassKg(selectedSpacecraftComponentIds, selectedInstrumentIds);
  const vehicle = launchVehicleCatalog.find((item) => item.id === selectedLaunchVehicleId);
  const trajectory = trajectoryCatalog.find((item) => item.id === selectedTrajectoryId);
  const issues: string[] = [];

  if (!missionConfiguration?.destination || !missionConfiguration.architecture) {
    issues.push('Configure a mission destination and spacecraft architecture first.');
  }
  if (!vehicle) {
    issues.push('Select a launch vehicle.');
  } else {
    if (spacecraftMassKg > vehicle.payloadCapacityKg) {
      issues.push(`Spacecraft mass (${spacecraftMassKg.toLocaleString()} kg) exceeds the ${vehicle.name} educational payload limit (${vehicle.payloadCapacityKg.toLocaleString()} kg).`);
    }
    if (missionConfiguration?.destination && !vehicle.compatibleDestinations.includes(missionConfiguration.destination)) {
      issues.push(`${vehicle.name} is not compatible with the selected destination.`);
    }
    if (missionConfiguration?.architecture && !vehicle.compatibleArchitectures.includes(missionConfiguration.architecture)) {
      issues.push(`${vehicle.name} is not compatible with the selected spacecraft architecture.`);
    }
  }
  if (!trajectory) {
    issues.push('Select a trajectory option.');
  } else {
    if (missionConfiguration?.destination && !trajectory.compatibleDestinations.includes(missionConfiguration.destination)) {
      issues.push(`${trajectory.name} does not match the selected ${missionConfiguration.destination === 'moon' ? 'Moon' : 'Mars'} destination.`);
    }
    if (missionConfiguration?.architecture && !trajectory.compatibleArchitectures.includes(missionConfiguration.architecture)) {
      issues.push(`${trajectory.name} does not support the selected ${missionConfiguration.architecture.replace('-', ' ')} architecture.`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    spacecraftMassKg,
    remainingPayloadMarginKg: vehicle ? vehicle.payloadCapacityKg - spacecraftMassKg : null,
    launchVehicleName: vehicle?.name ?? null,
    trajectoryName: trajectory?.name ?? null,
  };
}

export function getCompatibleTrajectories(configuration: MissionConfiguration | null) {
  if (!configuration?.destination || !configuration.architecture) return trajectoryCatalog;
  return trajectoryCatalog.filter((trajectory) =>
    trajectory.compatibleDestinations.includes(configuration.destination!) &&
    trajectory.compatibleArchitectures.includes(configuration.architecture!),
  );
}
