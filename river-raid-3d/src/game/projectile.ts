import * as THREE from 'three';

export class Projectile {
    public mesh: THREE.Mesh;
    private speed = 40;
    private startZ: number;

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.startZ = position.z;
        scene.add(this.mesh);
    }

    public update(delta: number): void {
        this.mesh.position.z -= this.speed * delta;
        
        const deltaZ = this.startZ - this.mesh.position.z;
        if (deltaZ <= 2) {
            // Linear interpolation from plane height (0.7) down to 0.4 over 2 units of Z
            const startY = 0.7;
            const endY = 0.4;
            const targetDZ = 2;
            this.mesh.position.y = startY + (endY - startY) * (deltaZ / targetDZ);
        } else {
            this.mesh.position.y = 0.4;
        }
    }

    public destroy(): void {
        this.mesh.parent?.remove(this.mesh);
    }
}
