import {
  missionArchitectures,
  missionObjectives,
  missionDestinations,
} from '../../data/missionDesign';
import type { MissionConfiguration } from '../../state/gameTypes';

export interface MissionValidationResult {
  isValid: boolean;
  issues: string[];
}

export function validateMissionConfiguration(configuration: MissionConfiguration): MissionValidationResult {
  const issues: string[] = [];

  if (!configuration.missionName.trim()) {
    issues.push('Give the mission a name before continuing.');
  }

  if (!configuration.destination) {
    issues.push('Choose a mission destination.');
  }

  if (!configuration.architecture) {
    issues.push('Choose a mission architecture.');
  }

  if (configuration.destination && !missionDestinations.some((destination) => destination.id === configuration.destination)) {
    issues.push('Choose a supported destination.');
  }

  const architecture = missionArchitectures.find((option) => option.id === configuration.architecture);
  if (configuration.destination && architecture && !architecture.destinations.includes(configuration.destination)) {
    issues.push(`${architecture.name} is not available for the selected destination.`);
  }

  if (configuration.objectiveIds.length === 0) {
    issues.push('Select at least one scientific objective.');
  }

  for (const objectiveId of configuration.objectiveIds) {
    const objective = missionObjectives.find((option) => option.id === objectiveId);
    if (!objective) {
      issues.push('One or more selected objectives are not recognized.');
      continue;
    }

    if (configuration.destination && objective.destination !== configuration.destination) {
      issues.push(`${objective.name} is not an objective for the selected destination.`);
    }

    if (configuration.architecture && !objective.compatibleArchitectures.includes(configuration.architecture)) {
      if (objective.id === 'lunar-surface-exploration' || objective.id === 'mars-surface-exploration') {
        issues.push(`${objective.name} requires surface access and mobility. Select a Rover architecture with a landing system and a mobility system.`);
      } else {
        issues.push(`${objective.name} is not compatible with the selected ${architecture?.name ?? 'architecture'} architecture.`);
      }
    }
  }

  if (!Number.isInteger(configuration.missionDurationDays) || (configuration.missionDurationDays ?? 0) < 1 || (configuration.missionDurationDays ?? 0) > 3650) {
    issues.push('Set a mission duration from 1 to 3,650 days.');
  }

  if (configuration.requiredMeasurements.length === 0) {
    issues.push('Select or add at least one required measurement.');
  }

  if (!configuration.communicationRequirement) {
    issues.push('Choose a communication requirement.');
  }

  if (!configuration.dataRequirement) {
    issues.push('Choose a data-return requirement.');
  }

  return {
    isValid: issues.length === 0,
    issues: [...new Set(issues)],
  };
}
