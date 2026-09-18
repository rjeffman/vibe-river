import * as THREE from 'three';

export class Explosion {
    private debris: { mesh: THREE.Mesh; velocity: THREE.Vector3; rotationVelocity: THREE.Vector3 }[] = [];
    private timer: number = 0;
    private readonly duration: number = 5;

    constructor(private scene: THREE.Scene, position: THREE.Vector3) {
        const numDebris = 7;
        const debrisGeometry = new THREE.BoxGeometry(0.8, 0.35, 0.25);
        const debrisMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500 });

        for (let i = 0; i < numDebris; i++) {
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            debris.position.copy(position);
            this.scene.add(debris);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                Math.random() * 15,
                (Math.random() - 0.5) * 15
            );

            const rotationVelocity = new THREE.Vector3(
                Math.random() * 10,
                Math.random() * 10,
                Math.random() * 10
            );

            this.debris.push({ mesh: debris, velocity, rotationVelocity });
        }
    }

    public update(delta: number): boolean {
        this.timer += delta;

        for (let i = this.debris.length - 1; i >= 0; i--) {
            const item = this.debris[i];
            item.mesh.position.add(item.velocity.clone().multiplyScalar(delta));
            item.mesh.rotation.x += item.rotationVelocity.x * delta;
            item.mesh.rotation.y += item.rotationVelocity.y * delta;
            item.mesh.rotation.z += item.rotationVelocity.z * delta;

            // Gravity effect
            item.velocity.y -= 9.8 * delta;

            if (item.mesh.position.y <= 0) {
                this.scene.remove(item.mesh);
                this.debris.splice(i, 1);
            }
        }

        if (this.timer >= this.duration || this.debris.length === 0) {
            this.cleanup();
            return true; // Finished
        }

        return false;
    }

    private cleanup(): void {
        for (const item of this.debris) {
            this.scene.remove(item.mesh);
        }
        this.debris = [];
    }
}
