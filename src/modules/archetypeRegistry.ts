import { IFurnitureArchetype, FurnitureType } from '../types/furniture';

class ArchetypeRegistry {
  private registry: Map<FurnitureType, IFurnitureArchetype> = new Map();

  register(archetype: IFurnitureArchetype): void {
    this.registry.set(archetype.id, archetype);
  }

  get(type: FurnitureType): IFurnitureArchetype | undefined {
    return this.registry.get(type);
  }

  getAll(): IFurnitureArchetype[] {
    return Array.from(this.registry.values());
  }

  has(type: FurnitureType): boolean {
    return this.registry.has(type);
  }
}

export const archetypeRegistry = new ArchetypeRegistry();
