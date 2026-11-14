import type { SpacecraftComponent } from '../../data/spacecraft';

export type SpacecraftExplorerView = 'exterior' | 'systems';

export interface SpacecraftRendererProps {
  components: readonly SpacecraftComponent[];
  selectedComponentId: string | null;
  highlightedComponentIds: readonly string[];
  zoom: number;
  onSelectComponent: (componentId: string) => void;
}
