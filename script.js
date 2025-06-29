// Three.js Setup
let scene, camera, renderer, controls, labelRenderer;
let cabinetSystem, room;
let currentMaterial = 'white';
let currentHandle = 'modern';
let currentFeet = 'standard';
let modules = [];
let dimensionLabels = [];

// History for Undo/Redo functionality  
let configHistory = [];
let currentHistoryIndex = -1;

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

// --- START: Responsive Bottom Sheet Logic ---
let isSettingsPanelOpen = false;
const settingsPanel = document.getElementById('settingsPanel');
const settingsToggleBtn = document.getElementById('settingsToggleBtnFab');
const settingsHandle = document.getElementById('settingsHandle'); // Handle zum Greifen

function toggleSettingsPanel(forceOpen = null) {
    const shouldOpen = forceOpen !== null ? forceOpen : !isSettingsPanelOpen;
    if (shouldOpen) {
        settingsPanel.classList.remove('max-h-0', 'translate-y-full');
        settingsPanel.classList.add('max-h-[60vh]'); // Höhe beim Öffnen
        isSettingsPanelOpen = true;
    } else {
        settingsPanel.classList.add('max-h-0'); // Höhe beim Schließen
        settingsPanel.classList.remove('max-h-[60vh]');
        // Wait for transition before adding translate-y-full to avoid jump
        setTimeout(() => {
             if (!isSettingsPanelOpen) { // Check again in case it was reopened quickly
                 settingsPanel.classList.add('translate-y-full');
             }
        }, 300); // Match transition duration
        isSettingsPanelOpen = false;
    }
}

if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener('click', () => toggleSettingsPanel());
}

// Optional: Close sheet with handle click/drag (simple toggle for now)
if (settingsHandle) {
    settingsHandle.addEventListener('click', () => toggleSettingsPanel(false));
}
// --- END: Responsive Bottom Sheet Logic ---

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
    let handleGeometry, handleMaterial;
    
    switch(type) {
        case 'modern':
            // Langer, schlanker Griff
            handleGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.02);
            handleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xcccccc,
                shininess: 100
            });
            break;
            
        case 'classic':
            // Runder Knopf
            handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16);
            handleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xb8860b, // Gold
                shininess: 80
            });
            break;
            
        case 'minimal':
            // Dünne Linie
            handleGeometry = new THREE.BoxGeometry(0.12, 0.005, 0.015);
            handleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x333333,
                shininess: 50
            });
            break;
            
        case 'touch':
            // Kein sichtbarer Griff - nur eine dezente Mulde
            handleGeometry = new THREE.BoxGeometry(0.08, 0.03, 0.005);
            handleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xf0f0f0,
                shininess: 10
            });
            break;
            
        default:
            handleGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.02);
            handleMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xcccccc,
                shininess: 100
            });
    }
    
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    
    // Position anpassen je nach Typ
    if (type === 'classic') {
        handle.rotation.z = Math.PI / 2; // Knopf horizontal ausrichten
        handle.position.set(offset + 0.2, 0, 0.025);
    } else if (type === 'touch') {
        handle.position.set(offset, 0, 0.005); // Mulde weniger hervortretend
    } else {
        handle.position.set(offset, 0, 0.02);
    }
    
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
    return total;
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

// --- START: Mobile Controls Bar Logic ---
const mobileControlsBar = document.getElementById('mobileControlsBar');
const mobileOptionsContainer = document.getElementById('mobileOptionsContainer');
const desktopSettingsContent = document.getElementById('desktopSettingsContent');
const mobileTabs = document.querySelectorAll('.mobile-tab');
const mobileControlHandle = document.getElementById('mobileControlHandle'); 
const mobileTabsContainer = document.getElementById('mobileTabsContainer');
const previewContainer = document.getElementById('preview').parentElement; 
const headerElement = document.querySelector('header'); // Get header element

