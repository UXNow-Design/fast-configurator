// Three.js Setup
let scene, camera, renderer, controls, labelRenderer;
let cabinetSystem, room;
let currentMaterial = 'white';
let currentHandle = 'modern';
let currentFeet = 'standard';
let modules = [];
let dimensionLabels = [];

// Raumgrößen
let roomWidth = 4;
let roomDepth = 4;
let roomHeight = 2.4;

// Zubehör
let accessories = {
    led: false,
    softClose: false,
    glassShelf: false,
    innerDrawer: false
};

// Preise
const PRICES = {
    modules: {
        'hanging': 299,
        'base': 399,
        'tall': 599
    },
    materials: {
        'white': 0,
        'oak': 200,
        'walnut': 300,
        'black': 0,
        'gray': 100,
        'birch': 150,
        'concrete': 250,
        'glass': 400
    },
    handles: {
        'modern': 0,
        'classic': 50,
        'minimal': 30,
        'touch': 100
    },
    feet: {
        'standard': 0,
        'metal': 40,
        'wood': 30,
        'none': 0
    },
    accessories: {
        'led': 49,
        'softClose': 29,
        'glassShelf': 39,
        'innerDrawer': 79
    }
};

// Standard-Modulgrößen
const MODULE_DIMENSIONS = {
    'hanging': {
        width: 0.6,  // 60cm
        height: 0.4, // 40cm
        depth: 0.38  // 38cm
    },
    'base': {
        width: 0.6,  // 60cm
        height: 0.6, // 60cm
        depth: 0.38  // 38cm
    },
    'tall': {
        width: 0.6,   // 60cm
        height: 2.0,  // 200cm
        depth: 0.38   // 38cm
    }
};

// Initialisierung der 3D-Szene
function init() {
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    // Camera Setup
    const container = document.getElementById('preview');
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    camera.position.set(3, 2, 3);

    // Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Label Renderer Setup
    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    // Controls Setup
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 1, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, 5, -5);
    scene.add(backLight);

    // Raum erstellen
    createRoom();

    // Animation Loop
    animate();
}

// Raum erstellen
function createRoom() {
    if (room) {
        scene.remove(room);
    }

    room = new THREE.Group();

    // Boden
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xf0f0f0,
        shininess: 0
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    room.add(floor);

    // Wände
    const wallMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        shininess: 0
    });

    // Rückwand
    const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, roomHeight/2, -roomDepth/2);
    backWall.receiveShadow = true;
    room.add(backWall);

    // Seitenwand links
    const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-roomWidth/2, roomHeight/2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    room.add(leftWall);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(Math.max(roomWidth, roomDepth), Math.max(roomWidth, roomDepth), 0xdddddd, 0xdddddd);
    room.add(gridHelper);

    scene.add(room);

    // Kamera anpassen
    camera.position.set(roomWidth, roomHeight/2, roomDepth);
    controls.target.set(0, roomHeight/2, 0);
    controls.update();
}

