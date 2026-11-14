import { spacecraftDesignCatalog, type SpacecraftDesignComponent } from '../../data/spacecraftDesigner';
import type { MissionConfiguration } from '../../state/gameTypes';

export interface SpacecraftResourceSummary {
  componentCount: number;
  totalMassKg: number;
  estimatedCostUsd: number;
  powerGenerationW: number;
  powerDemandW: number;
  netPowerW: number;
  powerMarginPercent: number | null;
}

export interface SpacecraftSelectionValidation {
  isValid: boolean;
  issues: string[];
  incompatibleComponentIds: string[];
}

const componentById = new Map(spacecraftDesignCatalog.map((component) => [component.id, component]));

export function getSpacecraftComponents(componentIds: string[]): SpacecraftDesignComponent[] {
  return componentIds.flatMap((componentId) => {
    const component = componentById.get(componentId);
    return component ? [component] : [];
  });
}

export function calculateSpacecraftResources(componentIds: string[]): SpacecraftResourceSummary {
  const components = getSpacecraftComponents(componentIds);
  const totalMassKg = components.reduce((total, component) => total + component.massKg, 0);
  const estimatedCostUsd = components.reduce((total, component) => total + component.estimatedCostUsd, 0);
  const powerGenerationW = components.reduce((total, component) => total + component.powerGenerationW, 0);
  const powerDemandW = components.reduce((total, component) => total + component.powerConsumptionW, 0);
  const netPowerW = powerGenerationW - powerDemandW;

  return {
    componentCount: components.length,
    totalMassKg,
    estimatedCostUsd,
    powerGenerationW,
    powerDemandW,
    netPowerW,
    powerMarginPercent: powerGenerationW > 0 ? Math.round((netPowerW / powerGenerationW) * 100) : null,
  };
}

export function validateSpacecraftSelection(
  componentIds: string[],
  missionConfiguration: MissionConfiguration | null,
): SpacecraftSelectionValidation {
  const issues: string[] = [];
  const incompatibleComponentIds = new Set<string>();
  const components = getSpacecraftComponents(componentIds);

  if (new Set(componentIds).size !== componentIds.length) {
    issues.push('A component can only be installed once.');
  }

  const selectedByCategory = new Map<string, number>();
  for (const component of components) {
    selectedByCategory.set(component.category, (selectedByCategory.get(component.category) ?? 0) + 1);
  }

  for (const [category, count] of selectedByCategory) {
    if (count > 1) {
      issues.push(`Only one component can occupy the ${category.replace(/-/g, ' ')} system slot in this design.`);
    }
  }

  if (missionConfiguration?.destination) {
    for (const component of components) {
      const incompatibleDestination = !component.compatibleDestinations.includes(missionConfiguration.destination);
      const incompatibleArchitecture = missionConfiguration.architecture
        ? !component.compatibleArchitectures.includes(missionConfiguration.architecture)
        : false;

      if (incompatibleDestination || incompatibleArchitecture) {
        incompatibleComponentIds.add(component.id);
        const architecture = missionConfiguration.architecture?.replace(/-/g, ' ');
        issues.push(
          `${component.name} is not compatible with the selected ${missionConfiguration.destination.toUpperCase()} ${architecture ?? 'mission'} configuration.`,
        );
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues: [...new Set(issues)],
    incompatibleComponentIds: [...incompatibleComponentIds],
  };
}