function setupMobileControls() {
    if (!mobileControlsBar || !desktopSettingsContent || !mobileControlHandle || !mobileTabsContainer || !previewContainer || !headerElement) return;

    // Store original desktop elements for cloning
    const originalSettingElements = {};
    desktopSettingsContent.querySelectorAll('[data-setting]').forEach(el => {
        originalSettingElements[el.dataset.setting] = el.innerHTML; // Store inner HTML
    });

    // Function to show options for a category
    function showMobileOptions(category) {
        mobileOptionsContainer.innerHTML = ''; // Clear previous options
        
        if (category === 'room') {
             openRoomSizeModal(); 
             return;
        }

        if (originalSettingElements[category]) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = originalSettingElements[category];
            const controlsElement = tempDiv.querySelector('.module-selection-grid, .material-selection-grid, .handle-selection-grid, .feet-selection-grid, .accessory-selection-list');
            
            if (controlsElement) {
                mobileOptionsContainer.appendChild(controlsElement.cloneNode(true));
                attachMobileOptionListeners(mobileOptionsContainer);
            }
        } else {
            mobileOptionsContainer.innerHTML = '<p class="text-gray-500 text-sm">Optionen nicht verfügbar.</p>';
        }
    }

    mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            mobileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.dataset.controls;
            showMobileOptions(category);
        });
    });

    showMobileOptions('modules');
    
    // --- START: Drag to Resize Logic ---
    let isDragging = false;
    let startY, initialHeight, headerHeight;
    const minHeight = 80; 
    
    function getFixedElementsHeight() {
        let handleHeight = mobileControlHandle ? mobileControlHandle.offsetHeight : 0;
        let tabsHeight = mobileTabsContainer ? mobileTabsContainer.offsetHeight : 0;
        // Add a small buffer for padding/margins if needed
        return handleHeight + tabsHeight + 8; // e.g., 8px buffer
    }

    function onDragStart(e) {
        isDragging = true;
        startY = e.clientY || e.touches[0].clientY;
        initialHeight = mobileControlsBar.offsetHeight;
        headerHeight = headerElement.offsetHeight; // Get header height on drag start
        
        mobileControlsBar.classList.add('!duration-0'); 
        previewContainer.classList.add('!duration-0'); // Also disable transition for preview container height
        mobileOptionsContainer.classList.add('!duration-0');
        document.body.style.userSelect = 'none'; 
        document.body.style.cursor = 'grabbing';
        
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
    }

    function onDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        const currentY = e.clientY || e.touches[0].clientY;
        const deltaY = startY - currentY;
        let newHeight = initialHeight + deltaY;
        const maxHeight = window.innerHeight * 0.75; 

        newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

        mobileControlsBar.style.height = `${newHeight}px`;
        
        // Calculate and set preview container height explicitly
        const previewHeight = window.innerHeight - headerHeight - newHeight;
        previewContainer.style.height = `${Math.max(0, previewHeight)}px`; // Ensure non-negative
        
        const fixedElementsHeight = getFixedElementsHeight();
        const optionsHeight = newHeight - fixedElementsHeight;
        if (mobileOptionsContainer) {
            mobileOptionsContainer.style.height = `${Math.max(0, optionsHeight)}px`;
        }
        
        onWindowResize(); // Update 3D viewport
    }

    function onDragEnd() {
        if (!isDragging) return; 
        isDragging = false;
        mobileControlsBar.classList.remove('!duration-0'); 
        previewContainer.classList.remove('!duration-0'); // Re-enable transition for preview container
        mobileOptionsContainer.classList.remove('!duration-0');
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragEnd);
        window.removeEventListener('touchmove', onDragMove);
        window.removeEventListener('touchend', onDragEnd);
    }

    if (mobileControlHandle) {
        mobileControlHandle.addEventListener('mousedown', onDragStart);
        mobileControlHandle.addEventListener('touchstart', onDragStart, { passive: true });
    }
    // --- END: Drag to Resize Logic ---
    
    // Set initial heights after elements are rendered
    requestAnimationFrame(() => { 
        const initialBarHeight = mobileControlsBar.offsetHeight;
        const initialHeaderHeight = headerElement.offsetHeight;
        // Set initial preview height
        const initialPreviewHeight = window.innerHeight - initialHeaderHeight - initialBarHeight;
        previewContainer.style.height = `${Math.max(0, initialPreviewHeight)}px`;
        
        // Set initial options container height
        const initialFixedElementsHeight = getFixedElementsHeight();
        if (mobileOptionsContainer) { 
             mobileOptionsContainer.style.height = `${Math.max(0, initialBarHeight - initialFixedElementsHeight)}px`;
        }
        // Trigger initial resize for Three.js
        onWindowResize(); 
    });
}