// Schrankmodul erstellen
function createCabinetModule(type, width, height, depth) {
    const material = getMaterial(currentMaterial);
    const module = new THREE.Group();

    // Basis-Schrank (Korpus)
    const cabinetGeometry = new THREE.BoxGeometry(width, height, depth);
    const cabinet = new THREE.Mesh(cabinetGeometry, material);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    module.add(cabinet);

    // Füße hinzufügen für Unterschrank und Hochschrank
    if ((type === 'base' || type === 'tall') && currentFeet !== 'none') {
        const feetHeight = 0.1; // 10cm
        const feetCount = 4;
        const feetSpacing = 0.1; // 10cm vom Rand
        
        for (let i = 0; i < feetCount; i++) {
            const foot = createFoot(currentFeet);
            const x = ((i % 2) * 2 - 1) * (width/2 - feetSpacing);
            const z = (Math.floor(i/2) * 2 - 1) * (depth/2 - feetSpacing);
            foot.position.set(x, -height/2, z);
            module.add(foot);
        }
    }

    // Türen und Schubladen
    switch(type) {
        case 'hanging':
            // Eine große Tür für den Hängeschrank
            const doorGeometry = new THREE.BoxGeometry(width - 0.02, height - 0.02, 0.02);
            const doorMaterial = material.clone();
            const door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(0, 0, depth/2 + 0.01);
            door.castShadow = true;
            module.add(door);
            
            // Griff
            addHandle(door, currentHandle, 0);

            // LED-Beleuchtung
            if (accessories.led) {
                addLighting(module, width, height, depth);
            }
            break;

        case 'base':
            // Eine Schublade für den Unterschrank
            const drawerGeometry = new THREE.BoxGeometry(width - 0.02, height - 0.12, 0.02);
            const drawerMaterial = material.clone();
            const drawer = new THREE.Mesh(drawerGeometry, drawerMaterial);
            drawer.position.set(0, 0, depth/2 + 0.01);
            drawer.castShadow = true;
            module.add(drawer);

            // Schubladengriff
            addHandle(drawer, currentHandle, 0);

            // Innenschubladen
            if (accessories.innerDrawer) {
                addInnerDrawers(module, width, height, depth);
            }
            break;

        case 'tall':
            // Eine große Tür für den Hochschrank
            const tallDoorGeometry = new THREE.BoxGeometry(width - 0.02, height - 0.12, 0.02);
            const tallDoorMaterial = material.clone();
            const tallDoor = new THREE.Mesh(tallDoorGeometry, tallDoorMaterial);
            tallDoor.position.set(0, 0, depth/2 + 0.01);
            tallDoor.castShadow = true;
            module.add(tallDoor);

            // Griff
            addHandle(tallDoor, currentHandle, 0);

            // Glasböden
            if (accessories.glassShelf) {
                addGlassShelves(module, width, height, depth);
            }

            // LED-Beleuchtung
            if (accessories.led) {
                addLighting(module, width, height, depth);
            }
            break;
    }

    // Maßlinien hinzufügen
    addDimensionLabels(module, width, height, depth);

    return module;
}

// Fuß erstellen
function createFoot(type) {
    let geometry, material;
    
    switch(type) {
        case 'standard':
            geometry = new THREE.BoxGeometry(0.04, 0.1, 0.04);
            material = new THREE.MeshPhongMaterial({ 
                color: 0xcccccc,
                shininess: 30
            });
            break;
        case 'metal':
            geometry = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
            material = new THREE.MeshPhongMaterial({ 
                color: 0x888888,
                shininess: 100
            });
            break;
        case 'wood':
            geometry = new THREE.BoxGeometry(0.05, 0.1, 0.05);
            material = new THREE.MeshPhongMaterial({ 
                color: 0xb0845f,
                shininess: 20
            });
            break;
        default:
            geometry = new THREE.BoxGeometry(0.04, 0.1, 0.04);
            material = new THREE.MeshPhongMaterial({ 
                color: 0xcccccc,
                shininess: 30
            });
    }
    
    return new THREE.Mesh(geometry, material);
}

// LED-Beleuchtung hinzufügen
function addLighting(module, width, height, depth) {
    const ledGeometry = new THREE.BoxGeometry(width - 0.1, 0.01, 0.02);
    const ledMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.5
    });
    
    const topLed = new THREE.Mesh(ledGeometry, ledMaterial);
    topLed.position.set(0, height/2 - 0.02, depth/2);
    module.add(topLed);
}

// Glasböden hinzufügen
function addGlassShelves(module, width, height, depth) {
    const shelfGeometry = new THREE.BoxGeometry(width - 0.1, 0.01, depth - 0.1);
    const shelfMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        shininess: 100
    });
    
    const shelfCount = 4;
    const spacing = height / (shelfCount + 1);
    
    for (let i = 1; i <= shelfCount; i++) {
        const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.y = -height/2 + spacing * i;
        module.add(shelf);
    }
}

