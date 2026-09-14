import * as THREE from 'three';
import { GameEngine } from './game/engine';
import { Player } from './game/player';
import { Environment } from './game/environment';
import { Projectile } from './game/projectile';

const container = document.getElementById('game-container') as HTMLElement;
if (!container) {
    throw new Error('Container not found');
}

const engine = new GameEngine(container);
const player = new Player(engine.getScene());
const environment = new Environment(engine.getScene());

const keys = new Set<string>();
const projectiles: Projectile[] = [];

window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (e.code === 'Space' && projectiles.length < 5) {
        projectiles.push(new Projectile(engine.getScene(), player.mesh.position.clone()));
    }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

const scrollSpeed = 15;

engine.startLoop((delta) => {
    player.update(delta, keys);
    // Pass player's Z position to the environment
    environment.update(delta, scrollSpeed, player.mesh.position.z);

    // Update projectiles and check collisions
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.update(delta);

        // Collision detection
        const projectileBox = new THREE.Box3().setFromObject(projectile.mesh);
        const ships = environment.getShips();
        
        let collided = false;
        for (let j = ships.length - 1; j >= 0; j--) {
            const ship = ships[j];
            const shipBox = new THREE.Box3().setFromObject(ship);
            
            if (projectileBox.intersectsBox(shipBox)) {
                // Collision!
                projectile.destroy();
                projectiles.splice(i, 1);
                
                environment.removeShip(ship);
                collided = true;
                break;
            }
        }

        if (!collided && projectile.mesh.position.z < -45) {
            projectile.destroy();
            projectiles.splice(i, 1);
        }
    }
});