// Function to re-attach listeners to dynamically added mobile options
function attachMobileOptionListeners(container) {
    // Color Swatches
    container.querySelectorAll('.color-swatch').forEach(button => {
        // Prevent duplicate listeners if cloning preserves them
        if (button.dataset.listenerAttached) return;
        button.dataset.listenerAttached = true;
        button.addEventListener('click', handleColorSelection);
    });
    // Module Cards
    container.querySelectorAll('.module-card').forEach(card => {
         if (card.dataset.listenerAttached) return;
         card.dataset.listenerAttached = true;
        card.addEventListener('click', handleModuleSelection);
    });
     // Handles
    container.querySelectorAll('[data-handle]').forEach(button => {
        if (button.dataset.listenerAttached) return;
        button.dataset.listenerAttached = true;
        button.addEventListener('click', handleHandleSelection);
    });
    // Feet
    container.querySelectorAll('[data-feet]').forEach(button => {
        if (button.dataset.listenerAttached) return;
        button.dataset.listenerAttached = true;
        button.addEventListener('click', handleFeetSelection);
    });
    // Accessories
    container.querySelectorAll('.accessory-selection-list input[type="checkbox"]').forEach((checkbox) => {
         if (checkbox.dataset.listenerAttached) return;
         checkbox.dataset.listenerAttached = true;
        checkbox.addEventListener('change', handleAccessorySelection);
    });
}

// --- END: Mobile Controls Bar Logic ---

// --- START: Event Handlers for Options (used by both Desktop and Mobile) ---
function handleColorSelection(event) {
    const button = event.currentTarget;
    // Update active state for the specific container (desktop or mobile)
    const container = button.closest('.material-selection-grid');
    container.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    currentMaterial = button.dataset.color;
    updateCabinetSystem();
    updateCheckoutSummary();
    saveState(); // Save state for undo/redo
}

function handleModuleSelection(event) {
    const card = event.currentTarget;
    const moduleType = card.dataset.type;
    modules.push({ type: moduleType });
    updateCabinetSystem();
    updateCheckoutSummary();
    saveState(); // Save state for undo/redo
}

function handleHandleSelection(event) {
    const button = event.currentTarget;
    const container = button.closest('.handle-selection-grid');
    // Remove active class from all handle buttons in this container
    container.querySelectorAll('[data-handle]').forEach(b => {
        b.classList.remove('border-[#0058a3]', 'bg-blue-50');
    });
    // Add active class to clicked button
    button.classList.add('border-[#0058a3]', 'bg-blue-50');
    currentHandle = button.dataset.handle;
    updateCabinetSystem();
    updateCheckoutSummary();
    saveState(); // Save state for undo/redo
}

function handleFeetSelection(event) {
    const button = event.currentTarget;
    const container = button.closest('.feet-selection-grid');
    // Remove active class from all feet buttons in this container
    container.querySelectorAll('[data-feet]').forEach(b => {
        b.classList.remove('border-[#0058a3]', 'bg-blue-50');
    });
    // Add active class to clicked button
    button.classList.add('border-[#0058a3]', 'bg-blue-50');
    currentFeet = button.dataset.feet;
    updateCabinetSystem();
    updateCheckoutSummary();
    saveState(); // Save state for undo/redo
}

const accessoryMap = {
    'led': 'led',
    'softClose': 'softClose',
    'glassShelf': 'glassShelf',
    'innerDrawer': 'innerDrawer'
};

function handleAccessorySelection(event) {
    const checkbox = event.currentTarget;
    const accessoryKey = checkbox.name;
    if (accessoryMap[accessoryKey]) {
        accessories[accessoryMap[accessoryKey]] = checkbox.checked;
        updateCabinetSystem();
        updateCheckoutSummary();
        saveState(); // Save state for undo/redo
    }
}

// Add checkout summary function
function updateCheckoutSummary() {
    updateTotalPrice();
    
    // Update checkout details if checkout modal is open
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal && checkoutModal.classList.contains('active')) {
        populateCheckoutDetails();
    }
}

function updateTotalPrice() {
    const total = calculateTotalPrice();
    const totalPriceElement = document.getElementById('totalPrice');
    if (totalPriceElement) {
        totalPriceElement.textContent = total;
    }
}

