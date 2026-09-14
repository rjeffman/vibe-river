import * as THREE from 'three';

interface Segment {
    river: THREE.Mesh;
    banks: THREE.Mesh[];
    ships: THREE.Mesh[];
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
        this.addSegment('dark', 10, false);
        for (let i = 0; i < 2; i++) {
            this.addSegment((i % 2 == 0) ? 'light' : 'dark', 10 + -100*(i+1), false);
        }
    }

    private addSegment(type: 'dark' | 'light', z: number, enemies: bool): void {
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

        // Add ships
        const ships: THREE.Mesh[] = [];
        const numShips = enemies ? 1 + Math.floor(Math.random() * 4) : 0; // 1 - 4 ships
        const shipGeometry = new THREE.BoxGeometry(1.5, 0.6, 3);
        const shipMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 }); // Orange ships
        const minZDistance = 1.5; // Ship width in Z plane after 90deg Y rotation
        let shipZ = 0;
        for (let i = 0; i < numShips; i++) {
            // Random z within the segment: [z - 50, z + 50]
            shipZ += minZDistance + (Math.random() * 0.8 * this.segmentLength);
            if (shipZ < this.segmentLength) { 
                const ship = new THREE.Mesh(shipGeometry, shipMaterial);
                ship.position.set(
                    (Math.random() - 0.5) * 15, // Random X between -7.5 and 7.5
                    0.3, // Slightly above river
                    z + shipZ
                );
                ship.rotation.y = Math.PI / 2;
                this.scene.add(ship);
                ships.push(ship);
            } else {
                break;
            }
        }

        this.segments.push({
            river,
            banks: [leftBank, rightBank],
            ships,
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
                this.recycleSegment();
            }
            segment.z = segment.river.position.z;
            for (const bank of segment.banks) {
                bank.position.z += speed * delta;
            }
            for (const ship of segment.ships) {
                ship.position.z += speed * delta;
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
        for (const ship of segmentToRecycle.ships) {
            this.scene.remove(ship);
        }

        // Remove from array
        this.segments.splice(0, 1);

        // Add new segment
        const last = this.segments[this.segments.length - 1]
        this.addSegment(last.type == 'dark' ? 'light' : 'dark', last.z - this.segmentLength, true);
    }
}

