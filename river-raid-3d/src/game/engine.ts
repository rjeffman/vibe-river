import * as THREE from 'three';

export class GameEngine {
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private renderer: THREE.WebGLRenderer;
    private clock: THREE.Clock;
    private d: number = 15;

    constructor(container: HTMLElement) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);

        this.camera = this.createCamera();

        // this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(10, 20, 10);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x202020));

        window.addEventListener('resize', () => this.onWindowResize());
    }

    private createCamera(): THREE.OrthographicCamera {
        const aspect = window.innerWidth / window.innerHeight;
        const camera = new THREE.OrthographicCamera(
            -this.d * aspect,
            this.d * aspect,
            this.d,
            -this.d,
            1,
            1000
        );
        // Positioned on the right, looking towards the origin (leftward view)
        camera.position.set(20, 20, 20);
        camera.lookAt(0, 0, 0);
        return camera;
    }

    private onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = -this.d * aspect;
        this.camera.right = this.d * aspect;
        this.camera.top = this.d;
        this.camera.bottom = -this.d;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getClock(): THREE.Clock {
        return this.clock;
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    public startLoop(updateCallback: (delta: number) => void): void {
        const loop = () => {
            const delta = this.clock.getDelta();
            updateCallback(delta);
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}