function populateCheckoutDetails() {
    const checkoutContent = document.getElementById('checkoutContent');
    if (!checkoutContent) return;
    
    let html = '<div class="space-y-4">';
    
    // Module list
    if (modules.length > 0) {
        html += '<div><h4 class="font-semibold text-gray-800 mb-2">Module:</h4>';
        modules.forEach((module, index) => {
            const price = PRICES.modules[module.type];
            const name = module.type === 'hanging' ? 'Hängeschrank' : 
                        module.type === 'base' ? 'Unterschrank' : 'Hochschrank';
            html += `<div class="flex justify-between items-center py-1">
                        <span>${name}</span>
                        <span>€ ${price}</span>
                     </div>`;
        });
        html += '</div>';
    }
    
    // Material
    if (currentMaterial && currentMaterial !== 'white') {
        const materialName = getMaterialName(currentMaterial);
        const price = PRICES.materials[currentMaterial];
        html += `<div><h4 class="font-semibold text-gray-800 mb-2">Material:</h4>
                 <div class="flex justify-between items-center py-1">
                    <span>${materialName}</span>
                    <span>€ ${price}</span>
                 </div></div>`;
    }
    
    // Handles
    if (currentHandle && currentHandle !== 'modern') {
        const handleName = getHandleName(currentHandle);
        const price = PRICES.handles[currentHandle];
        html += `<div><h4 class="font-semibold text-gray-800 mb-2">Griffe:</h4>
                 <div class="flex justify-between items-center py-1">
                    <span>${handleName}</span>
                    <span>€ ${price}</span>
                 </div></div>`;
    }
    
    // Feet
    if (currentFeet && currentFeet !== 'standard') {
        const feetName = getFeetName(currentFeet);
        const price = PRICES.feet[currentFeet];
        html += `<div><h4 class="font-semibold text-gray-800 mb-2">Füße:</h4>
                 <div class="flex justify-between items-center py-1">
                    <span>${feetName}</span>
                    <span>€ ${price}</span>
                 </div></div>`;
    }
    
    // Accessories
    const selectedAccessories = Object.keys(accessories).filter(key => accessories[key]);
    if (selectedAccessories.length > 0) {
        html += '<div><h4 class="font-semibold text-gray-800 mb-2">Zubehör:</h4>';
        selectedAccessories.forEach(accessory => {
            const name = getAccessoryName(accessory);
            const price = PRICES.accessories[accessory];
            html += `<div class="flex justify-between items-center py-1">
                        <span>${name}</span>
                        <span>€ ${price}</span>
                     </div>`;
        });
        html += '</div>';
    }
    
    // Total
    const total = calculateTotalPrice();
    html += `<div class="border-t pt-4 mt-4">
                <div class="flex justify-between items-center font-bold text-lg">
                    <span>Gesamtpreis:</span>
                    <span>€ ${total}</span>
                </div>
             </div>`;
    
    html += '</div>';
    checkoutContent.innerHTML = html;
}

// Helper functions for names
function getMaterialName(material) {
    const names = {
        'oak': 'Eiche',
        'walnut': 'Nussbaum', 
        'black': 'Schwarz',
        'gray': 'Grau',
        'birch': 'Birke',
        'concrete': 'Beton',
        'glass': 'Glas'
    };
    return names[material] || material;
}

function getHandleName(handle) {
    const names = {
        'classic': 'Klassisch',
        'minimal': 'Minimal',
        'touch': 'Touch'
    };
    return names[handle] || handle;
}

function getFeetName(feet) {
    const names = {
        'metal': 'Metall',
        'wood': 'Holz',
        'none': 'Ohne'
    };
    return names[feet] || feet;
}

function getAccessoryName(accessory) {
    const names = {
        'led': 'LED-Beleuchtung',
        'softClose': 'Soft-Close',
        'glassShelf': 'Glasböden',
        'innerDrawer': 'Innenschubladen'
    };
    return names[accessory] || accessory;
}

function setInitialActiveStates() {
    // Set active state for default white color
    document.querySelectorAll('.color-swatch[data-color="white"]').forEach(swatch => {
        swatch.classList.add('active');
    });
    
    // Set active state for default modern handles
    document.querySelectorAll('[data-handle="modern"]').forEach(handle => {
        handle.classList.add('border-[#0058a3]', 'bg-blue-50');
    });
    
    // Set active state for default standard feet
    document.querySelectorAll('[data-feet="standard"]').forEach(feet => {
        feet.classList.add('border-[#0058a3]', 'bg-blue-50');
    });
}

