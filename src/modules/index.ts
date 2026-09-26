import { archetypeRegistry } from './archetypeRegistry';
import { carcassArchetype } from './carcass';
import { wardrobeArchetype } from './wardrobe';
import { tvUnitArchetype } from './tv-unit';

// Register built-in archetypes
archetypeRegistry.register(carcassArchetype);
archetypeRegistry.register(wardrobeArchetype);
archetypeRegistry.register(tvUnitArchetype);

export { archetypeRegistry };
export { carcassArchetype, wardrobeArchetype, tvUnitArchetype };
