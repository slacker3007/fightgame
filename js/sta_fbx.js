/**
 * Renders STA class character from FBX into the 2D canvas (replaces player_STA.png when ready).
 */
(function initStaFbx() {
    const FBX_URL = 'assets/player_STA_Breathing_Idle.fbx';
    const RENDER_SIZE = 512;

    window.staFbxModelReady = false;
    window.staFbxLoadFailed = false;

    window.staFbxDraw = function () {
        return false;
    };

    function settleLoad() {
        if (typeof window.finishStaFbxLoad === 'function') window.finishStaFbxLoad();
    }

    (async () => {
        let THREE;
        let FBXLoader;
        try {
            THREE = await import('three');
            const m = await import('three/addons/loaders/FBXLoader.js');
            FBXLoader = m.FBXLoader;
        } catch (e) {
            console.error('STA FBX: failed to load Three.js', e);
            window.staFbxLoadFailed = true;
            settleLoad();
            return;
        }

        let renderer;
        let scene;
        let camera;
        let mixer = null;
        let modelRoot = null;
        let lastT = performance.now();

        function setup() {
            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(RENDER_SIZE, RENDER_SIZE);
            renderer.setPixelRatio(1);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.setClearColor(0x000000, 0);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.25;

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(34, 1, 0.02, 200);

            scene.add(new THREE.AmbientLight(0xc8d4e8, 0.42));

            const hemi = new THREE.HemisphereLight(0xffffff, 0x7a8498, 1.08);
            scene.add(hemi);

            const key = new THREE.DirectionalLight(0xffffff, 1.35);
            key.position.set(8, 12, 6);
            scene.add(key);

            const fill = new THREE.DirectionalLight(0xd8e8ff, 0.55);
            fill.position.set(-9, 6, 5);
            scene.add(fill);

            const rim = new THREE.DirectionalLight(0xfff5eb, 1.15);
            rim.position.set(-4, 7, -10);
            scene.add(rim);
        }

        async function setupEnvironmentMap() {
            try {
                const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
                const { PMREMGenerator } = await import('three/addons/utils/PMREMGenerator.js');
                const pmrem = new PMREMGenerator(renderer);
                const envScene = new RoomEnvironment();
                scene.environment = pmrem.fromScene(envScene, 0.04).texture;
                pmrem.dispose();
                if (typeof envScene.dispose === 'function') envScene.dispose();
            } catch (e) {
                console.warn('STA FBX: environment map skipped', e);
            }
        }

        const MODEL_SCALE = 1.18;
        /** Flip horizontally (left ↔ right). Parent-group mirror works better than negative mesh scale on skinned FBX. */
        const MIRROR_HORIZONTAL = true;

        function fitCamera() {
            if (!modelRoot) return;
            const box = new THREE.Box3().setFromObject(modelRoot);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z, 0.001);
            const dist = maxDim * 2.45;
            // Negative X = camera on the other side (left shoulder vs right shoulder).
            camera.position.set(-dist * 0.20, maxDim * 0.78, dist * 0.62);
            camera.lookAt(0, maxDim * 0.44, 0);
            camera.near = Math.max(0.01, dist / 200);
            camera.far = dist * 25;
            camera.updateProjectionMatrix();
        }

        setup();
        await setupEnvironmentMap();

        new FBXLoader().load(
            FBX_URL,
            (object) => {
                object.scale.setScalar(MODEL_SCALE);

                let root = object;
                if (MIRROR_HORIZONTAL) {
                    const wrap = new THREE.Group();
                    wrap.scale.x = -1;
                    wrap.add(object);
                    root = wrap;
                }

                const box = new THREE.Box3().setFromObject(root);
                const center = box.getCenter(new THREE.Vector3());
                root.position.sub(center);

                modelRoot = root;
                scene.add(root);
                if (object.animations && object.animations.length) {
                    mixer = new THREE.AnimationMixer(object);
                    for (const clip of object.animations) {
                        mixer.clipAction(clip).play();
                    }
                }
                window.staFbxModelReady = true;
                fitCamera();
                settleLoad();
            },
            undefined,
            (err) => {
                console.error('STA FBX:', err);
                window.staFbxLoadFailed = true;
                settleLoad();
            }
        );

        window.staFbxDraw = function (ctx, x, y, w, h) {
            if (!window.staFbxModelReady || !renderer) return false;
            const now = performance.now();
            const dt = Math.min(0.08, (now - lastT) / 1000);
            lastT = now;
            if (mixer) mixer.update(dt);
            renderer.render(scene, camera);
            try {
                ctx.drawImage(renderer.domElement, x, y, w, h);
            } catch (e) {
                return false;
            }
            return true;
        };
    })();
})();