// Innenschubladen hinzufügen
function addInnerDrawers(module, width, height, depth) {
    const drawerGeometry = new THREE.BoxGeometry(width - 0.15, height/4 - 0.05, depth - 0.15);
    const drawerMaterial = new THREE.MeshPhongMaterial({
        color: 0xeeeeee
    });
    
    const drawer = new THREE.Mesh(drawerGeometry, drawerMaterial);
    drawer.position.set(0, -height/4, 0);
    module.add(drawer);
}

// Maßlinien hinzufügen
function addDimensionLabels(module, width, height, depth) {
    // Entferne alte Labels
    dimensionLabels.forEach(label => {
        if (label.parent) label.parent.remove(label);
    });
    dimensionLabels = [];

    // HTML Labels für die Maße
    const widthLabel = document.createElement('div');
    widthLabel.className = 'dimension-label';
    widthLabel.textContent = `${(width * 100).toFixed(0)} cm`;
    
    const heightLabel = document.createElement('div');
    heightLabel.className = 'dimension-label';
    heightLabel.textContent = `${(height * 100).toFixed(0)} cm`;
    
    const depthLabel = document.createElement('div');
    depthLabel.className = 'dimension-label';
    depthLabel.textContent = `${(depth * 100).toFixed(0)} cm`;

    // Position der Labels
    const widthLabelObject = new THREE.CSS2DObject(widthLabel);
    widthLabelObject.position.set(0, -height/2 - 0.1, depth/2);
    module.add(widthLabelObject);

    const heightLabelObject = new THREE.CSS2DObject(heightLabel);
    heightLabelObject.position.set(-width/2 - 0.1, 0, depth/2);
    module.add(heightLabelObject);

    const depthLabelObject = new THREE.CSS2DObject(depthLabel);
    depthLabelObject.position.set(-width/2, -height/2, 0);
    module.add(depthLabelObject);

    dimensionLabels.push(widthLabelObject, heightLabelObject, depthLabelObject);
}

// Material erstellen
function getMaterial(type) {
    switch(type) {
        case 'white':
            return new THREE.MeshPhongMaterial({ 
                color: 0xffffff,
                shininess: 30
            });
        case 'oak':
            return new THREE.MeshPhongMaterial({ 
                color: 0xb0845f,
                shininess: 20
            });
        case 'walnut':
            return new THREE.MeshPhongMaterial({ 
                color: 0x5c4033,
                shininess: 20
            });
        case 'black':
            return new THREE.MeshPhongMaterial({ 
                color: 0x333333,
                shininess: 30
            });
        case 'gray':
            return new THREE.MeshPhongMaterial({ 
                color: 0x4a4a4a,
                shininess: 30
            });
        case 'birch':
            return new THREE.MeshPhongMaterial({ 
                color: 0xd4bc94,
                shininess: 20
            });
        case 'concrete':
            return new THREE.MeshPhongMaterial({ 
                color: 0x888888,
                shininess: 0
            });
        case 'glass':
            return new THREE.MeshPhongMaterial({
                color: 0xffffff,
                shininess: 100,
                transparent: true,
                opacity: 0.3
            });
        default:
            return new THREE.MeshPhongMaterial({ 
                color: 0xffffff,
                shininess: 30
            });
    }
}

// Griff hinzufügen
function addHandle(parent, type, offset = 0) {
    const handleMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        shininess: 30
    });
    
    // Einfacher, moderner Griff wie in den Bildern
    const handleWidth = 0.15;
    const handleHeight = 0.02;
    const handleDepth = 0.02;
    
    const handleGeometry = new THREE.BoxGeometry(handleWidth, handleHeight, handleDepth);
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(offset, 0, 0.02);
    parent.add(handle);
}

