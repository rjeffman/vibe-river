import * as THREE from 'three';
import { GameEngine } from './game/engine.js';
import { Player } from './game/player.js';
import { Environment } from './game/environment.js';
import { Projectile } from './game/projectile.js';
import { Explosion } from './game/explosion.js';

const container = document.getElementById('game-container') as HTMLElement;
// ...
const projectiles: Projectile[] = [];
const explosions: Explosion[] = [];
let score = 0;
// ...
const scoreElement = document.getElementById('score') as HTMLElement;
let lives = 3;
let isGameOverSequence = true;
const livesElement = document.getElementById('lives') as HTMLElement;
const gameOverScreen = document.getElementById('game-over-screen') as HTMLElement;
const keys = new Set<string>();
const engine = new GameEngine(container);
const player = new Player(engine.getScene());
const environment = new Environment(engine.getScene());

const updateScore = (points: number) => {
    score += points;
    scoreElement.textContent = score.toString().padStart(6, '0');
};

const updateLivesUI = () => {
    const icons = livesElement.getElementsByClassName('life-icon');
    for (let i = 0; i < icons.length; i++) {
        (icons[i] as HTMLElement).style.visibility = i < lives ? 'visible' : 'hidden';
    }
};

const showGameOver = () => {
    gameOverScreen.style.display = 'flex';
};

const restartGame = () => {
    lives = 3;
    score = 0;
    scoreElement.textContent = '000000';
    updateLivesUI();
    
    isGameOverSequence = false;
    gameOverScreen.style.display = 'none';
    
    environment.reset();
    player.mesh.visible = true;
    player.mesh.position.set(0, 0.9, 20);
    
    projectiles.length = 0;
    explosions.length = 0;
};

updateLivesUI();

window.addEventListener('keydown', (e) => {
    if (gameOverScreen.style.display === 'flex' && (e.key === 'Enter' || e.code === 'Enter')) {
        restartGame();
        return;
    }
    keys.add(e.code);
    if (e.code === 'Space' && projectiles.length < 5) {
        projectiles.push(new Projectile(engine.getScene(), player.mesh.position.clone()));
    }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

const scrollSpeed = 15;

engine.startLoop((delta: number) => {
    const elapsedTime = engine.getClock().getElapsedTime();
    player.update(delta, keys);
    // Pass player's Z position to the environment
    environment.update(delta, scrollSpeed, player.mesh.position.z, elapsedTime);

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        if (explosion && explosion.update(delta)) {
            explosions.splice(i, 1);
        }
    }

    if (isGameOverSequence && explosions.length === 0) {
        showGameOver();
        isGameOverSequence = false;
    }

    if (isGameOverSequence) return;

    // If no explosions are active, make sure player is visible
    if (explosions.length === 0) {
        player.mesh.visible = true;
    }

    // Player collision detection
    let playerCollided = false;
    if (player.mesh.visible) {
        const playerBox = new THREE.Box3().setFromObject(player.mesh);
        const ships = environment.getShips();
        const helicopters = environment.getHelicopters();

        for (const ship of ships) {
            if (!ship.userData.isSinking && playerBox.intersectsBox(new THREE.Box3().setFromObject(ship))) {
                playerCollided = true;
                break;
            }
        }

        if (!playerCollided) {
            for (const heli of helicopters) {
                if (playerBox.intersectsBox(new THREE.Box3().setFromObject(heli))) {
                    playerCollided = true;
                    break;
                }
            }
        }
    }

    if (playerCollided && !isGameOverSequence) {
        lives--;
        updateLivesUI();
        const explosionPos = player.mesh.position.clone();
        
        if (lives <= 0) {
            explosions.push(new Explosion(engine.getScene(), explosionPos));
            player.mesh.visible = false;
            isGameOverSequence = true;
        } else {
            player.mesh.position.set(0, 0.9, 20);
            environment.reset();
            explosions.push(new Explosion(engine.getScene(), explosionPos));
            player.mesh.visible = false;
        }
    }

    // Update projectiles and check collisions
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        if (!projectile) continue;
        projectile.update(delta);

        // Collision detection
        const projectileBox = new THREE.Box3().setFromObject(projectile.mesh);
        const ships = environment.getShips();
        const helicopters = environment.getHelicopters();
        
        let collided = false;
        
        // Check ships
        for (let j = ships.length - 1; j >= 0; j--) {
            const ship = ships[j];
            if (!ship) continue;
            const shipBox = new THREE.Box3().setFromObject(ship);
            
            if (!ship.userData.isSinking && projectileBox.intersectsBox(shipBox)) {
                projectile.destroy();
                projectiles.splice(i, 1);
                environment.removeShip(ship);
                updateScore(100);
                collided = true;
                break;
            }
        }
        
        // Check helicopters if not already collided
        if (!collided) {
            for (let j = helicopters.length - 1; j >= 0; j--) {
                const heli = helicopters[j];
                if (!heli) continue;
                const heliBox = new THREE.Box3().setFromObject(heli);
                
                if (projectileBox.intersectsBox(heliBox)) {
                    projectile.destroy();
                    projectiles.splice(i, 1);
                    environment.removeHelicopter(heli);
                    updateScore(150);
                    collided = true;
                    break;
                }
            }
        }
        
        if (!collided && projectile.mesh.position.z < -45) {
            projectile.destroy();
            projectiles.splice(i, 1);
        }
    }
});