// History management for Undo/Redo
function saveState() {
    const currentState = {
        modules: [...modules],
        currentMaterial,
        currentHandle,
        currentFeet,
        accessories: {...accessories},
        roomWidth,
        roomDepth,
        roomHeight,
        timestamp: Date.now()
    };
    
    // Remove any states after current index (when user made changes after undo)
    configHistory = configHistory.slice(0, currentHistoryIndex + 1);
    
    // Add new state
    configHistory.push(currentState);
    currentHistoryIndex = configHistory.length - 1;
    
    // Limit history to 20 states
    if (configHistory.length > 20) {
        configHistory.shift();
        currentHistoryIndex--;
    }
    
    updateUndoRedoButtons();
}

function undo() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        restoreState(configHistory[currentHistoryIndex]);
        updateUndoRedoButtons();
    }
}

function redo() {
    if (currentHistoryIndex < configHistory.length - 1) {
        currentHistoryIndex++;
        restoreState(configHistory[currentHistoryIndex]);
        updateUndoRedoButtons();
    }
}

function restoreState(state) {
    modules = [...state.modules];
    currentMaterial = state.currentMaterial;
    currentHandle = state.currentHandle;
    currentFeet = state.currentFeet;
    accessories = {...state.accessories};
    roomWidth = state.roomWidth;
    roomDepth = state.roomDepth;
    roomHeight = state.roomHeight;
    
    // Update visual states
    setInitialActiveStates();
    updateCabinetSystem();
    updateCheckoutSummary();
    
    // Update room if dimensions changed
    createRoom();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.disabled = currentHistoryIndex <= 0;
        undoBtn.style.opacity = currentHistoryIndex <= 0 ? '0.5' : '1';
    }
    
    if (redoBtn) {
        redoBtn.disabled = currentHistoryIndex >= configHistory.length - 1;
        redoBtn.style.opacity = currentHistoryIndex >= configHistory.length - 1 ? '0.5' : '1';
    }
}

