import * as THREE from 'three';

interface Segment {
    river: THREE.Mesh;
    banks: THREE.Mesh[];
    ships: THREE.Mesh[];
    helicopters: THREE.Mesh[];
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

    private addSegment(type: 'dark' | 'light', z: number, enemies: boolean): void {
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

        const ships: THREE.Mesh[] = [];
        const helicopters: THREE.Mesh[] = [];
        const numEnemies = enemies ? 1 + Math.floor(Math.random() * 4) : 0;
        
        const shipGeometry = new THREE.BoxGeometry(1.5, 0.9, 3);
        const shipMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
        
        const heliGeometry = new THREE.BoxGeometry(1.2, 0.6, 1.8);
        const heliMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        const minZDistance = 1.5;
        let enemyZ = 0;
        for (let i = 0; i < numEnemies; i++) {
            enemyZ += minZDistance + (Math.random() * 0.8 * this.segmentLength);
            if (enemyZ < this.segmentLength) {
                if (Math.random() < 0.5) {
                    const ship = new THREE.Mesh(shipGeometry, shipMaterial);
                    ship.position.set(
                        (Math.random() - 0.5) * 15,
                        0.3,
                        z + enemyZ
                    );
                    ship.rotation.y = Math.PI / 2;
                    this.scene.add(ship);
                    ships.push(ship);
                } else {
                    const heli = new THREE.Mesh(heliGeometry, heliMaterial);
                    heli.position.set(
                        (Math.random() - 0.5) * 15,
                        0.6,
                        z + enemyZ
                    );
                    heli.rotation.y = Math.PI / 2;
                    heli.userData.targetX = heli.position.x > 0 ? -10 : 10;
                    this.scene.add(heli);
                    helicopters.push(heli);
                }
            } else {
                break;
            }
        }

        this.segments.push({
            river,
            banks: [leftBank, rightBank],
            ships,
            helicopters,
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
            for (let j = segment.helicopters.length - 1; j >= 0; j--) {
                const heli = segment.helicopters[j];
                heli.position.z += speed * delta;
               
		/*
                if (heli.position.z > 45) {
                    this.removeHelicopter(heli);
                    continue;
                }
		*/

                if (heli.position.z < 45) {
                    const targetX = heli.userData.targetX;
                    const speedX = 15;
                    if (Math.abs(heli.position.x - targetX) < 0.5) {
                        heli.userData.targetX = targetX > 0 ? -9 : 9;
                    } else {
                        heli.position.x += (targetX > heli.position.x ? 1 : -1) * speedX * delta;
                    }
                }
            }
        }
    }

    public getShips(): THREE.Mesh[] {
        const allShips: THREE.Mesh[] = [];
        for (const segment of this.segments) {
            allShips.push(...segment.ships);
        }
        return allShips;
    }

    public getHelicopters(): THREE.Mesh[] {
        const allHelicopters: THREE.Mesh[] = [];
        for (const segment of this.segments) {
            allHelicopters.push(...segment.helicopters);
        }
        return allHelicopters;
    }

    public removeShip(ship: THREE.Mesh): void {
        for (const segment of this.segments) {
            const index = segment.ships.indexOf(ship);
            if (index !== -1) {
                segment.ships.splice(index, 1);
                this.scene.remove(ship);
                return;
            }
        }
    }

    public removeHelicopter(heli: THREE.Mesh): void {
        for (const segment of this.segments) {
            const index = segment.helicopters.indexOf(heli);
            if (index !== -1) {
                segment.helicopters.splice(index, 1);
                this.scene.remove(heli);
                return;
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
        for (const heli of segmentToRecycle.helicopters) {
            this.scene.remove(heli);
        }

        // Remove from array
        this.segments.splice(0, 1);

        // Add new segment
        const last = this.segments[this.segments.length - 1]
        this.addSegment(last.type == 'dark' ? 'light' : 'dark', last.z - this.segmentLength, true);
    }
}
