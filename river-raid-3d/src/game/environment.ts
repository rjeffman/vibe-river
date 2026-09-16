import * as THREE from 'three';

interface Segment {
    river: THREE.Mesh;
    banks: THREE.Mesh[];
    ships: THREE.Mesh[];
    helicopters: THREE.Object3D[];
    type: 'dark' | 'light';
    z: number;
}

export class Environment {
    private segments: Segment[] = [];
    private scene: THREE.Scene;
    private riverGeometry: THREE.PlaneGeometry;
    private bankGeometry: THREE.BoxGeometry;
    private riverMaterial: THREE.ShaderMaterial;
    private darkBankMaterial: THREE.ShaderMaterial;
    private lightBankMaterial: THREE.ShaderMaterial;
    private segmentLength: number = 100;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.riverGeometry = new THREE.PlaneGeometry(20, this.segmentLength);
        
        this.riverMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
            side: THREE.DoubleSide,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision mediump float;

                uniform float uTime;
                varying vec2 vUv;

                float ribbon(float base, float uStart, float phase) {
                    float u = vUv.x + uStart;
                    float lowFrequency = 0.01 * sin(u * 12.0 - uTime * 0.8 + phase);
                    float highFrequency = 0.003 * sin(u * 58.0 + uTime * 2.8 + phase * 1.7);
                    float center = base + lowFrequency + highFrequency;
                    float ribbonShape = exp(-pow((vUv.y - center) / 0.004, 2.0));
                    float segmentPattern = 0.5 + 0.5 * sin(u * 20.0 + uTime * 0.35 + phase * 2.0);
                    float segments = smoothstep(0.12, 0.78, segmentPattern);
                    return ribbonShape * segments;
                }

                void main() {
                    vec2 uv = vUv;

                    // Several very thin, independently phased wavy ribbons.
                    float wave = ribbon(0.08, 0.00, 0.0)
                        + ribbon(0.20, 0.13, 1.0)
                        + ribbon(0.32, 0.26, 2.1)
                        + ribbon(0.44, 0.39, 3.0)
                        + ribbon(0.56, 0.52, 4.0)
                        + ribbon(0.68, 0.65, 4.8)
                        + ribbon(0.80, 0.78, 5.7)
                        + ribbon(0.92, 0.91, 6.5);

                    float caustic = wave;

                    vec3 baseColor = vec3(0.0, 0.18, 0.5);
                    vec3 causticColor = vec3(0.25, 0.9, 1.0);
                    
                    vec3 finalColor = mix(baseColor, causticColor, clamp(caustic, 0.0, 1.0));
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `

        });

        this.bankGeometry = new THREE.BoxGeometry(5, 1, this.segmentLength);
        const bankVertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const bankFragmentShader = `
            precision mediump float;
            uniform float uTime;
            uniform vec3 uColor;
            varying vec2 vUv;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                           mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
            }

            void main() {
                vec2 uv = vUv;
                float n = noise(uv * 8.0 + vec2(uTime * 0.2, uTime * 0.1));
                vec3 color = uColor * (0.8 + 0.2 * n);
                float blades = step(0.8, fract(uv.x * 40.0 + n * 2.0));
                color += blades * 0.05;
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        this.darkBankMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x228b22) }
            },
            vertexShader: bankVertexShader,
            fragmentShader: bankFragmentShader
        });
        this.lightBankMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x228b22) }
            },
            vertexShader: bankVertexShader,
            fragmentShader: bankFragmentShader
        });
        
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
        const helicopters: THREE.Object3D[] = [];
        const numEnemies = enemies ? 1 + Math.floor(Math.random() * 4) : 0;
        
        const shipGeometry = new THREE.BoxGeometry(1.4, 1.5, 3);
        const shipMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
        
        const heliGeometry = new THREE.CapsuleGeometry(0.4, 1.4, 4, 8);
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
                    const heli = new THREE.Group();
                    heli.position.set(
                        (Math.random() - 0.5) * 15,
                        0.6,
                        z + enemyZ
                    );
                    heli.userData.targetX = heli.position.x > 0 ? -9.5 : 9.5;
                    heli.userData.isTurning = false;
                    heli.userData.turnProgress = 0;
                    heli.userData.startRotationY = 0;

                    const body = new THREE.Mesh(heliGeometry, heliMaterial);
                    body.rotation.z = Math.PI / 2;
                    heli.add(body);

                    // Add spinning white cross above and near the front
                    const crossGroup = new THREE.Group();
                    crossGroup.name = 'cross';

                    const crossSize = 2.0;
                    const crossThickness = 0.1;
                    const crossMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

                    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(crossSize, crossThickness, crossThickness), crossMaterial);
                    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(crossThickness, crossThickness, crossSize), crossMaterial);

                    crossGroup.add(bar1);
                    crossGroup.add(bar2);

                    // Position above (y)
                    crossGroup.position.set((heli.userData.targetX > 0 ? 1 : -1) * 0.6, 0.4, 0);
                    heli.add(crossGroup);

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

    public update(delta: number, speed: number, playerZ: number, elapsedTime: number): void {
        // Update river material time
        if (this.riverMaterial.uniforms && this.riverMaterial.uniforms['uTime']) {
            this.riverMaterial.uniforms['uTime'].value = elapsedTime;
        }

        // Update bank materials time
        [this.darkBankMaterial, this.lightBankMaterial].forEach(mat => {
            if (mat.uniforms && mat.uniforms['uTime']) {
                mat.uniforms['uTime'].value = elapsedTime;
            }
        });

        // Move all segments
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            if (!segment) continue;
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
                if (!heli) continue;
                heli.position.z += speed * delta;

                const cross = heli.getObjectByName('cross');
                if (cross) {
                    cross.rotation.y += delta * 10;
                }

                if (heli.position.z < 45) {
                    const targetX = heli.userData.targetX;
                    const speedX = 15;
                    if (Math.abs(heli.position.x - targetX) < 0.5) {
                        heli.userData.targetX = targetX > 0 ? -9 : 9;
                        heli.userData.isTurning = true;
                        heli.userData.turnProgress = 0;
                        heli.userData.startRotationY = heli.rotation.y;
                    } else if (!heli.userData.isTurning) {
                        heli.position.x += (targetX > heli.position.x ? 1 : -1) * speedX * delta;
                    }
                }

                if (heli.userData.isTurning) {
                    heli.userData.turnProgress += delta / 0.5;
                    if (heli.userData.turnProgress >= 1) {
                        heli.userData.turnProgress = 1;
                        heli.userData.isTurning = false;
                    }
                    heli.rotation.y = heli.userData.startRotationY + (heli.userData.turnProgress * Math.PI);
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

    public getHelicopters(): THREE.Object3D[] {
        const allHelicopters: THREE.Object3D[] = [];
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

    public removeHelicopter(heli: THREE.Object3D): void {
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
        if (!segmentToRecycle) return;
        
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
        const last = this.segments[this.segments.length - 1];
        if (last) {
            this.addSegment(last.type == 'dark' ? 'light' : 'dark', last.z - this.segmentLength, true);
        }
    }
}