// --- END: Event Handlers for Options ---

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Initialize default selections and price
    setTimeout(() => {
        updateCheckoutSummary();
        // Set initial active states for default selections
        setInitialActiveStates();
    }, 100);

    // --- Setup Desktop Listeners ---
    // Select the desktop container explicitly
    const desktopContainer = document.getElementById('settingsPanelDesktop');
    if (desktopContainer) {
        // Color
        desktopContainer.querySelectorAll('.color-swatch').forEach(button => {
            button.addEventListener('click', handleColorSelection);
        });
        // Modules
         desktopContainer.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', handleModuleSelection);
        });
        // Handles
        desktopContainer.querySelectorAll('[data-handle]').forEach(button => {
            button.addEventListener('click', handleHandleSelection);
        });
        // Feet
        desktopContainer.querySelectorAll('[data-feet]').forEach(button => {
            button.addEventListener('click', handleFeetSelection);
        });
        // Accessories
        // Assuming checkboxes are directly inside the list container found by data-setting
        const accessoryList = desktopContainer.querySelector('[data-setting="accessories"] .accessory-selection-list');
        if (accessoryList) {
            accessoryList.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
                // Assign name based on order if needed for the handler
                const accessoryKey = Object.keys(accessoryMap)[index]; 
                checkbox.name = accessoryKey; // Ensure name is set for the handler
                checkbox.addEventListener('change', handleAccessorySelection);
            });
        }
    }

    // --- Setup Mobile Controls ---
    setupMobileControls();

    // --- START: Raumgröße Modal & Buttons ---
    const roomSizeModal = document.getElementById('roomSizeModal');
    const roomSizeBtn = document.getElementById('roomSizeBtn'); // Mobile Button
    const roomSizeBtnDesktop = document.getElementById('roomSizeBtnDesktop'); // Desktop Button
    const cancelRoomSizeBtn = document.getElementById('cancelRoomSize');
    const applyRoomSizeBtn = document.getElementById('applyRoomSize');
    const roomWidthInput = document.getElementById('roomWidth');
    const roomDepthInput = document.getElementById('roomDepth');
    const roomHeightInput = document.getElementById('roomHeight');

    function openRoomSizeModal() {
        roomWidthInput.value = roomWidth;
        roomDepthInput.value = roomDepth;
        roomHeightInput.value = roomHeight;
        roomSizeModal.classList.add('active');
    }

    function closeRoomSizeModal() {
        roomSizeModal.classList.remove('active');
    }
    
    // Event Listener for BOTH buttons
    if (roomSizeBtn) roomSizeBtn.addEventListener('click', openRoomSizeModal);
    if (roomSizeBtnDesktop) roomSizeBtnDesktop.addEventListener('click', openRoomSizeModal);
    
    if (cancelRoomSizeBtn) cancelRoomSizeBtn.addEventListener('click', closeRoomSizeModal);

    if (applyRoomSizeBtn) {
        applyRoomSizeBtn.addEventListener('click', () => {
            roomWidth = parseFloat(roomWidthInput.value);
            roomDepth = parseFloat(roomDepthInput.value);
            roomHeight = parseFloat(roomHeightInput.value);
            createRoom(); // Raum neu erstellen mit neuen Dimensionen
            closeRoomSizeModal();
        });
    }
    // --- END: Raumgröße Modal & Buttons ---

    // --- START: Checkout Modal & Buttons ---
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutBtnMobile = document.getElementById('checkoutBtnMobile');
    const closeCheckoutBtn = document.getElementById('closeCheckout');
    const cancelCheckoutBtn = document.getElementById('cancelCheckout');
    const submitOrderBtn = document.getElementById('submitOrder');

    function openCheckoutModal() {
        populateCheckoutDetails();
        checkoutModal.classList.add('active');
    }

    function closeCheckoutModal() {
        checkoutModal.classList.remove('active');
    }

    if (checkoutBtn) checkoutBtn.addEventListener('click', goToCheckout);
    if (checkoutBtnMobile) checkoutBtnMobile.addEventListener('click', goToCheckout);
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
    if (cancelCheckoutBtn) cancelCheckoutBtn.addEventListener('click', closeCheckoutModal);
    
    if (submitOrderBtn) {
        submitOrderBtn.addEventListener('click', () => {
            // Here you would normally send the order to your backend
            alert('Vielen Dank für Ihre Bestellung! Wir werden uns bald bei Ihnen melden.');
            closeCheckoutModal();
        });
    }
    
    function goToCheckout() {
        // Prepare order data
        const orderData = {
            modules: modules.map(module => ({
                type: module.type,
                name: module.type === 'hanging' ? 'Hängeschrank' : 
                      module.type === 'base' ? 'Unterschrank' : 'Hochschrank',
                price: PRICES.modules[module.type]
            })),
            material: currentMaterial !== 'white' ? {
                type: currentMaterial,
                name: getMaterialName(currentMaterial),
                price: PRICES.materials[currentMaterial]
            } : null,
            handles: currentHandle !== 'modern' ? {
                type: currentHandle,
                name: getHandleName(currentHandle),
                price: PRICES.handles[currentHandle]
            } : null,
            feet: currentFeet !== 'standard' ? {
                type: currentFeet,
                name: getFeetName(currentFeet),
                price: PRICES.feet[currentFeet]
            } : null,
            accessories: Object.keys(accessories)
                .filter(key => accessories[key])
                .map(key => ({
                    type: key,
                    name: getAccessoryName(key),
                    price: PRICES.accessories[key]
                }))
        };
        
        // Save to localStorage
        localStorage.setItem('configuratorOrder', JSON.stringify(orderData));
        
        // Redirect to checkout page
        window.location.href = 'checkout.html';
    }

    // Close modal when clicking outside
    if (checkoutModal) {
        checkoutModal.addEventListener('click', (e) => {
            if (e.target === checkoutModal) {
                closeCheckoutModal();
            }
        });
    }
    // --- END: Checkout Modal & Buttons ---

    // --- START: Undo/Redo Event Listeners ---
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);
    
    // Keyboard shortcuts for Undo/Redo
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) { // Ctrl on Windows/Linux, Cmd on Mac
            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
                e.preventDefault(); 
                redo();
            }
        }
    });
    
    // Save initial state
    setTimeout(() => {
        saveState();
    }, 500);
    // --- END: Undo/Redo Event Listeners ---

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

// Fenstergröße anpassen
window.addEventListener('resize', () => onWindowResize(), false);

function onWindowResize() {
    const container = document.getElementById('preview');
    // Check if container is visible and has dimensions
    if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
        console.warn("Preview container not ready or not visible for resize.");
        return; 
    }
    
    const width = container.clientWidth;
    const height = container.clientHeight;

    // console.log(`Resizing to: ${width} x ${height}`); // Uncomment for debugging

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    labelRenderer.setSize(width, height);
} 