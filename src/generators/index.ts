import { createRegistry } from '../engine/registry';
import { ballDrop } from './ball-drop';
import { gridFill } from './grid-fill';
import { perfectLoop } from './perfect-loop';

export const registry = createRegistry([ballDrop, gridFill, perfectLoop]);
