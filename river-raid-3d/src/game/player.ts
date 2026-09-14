import * as THREE from 'three';

export class Player {
    public mesh: THREE.Mesh;
    private speed = 10;

    constructor(scene: THREE.Scene) {
        const bodyGeometry = new THREE.BoxGeometry(1, 0.4, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        const wingGeometry = new THREE.BoxGeometry(3, 0.1, 0.8);
        const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        this.mesh.add(wings);

        this.mesh.position.x = 0;
        this.mesh.position.y = 0.9;
        this.mesh.position.z = 20;
        scene.add(this.mesh);
    }

    public update(delta: number, keys: Set<string>): void {
        // Banking effect
        let targetRotationZ = 0;
        if (keys.has('ArrowLeft')) targetRotationZ = 0.3;
        if (keys.has('ArrowRight')) targetRotationZ = -0.3;
        
        this.mesh.rotation.z += (targetRotationZ - this.mesh.rotation.z) * 5 * delta;

        // X axis (Left/Right)
        if (keys.has('ArrowLeft')) {
            this.mesh.position.x -= this.speed * delta;
        }
        if (keys.has('ArrowRight')) {
            this.mesh.position.x += this.speed * delta;
        }

        // Z axis (Up/Down in the river - Forward/Backward)
        if (keys.has('ArrowUp')) {
            this.mesh.position.z -= this.speed * delta;
        }
        if (keys.has('ArrowDown')) {
            this.mesh.position.z += 1.2 * this.speed * delta;
        }
        
        // Clamp X (River width is 20, so -10 to 10)
        this.mesh.position.x = Math.max(-8.5, Math.min(8.5, this.mesh.position.x));

        // Clamp Z (River bounds based on environment.ts)
        this.mesh.position.z = Math.max(-25, Math.min(25, this.mesh.position.z));
    }
}
