import { GameEngine } from './game/engine';
import { Player } from './game/player';
import { Environment } from './game/environment';

const container = document.getElementById('game-container') as HTMLElement;
if (!container) {
    throw new Error('Container not found');
}

const engine = new GameEngine(container);
const player = new Player(engine.getScene());
const environment = new Environment(engine.getScene());

const keys = new Set<string>();

window.addEventListener('keydown', (e) => keys.add(e.code));
window.addEventListener('keyup', (e) => keys.delete(e.code));

const scrollSpeed = 15;

engine.startLoop((delta) => {
    player.update(delta, keys);
    // Pass player's Z position to the environment
    environment.update(delta, scrollSpeed, player.mesh.position.z);
});
