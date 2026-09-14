import * as THREE from 'three';

interface Segment {
    river: THREE.Mesh;
    banks: THREE.Mesh[];
    type: 'dark' | 'light';
    z: number;
}

export class Environment {
    private segments: Segment[] = [];
    private scene: THREE.Scene;
    private riverGeometry: THREE.PlaneGeometry;
    private bankGeometry: THREE.BoxGeometry;
    private riverMaterial: THREE.MeshBasicMaterial;
    private darkBankMaterial: THREE.MeshBasicMaterial;
    private lightBankMaterial: THREE.MeshBasicMaterial;
    private segmentLength: number = 100;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.riverGeometry = new THREE.PlaneGeometry(20, this.segmentLength);
        this.riverMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        this.bankGeometry = new THREE.BoxGeometry(5, 1, this.segmentLength);
        this.darkBankMaterial = new THREE.MeshBasicMaterial({ color: 0x228b22 });
        this.lightBankMaterial = new THREE.MeshBasicMaterial({ color: 0x4CAF50 }); // Darker light green

        // Start with 4 segments to provide a larger buffer
        this.addSegment('dark', 10);
	for (let i = 0; i < 2; i++) {
           this.addSegment((i % 2 == 0) ? 'light' : 'dark', 10 + -100*(i+1));
        }
    }

    private addSegment(type: 'dark' | 'light', z: number): void {
        const bankMaterial = type === 'dark' ? this.darkBankMaterial : this.lightBankMaterial;
        
        const river = new THREE.Mesh(this.riverGeometry, this.riverMaterial);
        river.rotation.x = -Math.PI / 2;
        river.position.z = z;
        this.scene.add(river);

        const leftBank = new THREE.Mesh(this.bankGeometry, bankMaterial);
        leftBank.position.set(-12.5, 0, z);
        this.scene.add(leftBank);

        const rightBank = new THREE.Mesh(this.bankGeometry, bankMaterial);
        rightBank.position.set(12.5, 0, z);
        this.scene.add(rightBank);

        this.segments.push({
            river,
            banks: [leftBank, rightBank],
            type,
            z
        });
    }

    public update(delta: number, speed: number, playerZ: number): void {
        // Move all segments
        for (let i = 0; i < this.segments.length; i++) {
            let segment = this.segments[i];
	    const new_z = segment.river.position.z + speed * delta;
            segment.river.position.z = new_z;
	    if (new_z > (30 + this.segmentLength)) {
                // console.log("Remove THIS");
                this.recycleSegment();
            }
            segment.z = segment.river.position.z;
            for (const bank of segment.banks) {
                bank.position.z += speed * delta;
            }
        }
    }

    private recycleSegment(): void {
        const segmentToRecycle = this.segments[0];
        
        // Remove meshes from scene
        this.scene.remove(segmentToRecycle.river);
        for (const bank of segmentToRecycle.banks) {
            this.scene.remove(bank);
        }

        // Remove from array
        this.segments.splice(0, 1);

        // Add new segment
        const last = this.segments[this.segments.length - 1]
        this.addSegment(last.type == 'dark' ? 'light' : 'dark', last.z - this.segmentLength);
    }

}
