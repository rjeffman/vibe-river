import * as THREE from 'three';

export class Projectile {
    public mesh: THREE.Mesh;
    private speed = 40;

    constructor(scene: THREE.Scene, position: THREE.Vector3) {
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        scene.add(this.mesh);
    }

    public update(delta: number): void {
        this.mesh.position.z -= this.speed * delta;
    }

    public destroy(): void {
        this.mesh.parent?.remove(this.mesh);
    }
}