// Gesamtpreis berechnen
function calculateTotalPrice() {
    let total = 0;
    
    // Module
    modules.forEach(module => {
        total += PRICES.modules[module.type];
    });
    
    // Material
    total += PRICES.materials[currentMaterial];
    
    // Griffe
    total += PRICES.handles[currentHandle];
    
    // Füße
    if (currentFeet !== 'none') {
        total += PRICES.feet[currentFeet];
    }
    
    // Zubehör
    if (accessories.led) total += PRICES.accessories.led;
    if (accessories.softClose) total += PRICES.accessories.softClose;
    if (accessories.glassShelf) total += PRICES.accessories.glassShelf;
    if (accessories.innerDrawer) total += PRICES.accessories.innerDrawer;
    
    document.getElementById('totalPrice').textContent = total.toFixed(2);
}

// Schranksystem aktualisieren
function updateCabinetSystem() {
    if (cabinetSystem) {
        scene.remove(cabinetSystem);
    }

    cabinetSystem = new THREE.Group();
    let currentY = 0;

    modules.forEach(module => {
        const dimensions = MODULE_DIMENSIONS[module.type];
        const cabinetModule = createCabinetModule(
            module.type,
            dimensions.width,
            dimensions.height,
            dimensions.depth
        );
        
        // Position berechnen
        cabinetModule.position.y = currentY + dimensions.height/2;
        
        // Bei Hängeschränken: Position nach oben verschieben
        if (module.type === 'hanging') {
            cabinetModule.position.y = roomHeight - dimensions.height/2 - 0.4; // 40cm von der Decke
        } else {
            currentY += dimensions.height;
        }

        cabinetSystem.add(cabinetModule);
    });

    scene.add(cabinetSystem);
    calculateTotalPrice();
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    init();

    // Farbe ändern
    document.querySelectorAll('.color-swatch').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            currentMaterial = button.dataset.color;
            updateCabinetSystem();
        });
    });

    // Griffe ändern
    document.querySelectorAll('[data-handle]').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-handle]').forEach(b => b.classList.remove('border-[#0058a3]'));
            button.classList.add('border-[#0058a3]');
            currentHandle = button.dataset.handle;
            updateCabinetSystem();
        });
    });

    // Füße ändern
    document.querySelectorAll('[data-feet]').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-feet]').forEach(b => b.classList.remove('border-[#0058a3]'));
            button.classList.add('border-[#0058a3]');
            currentFeet = button.dataset.feet;
            updateCabinetSystem();
        });
    });

    // Zubehör ändern
    const accessoryMap = {
        'led': 'led',
        'softClose': 'softClose',
        'glassShelf': 'glassShelf',
        'innerDrawer': 'innerDrawer'
    };

    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
        checkbox.addEventListener('change', () => {
            const accessoryKey = Object.keys(accessoryMap)[index];
            accessories[accessoryMap[accessoryKey]] = checkbox.checked;
            updateCabinetSystem();
        });
    });

    // Module hinzufügen
    document.querySelectorAll('.module-card').forEach(card => {
        card.addEventListener('click', () => {
            const moduleType = card.dataset.type;
            modules.push({ type: moduleType });
            updateCabinetSystem();
        });
    });

    // Maße ändern
    ['width', 'height', 'depth'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateCabinetSystem);
        }
    });

    // Raumgröße Modal
    const modal = document.getElementById('roomSizeModal');
    const roomSizeBtn = document.getElementById('roomSizeBtn');
    const cancelBtn = document.getElementById('cancelRoomSize');
    const applyBtn = document.getElementById('applyRoomSize');

    if (roomSizeBtn) {
        roomSizeBtn.addEventListener('click', () => {
            modal.classList.add('active');
            document.getElementById('roomWidth').value = roomWidth;
            document.getElementById('roomDepth').value = roomDepth;
            document.getElementById('roomHeight').value = roomHeight;
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            roomWidth = parseFloat(document.getElementById('roomWidth').value);
            roomDepth = parseFloat(document.getElementById('roomDepth').value);
            roomHeight = parseFloat(document.getElementById('roomHeight').value);
            createRoom();
            modal.classList.remove('active');
        });
    }

    // Responsive Design
    window.addEventListener('resize', () => {
        const container = document.getElementById('preview');
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
        labelRenderer.setSize(width, height);
    });
}); 