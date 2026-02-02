// ============================================
// FUTURISTIC US ARMY EZ-IO TRAINING SIMULATOR
// Task 081-68W-0237
// ============================================

// ===== TASK METADATA (display-only) =====
// Keep these in sync with the task you are simulating.
const TASK_NAME = "Place an Intraosseous Device";
const TASK_NUMBER = "081-68W-0237";

// ===== CONFIGURATION =====
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    HUMERAL_CENTER: { x: 0.48, y: 0.50 },
    DRIVER_TIP_OFFSET: { x: 0.94, y: 0.10 },
    SYRINGE_TIP_OFFSET: { x: 0.08, y: 0.52 },
    HIT_TOLERANCE: 40,
    ANGLE_TOLERANCE: 15,
    FEEDBACK_DURATION: 2000,
    TRANSITION_DURATION: 800,

    // Step 1 (BSI) hit target radius (pixels)
    PPE_HIT_RADIUS: 90,

    // Extension set connection points (normalized coordinates on the image).
    // The included extension_set.png is treated as a vertical object:
    // - hubEnd (WHITE/clear end) goes OVER the IO hub (bottom).
    // - portEnd (BLUE port) is where the syringe tip connects (top).
    EXT_HUB_END: { x: 0.50, y: 0.88 },
    EXT_PORT_END: { x: 0.50, y: 0.12 },

    // Step 4 (stylet disposal) scaling + placement
    STEP4_STYLET_SCALE: 0.34,
    STEP4_SHARPS_SCALE: 0.34,
};

// ===== STATE MANAGEMENT =====
const state = {
    currentScreen: 'intro',
    currentStep: 1,
    totalSteps: 10,
    errors: 0,
    startTime: null,
    stepsCompleted: new Set(),
    
    // Item states
    bsiDonned: { gloves: false, eyePro: false },
    driverInserted: false,
    extensionAttached: false,
    syringeAttached: false,
    flushed: false,
    dressingApplied: false,
    sharpsDisposed: false,
    styletDisposed: false,
    documented: false,
    siteChecked: false,
    
    // Scene and items
    // Scenes: 'bsi' (Step 1), 'humeral-site' (Steps 2+)
    currentScene: 'bsi',
    placedItems: [],
    permanentItems: [], // Items that stay visible
    
    // Drag state
    draggedItem: null,
    
    // Test state
    questionBank: [],
    currentTest: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    testScore: 0,
    incorrectSteps: new Set(),
    
    // Remedial state
    remedialCompleted: false,
    
    // Debug
    debugMode: false,
    showHotspots: false,
    showNeedleTip: false,
};

const IS_COARSE_POINTER = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;


// Scale tolerance on phones/tablets to make drops less frustrating
function tol(px) {
return IS_COARSE_POINTER ? Math.round(px * 1.8) : px;
}


function getCanvasPointFromEvent(e) {
const rect = canvas.getBoundingClientRect();
// Pointer events always provide clientX/clientY
return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
// ===== STEP DEFINITIONS =====
const STEPS = {
    1: {
        title: "Step 1: Don BSI Equipment",
        instruction: "Drag gloves onto the hands and eye protection onto the face. BSI is required before patient contact.",
        scene: "bsi",
        requiredTools: ["gloves", "eye_pro"],
        validate: () => state.bsiDonned.gloves && state.bsiDonned.eyePro,
        remedialGuidance: {
            title: "Body Substance Isolation (BSI) Precautions",
            description: "BSI is the FIRST step before any patient contact. All body fluids must be considered potentially infectious.",
            hints: [
                "Gloves protect your hands from blood and bodily fluids",
                "Eye protection prevents splash exposure to mucous membranes",
                "ALWAYS don BSI before approaching the casualty",
                "Minimum standard: gloves + eye protection (goggles or face shield)"
            ]
        }
    },
    2: {
        title: "Step 2: Clean Insertion Site",
        instruction: "Drag the alcohol prep pad to the humeral insertion site. Use aseptic technique.",
        scene: "humeral-site",
        requiredTools: ["alcohol_pad"],
        validate: (data) => data && data.cleanedSite,
        itemPersistence: "remove", // Alcohol pad disappears after use
        remedialGuidance: {
            title: "Aseptic Technique for Site Preparation",
            description: "Proper site cleaning prevents infection at the insertion site.",
            hints: [
                "Clean in a circular motion from center outward",
                "Allow alcohol to dry completely (reduces pain, prevents fire hazard)",
                "Do not touch the cleaned area before insertion",
                "Aseptic technique is critical for preventing infection"
            ]
        }
    },
    3: {
        title: "Step 3: Insert EZ-IO Driver",
        instruction: "Position the EZ-IO driver perpendicular to the bone (90°). Insert until you feel the 'pop' into the medullary space. Use Q/E keys to rotate.",
        scene: "humeral-site",
        requiredTools: ["io_driver"],
        validate: (data) => data && data.driverInserted,
        itemPersistence: "remove", // Driver disappears, hub appears
        remedialGuidance: {
            title: "EZ-IO Driver Insertion Technique",
            description: "Proper angle and positioning are CRITICAL for successful insertion.",
            hints: [
                "Driver MUST be perpendicular (90 degrees) to the bone surface",
                "Hold firmly and apply gentle, steady downward pressure",
                "You will feel a distinct 'pop' or 'give' when entering the medullary space",
                "Stop immediately when hub flange touches skin",
                "Use Q/E keys to rotate the driver in the simulation",
                "In real procedure: stabilize the limb with non-dominant hand"
            ]
        }
    },
    4: {
        title: "Step 4: Remove Driver/Stylet & Dispose of Sharps",
        instruction: "The catheter hub remains in place. Drag the stylet into the sharps container. NEVER recap.",
        scene: "humeral-site",
        requiredTools: [],
        validate: () => state.styletDisposed,
        itemPersistence: "keep", // Hub stays
        remedialGuidance: {
            title: "Driver/Stylet Removal and Sharps Safety",
            description: "After insertion, the stylet must be removed and placed directly into a sharps container. Never recap.",
            hints: [
                "Secure the hub gently with your non-dominant hand",
                "Unscrew stylet COUNTERCLOCKWISE from catheter",
                "NEVER attempt to recap the stylet",
                "Place stylet directly into sharps container",
                "Catheter hub remains in place for the rest of the procedure"
            ]
        }
    },

    5: {
        title: "Step 5: Apply Dressing and Wristband",
        instruction: "Secure the catheter with dressing and apply the EZ-IO identification wristband.",
        scene: "humeral-site",
        requiredTools: ["io_dressing"],
        validate: (data) => data && data.dressingApplied,
        itemPersistence: "keep", // Dressing stays on patient
        remedialGuidance: {
            title: "Catheter Securement",
            description: "Proper securement prevents accidental dislodgement.",
            hints: [
                "Apply sterile dressing over insertion site",
                "Secure all tubing to prevent tension on catheter",
                "Apply EZ-IO identification wristband to patient",
                "Wristband alerts other providers to IO access",
                "Document site location and time of placement"
            ]
        }
    },
    6: {
        title: "Step 6: Attach Extension Set",
        instruction: "Attach the extension set to the EZ-IO hub. This prevents direct syringe attachment to the catheter.",
        scene: "humeral-site",
        requiredTools: ["extension_set"],
        validate: (data) => data && data.extensionAttached,
        itemPersistence: "keep", // Extension set stays visible
        remedialGuidance: {
            title: "Extension Set Attachment",
            description: "The extension set is a SAFETY feature - never attach syringe directly to hub.",
            hints: [
                "Connect extension set firmly to the IO hub",
                "This creates a leak-free connection",
                "Extension set allows for easier access and reduces catheter movement",
                "WARNING: Do NOT attach syringe directly to catheter hub",
                "Direct syringe attachment risks catheter dislodgement"
            ]
        }
    },
    7: {
        title: "Step 7: Attach Syringe",
        instruction: "Attach the saline-filled syringe to the extension set.",
        scene: "humeral-site",
        requiredTools: ["syringe"],
        validate: (data) => data && data.syringeAttached,
        itemPersistence: "keep", // Syringe stays for flush step
        remedialGuidance: {
            title: "Syringe Attachment",
            description: "Proper syringe connection enables the flush step.",
            hints: [
                "Ensure syringe contains sterile normal saline (NS)",
                "Attach to extension set, NOT directly to catheter",
                "Check all connections are secure before flushing",
                "Open the clamp on the extension set before flushing"
            ]
        }
    },
    8: {
        title: "Step 8: Flush Catheter",
        instruction: "Open the extension clamp and inject 5-10 mL of saline. Observe for infiltration. Drag the plunger down.",
        scene: "humeral-site",
        requiredTools: ["plunger"],
        validate: (data) => data && data.flushed,
        itemPersistence: "remove", // Flush action then disappears (plunger + syringe removed after flush)
        remedialGuidance: {
            title: "Catheter Flush Technique",
            description: "Flushing confirms proper placement and patency.",
            hints: [
                "Inject 5-10 mL of sterile normal saline",
                "Draw back slightly first - look for marrow/blood mixture",
                "Observe insertion site for signs of infiltration (swelling, blanching)",
                "If infiltration occurs - STOP and reassess placement",
                "Successful flush with no infiltration confirms proper placement",
                "Document any difficulties or complications"
            ]
        }
    },

    9: {
        title: "Step 9: Assess IO Site",
        instruction: "Click the IO site to confirm patency and check for signs of infiltration (swelling, blanching, leaking).",
        scene: "humeral-site",
        requiredTools: [],
        validate: () => state.siteChecked,
        itemPersistence: "keep",
        remedialGuidance: {
            title: "Assessing the IO Site",
            description: "After flushing and securing, assess the insertion site and surrounding tissue for infiltration or leakage.",
            hints: [
                "Visually inspect for swelling, blanching, or leaking",
                "If infiltration is suspected: STOP infusion and reassess placement",
                "Recheck site after movement or patient repositioning",
                "Document any complications or difficulties"
            ]
        }
    },
    10: {
        title: "Step 10: Document Procedure",
        instruction: "Complete the SF 600 (Chronological Record of Medical Care) documenting the IO placement.",
        scene: "humeral-site",
        requiredTools: ["sf600"],
        validate: (data) => data && data.documented,
        itemPersistence: "remove",
        remedialGuidance: {
            title: "Documentation Requirements",
            description: "Accurate documentation is legally required and ensures continuity of care.",
            hints: [
                "Document on SF 600 or DD Form 1380 (TCCC Card)",
                "Include: date, time, site location, catheter size",
                "Note any complications or difficulties",
                "Record flush volume and patient response",
                "Documentation is a legal requirement",
                "Ensures continuity of care during casualty handoff"
            ]
        }
    }
};

// ===== TOOL DEFINITIONS =====
const TOOLS = {
    gloves: { name: "Sterile Gloves", image: "gloves.png", size: { w: 275, h: 183 } },
    eye_pro: { name: "Eye Protection", image: "eye_pro.png", size: { w: 500, h: 500 } },
    alcohol_pad: { name: "Alcohol Prep Pad", image: "alcohol_pad.png", size: { w: 225, h: 225 } },
    io_driver: { name: "EZ-IO Driver", image: "io_driver.png", size: { w: 500, h: 500 } },
    extension_set: { name: "Extension Set", image: "extension_set.png", size: { w: 201, h: 231 } },
    syringe: { name: "Saline Syringe", image: "syringe.png", size: { w: 723, h: 345 } },
    plunger: { name: "Syringe Plunger", image: "plunger.png", size: { w: 334, h: 150 } },
    io_dressing: { name: "IO Dressing", image: "io_dressing.png", size: { w: 500, h: 500 } },
    sharps: { name: "Sharps Container", image: "sharps.png", size: { w: 480, h: 480 } },
    sf600: { name: "SF 600 Form", image: "sf600.png", size: { w: 770, h: 1024 } }
};

// ===== QUESTION BANK (20 questions, 10 randomized for test) =====
const QUESTION_BANK = [
    {
        question: "What is the minimum Body Substance Isolation (BSI) equipment required before performing an IO insertion?",
        options: [
            "Gloves only",
            "Gloves and eye protection",
            "Gloves, gown, and mask",
            "Full hazmat suit"
        ],
        correct: 1,
        relatedStep: 1,
        explanation: "Minimum BSI standard requires gloves AND eye protection to protect against potentially infectious body fluids."
    },
    {
        question: "Why must you use aseptic technique when cleaning the insertion site?",
        options: [
            "To make the site look professional",
            "To prevent infection at the insertion site",
            "To help the driver penetrate easier",
            "It's not actually necessary"
        ],
        correct: 1,
        relatedStep: 2,
        explanation: "Aseptic technique prevents introduction of bacteria that could cause serious bone infection (osteomyelitis)."
    },
    {
        question: "At what angle should the EZ-IO driver be positioned to the bone surface?",
        options: [
            "45 degrees",
            "60 degrees",
            "90 degrees (perpendicular)",
            "Any angle is acceptable"
        ],
        correct: 2,
        relatedStep: 3,
        explanation: "The driver MUST be perpendicular (90°) to the bone surface for proper insertion into the medullary space."
    },
    {
        question: "What indicates successful entry into the medullary space during insertion?",
        options: [
            "Loud cracking sound",
            "Sudden 'pop' or 'give' sensation",
            "Patient screams in pain",
            "Driver starts smoking"
        ],
        correct: 1,
        relatedStep: 3,
        explanation: "A distinct 'pop' or 'give' is felt when the needle enters the medullary cavity. Stop insertion immediately."
    },
    {
        question: "What should you do with the stylet after removing it from the catheter?",
        options: [
            "Recap it carefully and save for later",
            "Place it directly in sharps container without recapping",
            "Set it on the sterile field",
            "Hand it to an assistant"
        ],
        correct: 1,
        relatedStep: 4,
        explanation: "NEVER recap needles. The stylet goes directly into the sharps container to prevent needlestick injury."
    },
    {
        question: "Why is an extension set attached to the IO hub?",
        options: [
            "It looks more professional",
            "To prevent direct syringe attachment to the catheter",
            "To make the procedure take longer",
            "It's optional and not really necessary"
        ],
        correct: 1,
        relatedStep: 6,
        explanation: "Extension set prevents direct syringe attachment which could dislodge the catheter. It's a critical safety feature."
    },
    {
        question: "Can you attach a syringe directly to the EZ-IO catheter hub?",
        options: [
            "Yes, anytime",
            "Yes, but only for blood draws",
            "No, NEVER - always use extension set first",
            "Only if the extension set is not available"
        ],
        correct: 2,
        relatedStep: 6,
        explanation: "WARNING: Do NOT attach syringe directly to catheter hub. This risks catheter dislodgement. Always use extension set."
    },
    {
        question: "What volume of saline should be used to flush the IO catheter?",
        options: [
            "1-2 mL",
            "5-10 mL",
            "20-30 mL",
            "50 mL"
        ],
        correct: 1,
        relatedStep: 8,
        explanation: "Flush with 5-10 mL of sterile normal saline to confirm patency and proper placement."
    },
    {
        question: "What should you observe for during the saline flush?",
        options: [
            "Patient's reaction only",
            "Signs of infiltration (swelling, blanching)",
            "Color of the saline",
            "Nothing - just flush it"
        ],
        correct: 1,
        relatedStep: 8,
        explanation: "Always observe for infiltration (swelling, blanching, or leaking) which indicates improper placement."
    },
    {
        question: "Why is it important to apply dressing and an identification wristband?",
        options: [
            "For cosmetic purposes",
            "To secure catheter and alert other providers to IO access",
            "To hide the insertion site",
            "It's not important"
        ],
        correct: 1,
        relatedStep: 5,
        explanation: "Dressing secures the catheter; wristband alerts other providers to IO access, preventing duplicate attempts."
    },
    {
        question: "What is the correct way to dispose of the IO stylet?",
        options: [
            "Throw in regular trash",
            "Recap and dispose",
            "Place directly in sharps container without recapping",
            "Keep for reuse"
        ],
        correct: 2,
        relatedStep: 4,
        explanation: "All sharps go directly into sharps container without recapping to prevent needlestick injuries."
    },
    {
        question: "Which form is used to document IO placement?",
        options: [
            "DD Form 93",
            "SF 600 or DD Form 1380",
            "DA Form 2062",
            "No documentation needed"
        ],
        correct: 1,
        relatedStep: 10,
        explanation: "Document on SF 600 (Chronological Record of Medical Care) or DD Form 1380 (TCCC Card)."
    },
    {
        question: "The humeral IO site is used in which patient population?",
        options: [
            "Infants only",
            "Children only",
            "Adult patients only",
            "All ages"
        ],
        correct: 2,
        relatedStep: 3,
        explanation: "Proximal humerus site is used in ADULT patients only. Other sites (tibia) for pediatrics."
    },
    {
        question: "What is the purpose of drawing back on the syringe before flushing?",
        options: [
            "To waste time",
            "To look for marrow/blood mixture confirming placement",
            "To remove air bubbles",
            "It's not necessary"
        ],
        correct: 1,
        relatedStep: 8,
        explanation: "Drawing back and seeing marrow cavity fluid mixed with saline confirms proper catheter placement."
    },
    {
        question: "If the insertion site shows swelling during flush, what does this indicate?",
        options: [
            "Normal response",
            "Successful placement",
            "Infiltration - catheter may not be in medullary space",
            "Patient is allergic to saline"
        ],
        correct: 2,
        relatedStep: 8,
        explanation: "Swelling indicates infiltration - saline is leaking into tissue, not the medullary space. Reassess placement."
    },
    {
        question: "Why must the driver be held perpendicular during insertion?",
        options: [
            "For proper entry into medullary space and to prevent catheter malposition",
            "It looks better",
            "To make it hurt less",
            "The angle doesn't matter"
        ],
        correct: 0,
        relatedStep: 3,
        explanation: "Perpendicular angle ensures straight entry into the medullary cavity and proper catheter positioning."
    },
    {
        question: "What should you do if the EZ-IO driver stalls during insertion?",
        options: [
            "Apply more downward pressure",
            "Reduce downward pressure - you may be pressing too hard",
            "Give up and try another site",
            "Turn the driver faster"
        ],
        correct: 1,
        relatedStep: 3,
        explanation: "If driver stalls, reduce downward pressure. Too much pressure can prevent proper drilling action."
    },
    {
        question: "When should BSI equipment be donned?",
        options: [
            "After touching the patient",
            "BEFORE any patient contact",
            "Only if blood is visible",
            "After the procedure"
        ],
        correct: 1,
        relatedStep: 1,
        explanation: "BSI must be donned BEFORE any patient contact. All body fluids are considered potentially infectious."
    },
    {
        question: "What happens to the catheter hub after the stylet is removed?",
        options: [
            "It is removed and discarded",
            "It remains in place for the rest of the procedure",
            "It is replaced with a new hub",
            "It is recapped"
        ],
        correct: 1,
        relatedStep: 4,
        explanation: "The catheter hub remains in place after stylet removal - it's the access point for the rest of the procedure."
    },
    {
        question: "According to TCCC guidelines, IO access is used when:",
        options: [
            "As the first choice for all patients",
            "Only in training scenarios",
            "When traditional IV access is difficult or impossible",
            "Never in tactical settings"
        ],
        correct: 2,
        relatedStep: 1,
        explanation: "IO is used when traditional IV access is difficult/impossible, especially in shock, burns, or combat casualties."
    }
];

// ===== CANVAS & RENDERING =====
let canvas, ctx, particleCanvas, particleCtx;
let images = {};
let imagesLoaded = 0;

function initCanvas() {
    canvas = document.getElementById('scene-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    
    particleCanvas = document.getElementById('particle-canvas');
    if (particleCanvas) {
        particleCtx = particleCanvas.getContext('2d');
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
        initParticles();
    }
}

// Particle system for background
const particles = [];
function initParticles() {
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1
        });
    }
    animateParticles();
}

function animateParticles() {
    if (!particleCtx) return;
    
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particleCtx.fillStyle = 'rgba(212, 175, 55, 0.3)';
    
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0 || p.x > particleCanvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > particleCanvas.height) p.vy *= -1;
        
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        particleCtx.fill();
    });
    
    requestAnimationFrame(animateParticles);
}

function loadImages() {
    const imageList = [
        // Step 1 BSI visuals
        { key: 'hands', src: 'hands.png' },
        { key: 'face', src: 'face.png' },
        // Step 4 stylet (scene-only draggable)
        { key: 'stylet', src: 'stylet.png' },
        { key: 'target_humeral', src: 'target_humeral.png' },
        { key: 'io_hub', src: 'io_hub.png' },
        ...Object.keys(TOOLS).map(key => ({ key, src: TOOLS[key].image }))
    ];
    
    const totalToLoad = imageList.length;
    
    imageList.forEach(item => {
        const img = new Image();
        img.onload = () => {
            images[item.key] = img;
            imagesLoaded++;
            if (imagesLoaded === totalToLoad) {
                console.log('All images loaded');
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load ${item.src}`);
            imagesLoaded++;
        };
        img.src = item.src;
    });
}

function renderScene() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background / scene
    if (state.currentScene === 'bsi') {
        // Step 1 should ONLY show hands + face (no torso/patient front)
        const { handsRect, faceRect } = getPpeLayout();

        if (images.hands) {
            ctx.drawImage(images.hands, handsRect.x, handsRect.y, handsRect.w, handsRect.h);
        }
        if (images.face) {
            ctx.drawImage(images.face, faceRect.x, faceRect.y, faceRect.w, faceRect.h);
        }

        // Hotspots hidden by default; only show when debug hotspots are enabled
        if (state.showHotspots) {
            const { handsCenter, faceCenter } = getPpeTargets();
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#d4af37';
            ctx.beginPath();
            ctx.arc(faceCenter.x, faceCenter.y, CONFIG.PPE_HIT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(handsCenter.x, handsCenter.y, CONFIG.PPE_HIT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    } else if (state.currentScene === 'humeral-site') {
        if (images.target_humeral) {
            const humeralX = canvas.width/2 - 280;
            const humeralY = canvas.height/2 - 222;
            ctx.drawImage(images.target_humeral, humeralX, humeralY, 561, 445);
        }
        
        // Debug hotspots
        if (state.showHotspots) {
            const center = getHumeralCenter();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(center.x, center.y, CONFIG.HIT_TOLERANCE, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Draw permanent items (hub, extension, syringe, dressing)
    // If an item is scoped to a single step (onlyStep), do not render it outside that step.
    state.permanentItems.forEach(item => {
        if (item.onlyStep && item.onlyStep !== state.currentStep) return;
        if (images[item.imageKey]) {
            ctx.drawImage(images[item.imageKey], item.x - item.width/2, item.y - item.height/2, item.width, item.height);
        }
    });
    
    // Draw dragged item
    if (state.draggedItem && images[state.draggedItem.imageKey]) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.translate(state.draggedItem.x, state.draggedItem.y);
        if (state.draggedItem.rotation) {
            ctx.rotate(state.draggedItem.rotation * Math.PI / 180);
        }
        ctx.drawImage(images[state.draggedItem.imageKey], -state.draggedItem.width/2, -state.draggedItem.height/2, state.draggedItem.width, state.draggedItem.height);
        ctx.restore();
        
        // Show needle tip in debug
        if (state.showNeedleTip && state.draggedItem.type === 'io_driver') {
            const tipPos = calculateDriverTipPosition(state.draggedItem);
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(tipPos.x, tipPos.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ===== STEP 1 (BSI) LAYOUT & TARGETS =====
// Hands and face are centered in the work area, with the face above the hands.
function getPpeLayout() {
    const faceW = Math.round(canvas.width * 0.34);
    const faceH = Math.round(faceW * (436 / 550));
    const handsW = Math.round(canvas.width * 0.42);
    const handsH = Math.round(handsW * (408 / 612));

    const gap = Math.round(canvas.height * 0.04);
    const totalH = faceH + gap + handsH;
    const topY = Math.round((canvas.height - totalH) / 2);

    const faceRect = {
        w: faceW,
        h: faceH,
        x: Math.round((canvas.width - faceW) / 2),
        y: topY
    };
    const handsRect = {
        w: handsW,
        h: handsH,
        x: Math.round((canvas.width - handsW) / 2),
        y: topY + faceH + gap
    };

    return { faceRect, handsRect };
}

function getPpeTargets() {
    const { faceRect, handsRect } = getPpeLayout();
    return {
        faceCenter: { x: faceRect.x + faceRect.w / 2, y: faceRect.y + faceRect.h / 2 },
        handsCenter: { x: handsRect.x + handsRect.w / 2, y: handsRect.y + handsRect.h / 2 },
        faceRect,
        handsRect
    };
}

function getHumeralCenter() {
    return {
        x: canvas.width * CONFIG.HUMERAL_CENTER.x,
        y: canvas.height * CONFIG.HUMERAL_CENTER.y
    };
}

// ===== STEP 4 (STYLET DISPOSAL) SCENE SETUP =====
function setupStep4SharpsScene() {
    // Avoid re-adding items every frame
    const already = state.permanentItems.some(it => it.onlyStep === 4 && it.imageKey === 'stylet') ||
                    state.permanentItems.some(it => it.onlyStep === 4 && it.imageKey === 'sharps');
    if (already) return;

    // Clean any old step-4 scoped items
    state.permanentItems = state.permanentItems.filter(it => it.onlyStep !== 4);

    const center = getHumeralCenter();

    // Sharps container placed in the work area (not in the tools list)
    const sharpsW = TOOLS.sharps.size.w * CONFIG.STEP4_SHARPS_SCALE;
    const sharpsH = TOOLS.sharps.size.h * CONFIG.STEP4_SHARPS_SCALE;
    const sharpsX = canvas.width * 0.82;
    const sharpsY = canvas.height * 0.78;

    state.permanentItems.push({
        imageKey: 'sharps',
        x: sharpsX,
        y: sharpsY,
        width: sharpsW,
        height: sharpsH,
        onlyStep: 4
    });

    // Stylet appears over the hub and must be dragged into sharps
    const styletW = 256 * CONFIG.STEP4_STYLET_SCALE;
    const styletH = 283 * CONFIG.STEP4_STYLET_SCALE;
    state.permanentItems.push({
        imageKey: 'stylet',
        x: center.x,
        y: center.y,
        width: styletW,
        height: styletH,
        onlyStep: 4,
        sceneDraggable: true
    });
}

function calculateDriverTipPosition(driverObj) {
    const offsetX = driverObj.width * CONFIG.DRIVER_TIP_OFFSET.x;
    const offsetY = driverObj.height * CONFIG.DRIVER_TIP_OFFSET.y;
    
    const angle = (driverObj.rotation || 0) * Math.PI / 180;
    const rotatedX = offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
    const rotatedY = offsetX * Math.sin(angle) + offsetY * Math.cos(angle);
    
    return {
        x: driverObj.x + rotatedX - driverObj.width/2,
        y: driverObj.y + rotatedY - driverObj.height/2
    };
}

// Normalized point on an item rendered with its center at (item.x,item.y)
// and drawn from (-w/2,-h/2) to (w/2,h/2). Rotation is not applied for
// extension/syringe placement in this simulator.
function pointOnItem(item, norm) {
    return {
        x: item.x + (norm.x - 0.5) * item.width,
        y: item.y + (norm.y - 0.5) * item.height
    };
}

function calculateSyringeTipPosition(syringeObj) {
    // CONFIG.SYRINGE_TIP_OFFSET is normalized to the full image bounds.
    return pointOnItem(syringeObj, CONFIG.SYRINGE_TIP_OFFSET);
}

function distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Remove any permanent items by image key
function removePermanentItemsByKey(imageKey) {
    state.permanentItems = state.permanentItems.filter(it => it.imageKey !== imageKey);
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById(screenId);
    el.classList.remove('hidden');
    state.currentScreen = screenId;

    document.body.classList.toggle('in-training', screenId === 'training-screen');

    // Mobile browsers keep scroll position when swapping screens.
    // Force the view to the top of the newly shown screen.
    requestAnimationFrame(() => {
        // Reset both scrolling roots (iOS uses body sometimes)
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Ensure the screen itself is at the top of the viewport
        el.scrollIntoView({ block: "start", behavior: "auto" });
    });
}

function startTraining() {
    // Hard reset run-specific state so repeat runs don't carry over.
    state.bsiDonned = { gloves: false, eyePro: false };
    state.driverInserted = false;
    state.extensionAttached = false;
    state.syringeAttached = false;
    state.flushed = false;
    state.dressingApplied = false;
    state.sharpsDisposed = false;
    state.documented = false;
    state.siteChecked = false;
    state.permanentItems = [];

    state.startTime = Date.now();
    state.currentStep = 1;
    state.errors = 0;
    state.stepsCompleted.clear();

    // Ensure the Step 1 scene is active
    state.currentScene = STEPS[1].scene;

    showScreen('training-screen');
    const hdr = document.querySelector('header');
    if (hdr) hdr.classList.remove('hidden');
    updateUI();
    renderScene();
    startTimer();
}

// ===== TIMER =====
let timerInterval;
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!state.startTime) return;
        const elapsed = Date.now() - state.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timerEl = document.querySelector('.timer-value');
        if (timerEl) {
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

// ===== UI UPDATES =====
function updateUI() {
    const stepInfo = STEPS[state.currentStep];
    document.getElementById('step-title').textContent = stepInfo.title;
    document.getElementById('step-instruction').textContent = stepInfo.instruction;
    
    // Update step indicator
    document.getElementById('current-step-display').textContent = state.currentStep;
    
    // Update errors
    document.querySelector('.errors-value').textContent = state.errors;
    
    // Update progress
    const progress = (state.stepsCompleted.size / state.totalSteps) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
    document.getElementById('progress-text').textContent = Math.round(progress) + '%';
    
    // Update checklist
    document.querySelectorAll('.checklist-item').forEach((item, index) => {
        const stepNum = index + 1;
        item.classList.remove('current', 'completed');
        
        if (state.stepsCompleted.has(stepNum)) {
            item.classList.add('completed');
            item.querySelector('.status-icon').textContent = '✅';
        } else if (stepNum === state.currentStep) {
            item.classList.add('current');
        }
    });
    
    updateToolsPanel();

    // Step-specific scene setup
    if (state.currentStep === 4) {
        setupStep4SharpsScene();
    }
}

function updateToolsPanel() {
    const container = document.getElementById('tools-container');
    container.innerHTML = '';
    
    const stepInfo = STEPS[state.currentStep];
    if (!stepInfo.requiredTools || stepInfo.requiredTools.length === 0) {
        container.innerHTML = '<p style="color: #a0aec0; text-align: center; padding: 20px;">No tools required for this step</p>';
        return;
    }
    
    stepInfo.requiredTools.forEach(toolKey => {
        const tool = TOOLS[toolKey];
        if (!tool) return;
        
        const toolDiv = document.createElement('div');
        toolDiv.className = 'tool-item';
        toolDiv.dataset.toolKey = toolKey;
        
        const img = document.createElement('img');
        img.src = tool.image;
        img.alt = tool.name;
        
        const name = document.createElement('div');
        name.className = 'tool-name';
        name.textContent = tool.name;
        
        toolDiv.appendChild(img);
        toolDiv.appendChild(name);
        container.appendChild(toolDiv);
        
        toolDiv.addEventListener('pointerdown', startDrag, { passive: false });
    });
}

function showFeedback(message, type = 'info') {
    const feedbackEl = document.getElementById('feedback-message');
    feedbackEl.textContent = message;
    feedbackEl.className = 'feedback-overlay ' + type;
    feedbackEl.classList.remove('hidden');
    
    setTimeout(() => {
        feedbackEl.classList.add('hidden');
    }, CONFIG.FEEDBACK_DURATION);
}

function advanceStep() {
    const currentStepInfo = STEPS[state.currentStep];
    
    state.stepsCompleted.add(state.currentStep);
    
    if (state.currentStep < state.totalSteps) {
        state.currentStep++;
        
        const newStepInfo = STEPS[state.currentStep];
        if (newStepInfo.scene !== state.currentScene) {
            transitionScene(newStepInfo.scene);
        }
        
        if (newStepInfo.autoAdvance) {
            setTimeout(() => advanceStep(), 1500);
        }
        
        updateUI();
        renderScene();
    } else {
        completeSimulation();
    }
}

function transitionScene(newScene) {
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 0.4s';
    
    setTimeout(() => {
        state.currentScene = newScene;
        renderScene();
        canvas.style.opacity = '1';
    }, 400);
}

function completeSimulation() {
    stopTimer();
    const elapsedTime = Date.now() - state.startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    
    document.getElementById('debrief-steps').textContent = `${state.stepsCompleted.size}/${state.totalSteps}`;
    document.getElementById('debrief-errors').textContent = state.errors;
    document.getElementById('debrief-time').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    showScreen('debrief-screen');
}

// ===== DRAG & DROP =====
    function startDrag(e) {
    e.preventDefault();


    const toolDiv = e.currentTarget;
    const toolKey = toolDiv.dataset.toolKey;
    const tool = TOOLS[toolKey];
    if (!tool) return;


    // Capture pointer so drag continues reliably
    toolDiv.setPointerCapture?.(e.pointerId);


    const pt = getCanvasPointFromEvent(e);
    const scaleFactor = 0.3;


    state.draggedItem = {
    type: toolKey,
    imageKey: toolKey,
    x: pt.x,
    y: pt.y,
    width: tool.size.w * scaleFactor,
    height: tool.size.h * scaleFactor,
    rotation: 0
};
    
    canvas.classList.add('dragging');

    document.addEventListener('pointermove', drag, { passive: false });
    document.addEventListener('pointerup', endDrag, { passive: false });
    document.addEventListener('pointercancel', endDrag, { passive: false });

    renderScene();
}

// Start dragging a scene-only item (e.g., Step 4 stylet) by clicking it on the canvas.
    function startSceneDrag(sceneItem, startX, startY, pointerId) {
    if (!sceneItem) return;

    state.draggedItem = {
    type: sceneItem.imageKey,
    imageKey: sceneItem.imageKey,
    x: startX,
    y: startY,
    width: sceneItem.width,
    height: sceneItem.height,
    rotation: 0,
    _fromScene: true,
    _pointerId: pointerId
};

    // Hide the scene item while dragging
    state.permanentItems = state.permanentItems.filter(it => it !== sceneItem);

    canvas.classList.add('dragging');

    document.addEventListener('pointermove', drag, { passive: false });
    document.addEventListener('pointerup', endDrag, { passive: false });
    document.addEventListener('pointercancel', endDrag, { passive: false });

    renderScene();
}

    function drag(e) {
    if (!state.draggedItem) return;
    e.preventDefault();

    const pt = getCanvasPointFromEvent(e);
    state.draggedItem.x = pt.x;
    state.draggedItem.y = pt.y;

    renderScene();
}

    function endDrag(e) {
    if (!state.draggedItem) return;
    e.preventDefault();

    canvas.classList.remove('dragging');

    // Remove pointer listeners (these are the ones you actually add)
    document.removeEventListener('pointermove', drag);
    document.removeEventListener('pointerup', endDrag);
    document.removeEventListener('pointercancel', endDrag);

    // Also remove any legacy mouse listeners (safe no-ops)
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);

    validateDrop(state.draggedItem);

    state.draggedItem = null;
    renderScene();
}

// Keyboard rotation
document.addEventListener('keydown', (e) => {
    if (!state.draggedItem || state.draggedItem.type !== 'io_driver') return;
    
    if (e.key === 'q' || e.key === 'Q') {
        state.draggedItem.rotation = (state.draggedItem.rotation || 0) - 5;
        renderScene();
    } else if (e.key === 'e' || e.key === 'E') {
        state.draggedItem.rotation = (state.draggedItem.rotation || 0) + 5;
        renderScene();
    }
});

// ===== VALIDATION =====
function validateDrop(item) {
    const step = state.currentStep;
    
    switch(step) {
        case 1: validateBSI(item); break;
        case 2: validateCleaning(item); break;
        case 3: validateDriverInsertion(item); break;
        case 4: validateSharpsDisposal(item); break;
        case 5: validateDressing(item); break;
        case 6: validateExtensionSet(item); break;
        case 7: validateSyringe(item); break;
        case 8: validateFlush(item); break;
        case 10: validateDocumentation(item); break;
    }
}

function validateBSI(item) {
    const { handsCenter, faceCenter } = getPpeTargets();

    // Already donned? Ignore additional drops (no error)
    if (item.type === 'gloves' && state.bsiDonned.gloves) return;
    if (item.type === 'eye_pro' && state.bsiDonned.eyePro) return;

    if (item.type === 'gloves') {
        const dist = distance(item, handsCenter);
        if (dist <= CONFIG.PPE_HIT_RADIUS) {
            state.bsiDonned.gloves = true;

            // Snap a visual to the hands target (Step 1 only)
            state.permanentItems.push({
                imageKey: 'gloves',
                x: handsCenter.x,
                y: handsCenter.y,
                width: 170,
                height: 115,
                onlyStep: 1
            });

            showFeedback('✓ Gloves donned', 'success');
            const el = document.querySelector(`[data-tool-key="${item.type}"]`);
            if (el) el.classList.add('used');
        } else {
            showFeedback('Place gloves on the hands', 'error');
            state.errors++;
        }
    } else if (item.type === 'eye_pro') {
        const dist = distance(item, faceCenter);
        if (dist <= CONFIG.PPE_HIT_RADIUS) {
            state.bsiDonned.eyePro = true;

            // Snap a visual to the face target (Step 1 only)
            state.permanentItems.push({
                imageKey: 'eye_pro',
                x: faceCenter.x,
                y: faceCenter.y,
                width: 190,
                height: 190,
                onlyStep: 1
            });

            showFeedback('✓ Eye protection donned', 'success');
            const el = document.querySelector(`[data-tool-key="${item.type}"]`);
            if (el) el.classList.add('used');
        } else {
            showFeedback('Place eye protection on the face', 'error');
            state.errors++;
        }
    } else {
        showFeedback('Use gloves and eye protection for BSI', 'error');
        state.errors++;
    }

    if (state.bsiDonned.gloves && state.bsiDonned.eyePro) {
        setTimeout(() => {
            showFeedback('BSI complete. Advancing to insertion site.', 'success');
            setTimeout(() => advanceStep(), 800);
        }, 400);
    }
}

function validateCleaning(item) {
    if (item.type !== 'alcohol_pad') {
        showFeedback('Use the alcohol prep pad', 'error');
        state.errors++;
        return;
    }
    
    const humeralCenter = getHumeralCenter();
    const dist = distance(item, humeralCenter);
    
    if (dist < CONFIG.HIT_TOLERANCE * 2) {
        showFeedback('✓ Insertion site cleaned with aseptic technique', 'success');
        document.querySelector(`[data-tool-key="${item.type}"]`).classList.add('used');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Position over the humeral insertion site', 'error');
        state.errors++;
    }
}

function validateDriverInsertion(item) {
    if (item.type !== 'io_driver') {
        showFeedback('Use the EZ-IO driver', 'error');
        state.errors++;
        return;
    }
    
    const humeralCenter = getHumeralCenter();
    const tipPos = calculateDriverTipPosition(item);
    const dist = distance(tipPos, humeralCenter);
    
    const angle = Math.abs(item.rotation || 0);
    const angleFromVertical = Math.min(angle, 360 - angle);
    
    if (dist < CONFIG.HIT_TOLERANCE) {
        if (angleFromVertical < CONFIG.ANGLE_TOLERANCE) {
            showFeedback('✓ Driver inserted at 90° - "Pop" felt. Catheter in medullary space.', 'success');
            
            // Add IO hub as permanent item
            state.permanentItems.push({
                imageKey: 'io_hub',
                x: humeralCenter.x,
                y: humeralCenter.y,
                width: 80,
                height: 80
            });
            
            document.querySelector(`[data-tool-key="${item.type}"]`).classList.add('used');
            state.driverInserted = true;
            setTimeout(() => advanceStep(), 1500);
        } else {
            showFeedback(`Driver must be perpendicular (90°). Current angle off by ${angleFromVertical.toFixed(0)}°`, 'error');
            state.errors++;
        }
    } else {
        showFeedback('Position the needle tip over the insertion site. Use Q/E to rotate.', 'error');
        state.errors++;
    }
}

function validateExtensionSet(item) {
    if (item.type !== 'extension_set') {
        showFeedback('Attach the extension set', 'error');
        state.errors++;
        return;
    }
    
    if (!state.driverInserted) {
        showFeedback('Complete driver insertion first', 'error');
        state.errors++;
        return;
    }
    
    const humeralCenter = getHumeralCenter();

    // Require the WHITE/clear end of the extension set to be directly over the IO hub.
    const hubEndPos = pointOnItem(item, CONFIG.EXT_HUB_END);
    const dist = distance(hubEndPos, humeralCenter);

    if (dist < CONFIG.HIT_TOLERANCE) {
        showFeedback('✓ Extension set attached (white end over IO hub)', 'success');
        state.extensionAttached = true;

        // Snap/lock the extension set so its hubEnd aligns with the IO hub.
        const extW = 90;
        const extH = 140;
        const hubDx = (CONFIG.EXT_HUB_END.x - 0.5) * extW;
        const hubDy = (CONFIG.EXT_HUB_END.y - 0.5) * extH;

        state.permanentItems.push({
            imageKey: 'extension_set',
            x: humeralCenter.x - hubDx,
            y: humeralCenter.y - hubDy,
            width: extW,
            height: extH
        });
        
        document.querySelector(`[data-tool-key="${item.type}"]`).classList.add('used');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Place the WHITE end of the extension set directly over the IO hub', 'error');
        state.errors++;
    }
}

function validateSyringe(item) {
    if (item.type !== 'syringe') {
        showFeedback('Attach the saline syringe', 'error');
        state.errors++;
        return;
    }
    
    if (!state.extensionAttached) {
        showFeedback('Attach extension set first', 'error');
        state.errors++;
        return;
    }
    
    // Find the snapped extension set and compute the BLUE port location.
    const ext = state.permanentItems.find(it => it.imageKey === 'extension_set');
    if (!ext) {
        showFeedback('Attach extension set first', 'error');
        state.errors++;
        return;
    }

    const bluePortPos = pointOnItem(ext, CONFIG.EXT_PORT_END);
    const syringeTipPos = calculateSyringeTipPosition(item);
    const dist = distance(syringeTipPos, bluePortPos);

    if (dist < CONFIG.HIT_TOLERANCE) {
        showFeedback('✓ Syringe tip connected to BLUE port', 'success');
        state.syringeAttached = true;

        // Snap/lock syringe so its tip aligns to the BLUE port.
        const syrW = 220;
        const syrH = 105;
        const tipDx = (CONFIG.SYRINGE_TIP_OFFSET.x - 0.5) * syrW;
        const tipDy = (CONFIG.SYRINGE_TIP_OFFSET.y - 0.5) * syrH;

        state.permanentItems.push({
            imageKey: 'syringe',
            x: bluePortPos.x - tipDx,
            y: bluePortPos.y - tipDy,
            width: syrW,
            height: syrH
        });
        
        document.querySelector(`[data-tool-key="${item.type}"]`).classList.add('used');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Connect the syringe tip to the BLUE part of the extension set', 'error');
        state.errors++;
    }
}

function validateFlush(item) {
    if (item.type !== 'plunger') {
        showFeedback('Use the plunger to flush', 'error');
        state.errors++;
        return;
    }
    
    if (!state.syringeAttached) {
        showFeedback('Attach syringe first', 'error');
        state.errors++;
        return;
    }
    
    showFeedback('✓ 5-10mL saline flushed. No signs of infiltration.', 'success');
    state.flushed = true;
    // After flushing, the plunger and syringe are no longer needed in the scene
    removePermanentItemsByKey('syringe');
    state.syringeAttached = false;
    const plEl = document.querySelector(`[data-tool-key="${item.type}"]`);
    if (plEl) {
        plEl.classList.add('used');
        plEl.style.display = 'none';
    }
    setTimeout(() => advanceStep(), 1500);
}

function validateDressing(item) {
    if (item.type !== 'io_dressing') {
        showFeedback('Apply the IO dressing', 'error');
        state.errors++;
        return;
    }
    
    const humeralCenter = getHumeralCenter();
    const dist = distance(item, humeralCenter);
    
    if (dist < CONFIG.HIT_TOLERANCE * 2) {
        showFeedback('✓ Dressing and wristband applied. Catheter secured.', 'success');
        state.dressingApplied = true;

        state.permanentItems.push({
            imageKey: 'io_dressing',
            x: humeralCenter.x,
            y: humeralCenter.y,
            width: 150,
            height: 150
        });
        
        document.querySelector(`[data-tool-key="${item.type}"]`).classList.add('used');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Position dressing over the insertion site', 'error');
        state.errors++;
    }
}

function validateSharpsDisposal(item) {
    // Step 4: Drag the stylet into the sharps container (both are present in the scene)
    if (item.type !== 'stylet') {
        showFeedback('Drag the stylet into the sharps container', 'error');
        state.errors++;
        updateUI();
        // Re-add stylet to hub if user dropped a wrong item (or nothing)
        setupStep4SharpsScene();
        return;
    }

    // Get the sharps container rect (scene item)
    const sharpsItem = state.permanentItems.find(it => it.onlyStep === 4 && it.imageKey === 'sharps');
    const center = getHumeralCenter();

    // If sharps isn't present for some reason, recreate step items
    if (!sharpsItem) {
        setupStep4SharpsScene();
        showFeedback('Sharps container missing. Rebuilding Step 4 scene.', 'error');
        state.errors++;
        updateUI();
        return;
    }

    const rect = {
        left: sharpsItem.x - sharpsItem.width / 2,
        right: sharpsItem.x + sharpsItem.width / 2,
        top: sharpsItem.y - sharpsItem.height / 2,
        bottom: sharpsItem.y + sharpsItem.height / 2
    };

    const inside = item.x >= rect.left && item.x <= rect.right && item.y >= rect.top && item.y <= rect.bottom;

    if (inside) {
        showFeedback('✓ Stylet disposed in sharps container. Never recap needles.', 'success');
        state.styletDisposed = true;
        state.sharpsDisposed = true;

        // Remove step 4 scoped items
        state.permanentItems = state.permanentItems.filter(it => it.onlyStep !== 4);
        setTimeout(() => advanceStep(), 900);
    } else {
        showFeedback('Drop the stylet INTO the sharps container', 'error');
        state.errors++;
        updateUI();
        // Put the stylet back over the hub for another attempt
        const styletW = 256 * CONFIG.STEP4_STYLET_SCALE;
        const styletH = 283 * CONFIG.STEP4_STYLET_SCALE;
        state.permanentItems.push({
            imageKey: 'stylet',
            x: center.x,
            y: center.y,
            width: styletW,
            height: styletH,
            onlyStep: 4,
            sceneDraggable: true
        });
    }
}

function validateDocumentation(item) {
    if (item.type !== 'sf600') {
        showFeedback('Complete the SF 600 form', 'error');
        state.errors++;
        return;
    }
    
    showFeedback('✓ Procedure documented on SF 600. Simulation complete!', 'success');
    state.documented = true;
    document.querySelector(`[data-tool-key="${item.type}"]`).classList.add('used');
    setTimeout(() => advanceStep(), 1500);
}

// ===== TEST FUNCTIONS =====
function initTest() {
    // Select 10 random questions from bank
    const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
    state.currentTest = shuffled.slice(0, 10);
    state.currentQuestionIndex = 0;
    state.userAnswers = new Array(10).fill(null);
    
    showScreen('test-screen');
    displayQuestion();
}

function displayQuestion() {
    const q = state.currentTest[state.currentQuestionIndex];
    
    document.getElementById('current-question').textContent = state.currentQuestionIndex + 1;
    document.getElementById('question-num').textContent = state.currentQuestionIndex + 1;
    document.getElementById('question-text').textContent = q.question;
    
    const optionsContainer = document.getElementById('answer-options');
    optionsContainer.innerHTML = '';
    
    q.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'answer-option';
        if (state.userAnswers[state.currentQuestionIndex] === index) {
            optionDiv.classList.add('selected');
        }
        
        const letter = String.fromCharCode(65 + index);
        optionDiv.innerHTML = `
            <div class="option-letter">${letter}</div>
            <div class="option-text">${option}</div>
        `;
        
        optionDiv.addEventListener('click', () => selectAnswer(index));
        optionsContainer.appendChild(optionDiv);
    });
    
    // Update progress
    const progress = ((state.currentQuestionIndex + 1) / 10) * 100;
    document.getElementById('test-progress-fill').style.width = progress + '%';
    
    // Update buttons
    document.getElementById('prev-question-btn').disabled = state.currentQuestionIndex === 0;
    
    if (state.currentQuestionIndex === 9) {
        document.getElementById('next-question-btn').classList.add('hidden');
        document.getElementById('submit-test-btn').classList.remove('hidden');
    } else {
        document.getElementById('next-question-btn').classList.remove('hidden');
        document.getElementById('submit-test-btn').classList.add('hidden');
    }
}

function selectAnswer(answerIndex) {
    state.userAnswers[state.currentQuestionIndex] = answerIndex;
    displayQuestion();
}

function nextQuestion() {
    if (state.currentQuestionIndex < 9) {
        state.currentQuestionIndex++;
        displayQuestion();
    }
}

function prevQuestion() {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        displayQuestion();
    }
}

function submitTest() {
    // Calculate score
    let correct = 0;
    state.incorrectSteps.clear();
    
    state.currentTest.forEach((q, index) => {
        if (state.userAnswers[index] === q.correct) {
            correct++;
        } else {
            state.incorrectSteps.add(q.relatedStep);
        }
    });
    
    state.testScore = (correct / 10) * 100;
    
    showTestResults();
}

function showTestResults() {
    const passed = state.testScore === 100;
    
    const resultsHeader = document.getElementById('results-header');
    resultsHeader.className = 'results-header ' + (passed ? 'pass' : 'fail');
    resultsHeader.innerHTML = `<h2>${passed ? '✓ PASSED' : '✗ FAILED'}</h2>`;
    
    document.getElementById('test-score').textContent = state.testScore.toFixed(0) + '%';
    
    const passFailText = document.getElementById('pass-fail-text');
    passFailText.className = 'pass-fail-indicator ' + (passed ? 'pass' : 'fail');
    passFailText.textContent = passed ? 'TASK STANDARD MET' : 'REMEDIAL TRAINING REQUIRED';
    
    // Show question review
    const reviewContainer = document.getElementById('question-review');
    reviewContainer.innerHTML = '<h3 style="color: #d4af37; margin-bottom: 15px;">QUESTION REVIEW</h3>';
    
    state.currentTest.forEach((q, index) => {
        const userAnswer = state.userAnswers[index];
        const isCorrect = userAnswer === q.correct;
        
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-item ' + (isCorrect ? 'correct' : 'incorrect');
        
        reviewDiv.innerHTML = `
            <div class="review-header">
                <span>Question ${index + 1}</span>
                <span class="review-status ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
                </span>
            </div>
            <div class="review-question">${q.question}</div>
            ${!isCorrect ? `
                <div class="review-answer user">Your answer: ${q.options[userAnswer]}</div>
                <div class="review-answer correct-answer">Correct answer: ${q.options[q.correct]}</div>
                <div style="margin-top: 10px; color: #a0aec0; font-size: 14px;">${q.explanation}</div>
            ` : ''}
        `;
        
        reviewContainer.appendChild(reviewDiv);
    });
    
    // Show appropriate next step
    if (passed) {
        document.getElementById('pass-section').classList.remove('hidden');
        document.getElementById('remedial-section').classList.add('hidden');
    } else {
        document.getElementById('remedial-section').classList.remove('hidden');
        document.getElementById('pass-section').classList.add('hidden');
    }
    
    showScreen('test-results-screen');
}

function startRemedialTraining() {
    const stepsToReview = Array.from(state.incorrectSteps).sort((a, b) => a - b);
    
    const container = document.getElementById('remedial-steps-container');
    container.innerHTML = '';
    
    stepsToReview.forEach(stepNum => {
        const stepInfo = STEPS[stepNum];
        const guidance = stepInfo.remedialGuidance;
        
        const stepCard = document.createElement('div');
        stepCard.className = 'remedial-step-card';
        
        stepCard.innerHTML = `
            <div class="remedial-step-header">
                <div class="remedial-step-title">${stepInfo.title}</div>
                <button class="hint-toggle" data-step="${stepNum}">Show Guidance</button>
            </div>
            <div class="remedial-step-description">${guidance.description}</div>
            <div class="hint-box" id="hint-${stepNum}">
                <div class="hint-icon">💡</div>
                <div class="hint-text">
                    <strong>${guidance.title}</strong><br><br>
                    ${guidance.hints.map(hint => `• ${hint}`).join('<br>')}
                </div>
            </div>
        `;
        
        container.appendChild(stepCard);
    });
    
    // Add hint toggle listeners
    document.querySelectorAll('.hint-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const stepNum = e.target.dataset.step;
            const hintBox = document.getElementById(`hint-${stepNum}`);
            hintBox.classList.toggle('visible');
            e.target.textContent = hintBox.classList.contains('visible') ? 'Hide Guidance' : 'Show Guidance';
        });
    });
    
    showScreen('remedial-screen');
}

function completeRemedial() {
    // Reset for retest
    state.remedialCompleted = true;
    initTest();
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    // ---------- PLATFORM DATA ----------
    const MOS_LIST = [
        { code: '68W', enabled: true },
        { code: '68C', enabled: false },
        { code: '68D', enabled: false },
        { code: '68E', enabled: false },
        { code: '68F', enabled: false },
        { code: '68J', enabled: false },
        { code: '68K', enabled: false },
        { code: '68M', enabled: false },
        { code: '68P', enabled: false },
        { code: '68Q', enabled: false },
        { code: '68R', enabled: false },
        { code: '68T', enabled: false },
        { code: '68V', enabled: false },
        { code: '68X', enabled: false },
        { code: '68Y', enabled: false }
    ];

    const TASK_CATALOG = {
        '68W': [
            {
                id: TASK_NUMBER,
                name: TASK_NAME,
                enabled: true,
                badge: 'ICT'
            }
        ]
    };

    state.selectedMos = state.selectedMos || null;
    state.selectedTaskId = state.selectedTaskId || null;

    // ---------- INITIALIZATION ----------
    try {
        initCanvas();
        loadImages();
    } catch (err) {
        console.error('Initialization error:', err);
    }

    // Populate dynamic task text (used on the congratulations screen).
    const taskNameEl = document.getElementById('task-name-dynamic');
    if (taskNameEl) taskNameEl.textContent = TASK_NAME;
    const taskNumEl = document.getElementById('task-number-dynamic');
    if (taskNumEl) taskNumEl.textContent = `Task ${TASK_NUMBER}`;
    const taskNumHl = document.getElementById('task-number-highlight');
    if (taskNumHl) taskNumHl.textContent = TASK_NUMBER;

    // Keep HUD + intro aligned to selected task (single-task for now, but future-proof).
    function applySelectedTaskToUI(task) {
        const introName = document.getElementById('task-name-intro');
        if (introName) introName.textContent = task.name;

        const introNum = document.getElementById('task-number-intro');
        if (introNum) introNum.textContent = task.id;

        const hudCode = document.getElementById('task-code-hud');
        if (hudCode) hudCode.textContent = task.id;
    }

    function renderMosGrid() {
        const grid = document.getElementById('mos-grid');
        if (!grid) return;
        grid.innerHTML = '';

        MOS_LIST.forEach(mos => {
            const card = document.createElement('div');
            card.className = 'mos-card' + (mos.enabled ? '' : ' disabled');
            card.innerHTML = `
                <div class="mos-code">${mos.code}</div>
                ${mos.enabled ? '' : '<div class="coming-soon"><span>⏳</span><span>Coming Soon</span></div>'}
            `;

            if (mos.enabled) {
                card.addEventListener('click', () => {
                    state.selectedMos = mos.code;
                    renderTaskGrid(mos.code);
                    showScreen('task-screen');
                });
            }
            grid.appendChild(card);
        });
    }

    function renderTaskGrid(mosCode) {
        const grid = document.getElementById('task-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const title = document.getElementById('task-screen-title');
        if (title) title.textContent = `${mosCode} TASK CATALOG`;

        const tasks = TASK_CATALOG[mosCode] || [];
        tasks.forEach(t => {
            const card = document.createElement('div');
            card.className = 'task-card' + (t.enabled ? '' : ' disabled');
            card.innerHTML = `
                <div class="mos-code" style="font-size: 16px; letter-spacing: 1px;">${t.badge} • ${t.id}</div>
                <div style="margin-top: 8px; font-weight: 800; color: var(--text-primary);">${t.name}</div>
                ${t.enabled ? '' : '<div class="coming-soon"><span>⏳</span><span>Coming Soon</span></div>'}
            `;

            if (t.enabled) {
                card.addEventListener('click', () => {
                    state.selectedTaskId = t.id;
                    applySelectedTaskToUI(t);
                    showScreen('intro-screen'); // current "Task Overview" screen
                });
            }
            grid.appendChild(card);
        });
    }

    // ---------- NAV BUTTONS ----------
    const goMosBtn = document.getElementById('go-mos-btn');
    if (goMosBtn) goMosBtn.addEventListener('click', () => {
        renderMosGrid();
        showScreen('mos-screen');
    });

    const mosBackBtn = document.getElementById('mos-back-btn');
    if (mosBackBtn) mosBackBtn.addEventListener('click', () => showScreen('welcome-screen'));

    const taskBackBtn = document.getElementById('task-back-btn');
    if (taskBackBtn) taskBackBtn.addEventListener('click', () => showScreen('mos-screen'));

    // Start training from Task Overview (existing behavior)
    const startBtn = document.getElementById('start-training-btn');
    if (startBtn) startBtn.addEventListener('click', startTraining);

    // Debrief -> Test
    const proceedToTestBtn = document.getElementById('proceed-to-test-btn');
    if (proceedToTestBtn) proceedToTestBtn.addEventListener('click', initTest);

    // Test screen
    const prevBtn = document.getElementById('prev-question-btn');
    if (prevBtn) prevBtn.addEventListener('click', prevQuestion);
    const nextBtn = document.getElementById('next-question-btn');
    if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
    const submitBtn = document.getElementById('submit-test-btn');
    if (submitBtn) submitBtn.addEventListener('click', submitTest);

    // Test results
    const remedialBtn = document.getElementById('start-remedial-btn');
    if (remedialBtn) remedialBtn.addEventListener('click', startRemedialTraining);
    const proceedCongratsBtn = document.getElementById('proceed-to-congratulations-btn');
    if (proceedCongratsBtn) proceedCongratsBtn.addEventListener('click', () => showScreen('congratulations-screen'));

    // Remedial
    const completeRemedialBtn = document.getElementById('complete-remedial-btn');
    if (completeRemedialBtn) completeRemedialBtn.addEventListener('click', completeRemedial);

    // Congratulations
    const restartBtn = document.getElementById('restart-from-congratulations-btn');
    if (restartBtn) restartBtn.addEventListener('click', () => location.reload());

    // Debug toggles
    const showHotspots = document.getElementById('show-hotspots');
    if (showHotspots) showHotspots.addEventListener('change', (e) => {
        state.showHotspots = e.target.checked;
        renderScene();
    });

    const showNeedleTip = document.getElementById('show-needle-tip');
    if (showNeedleTip) showNeedleTip.addEventListener('change', (e) => {
        state.showNeedleTip = e.target.checked;
        renderScene();
    });

    const skipStepBtn = document.getElementById('skip-step-btn');
    if (skipStepBtn) skipStepBtn.addEventListener('click', () => advanceStep());

    // Debug panel toggle (D)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
            if (!e.ctrlKey && !e.metaKey) {
                const dbg = document.getElementById('debug-panel');
                if (dbg) dbg.classList.toggle('hidden');
            }
        }
    });

    // ---------- CANVAS INTERACTIONS ----------
    // Step 9: tap/click the IO site (single unified handler)
    if (canvas) canvas.addEventListener('pointerup', (e) => {
        if (state.currentScreen !== 'training-screen') return;
        if (state.currentStep !== 9) return;
        if (state.draggedItem) return;

        e.preventDefault();

        const pt = getCanvasPointFromEvent(e);
        const center = getHumeralCenter();
        const dist = distance({ x: pt.x, y: pt.y }, center);

        if (dist <= CONFIG.HIT_TOLERANCE * 2) {
            state.siteChecked = true;
            showFeedback('✓ IO site assessed. No signs of infiltration noted.', 'success');
            setTimeout(() => advanceStep(), 900);
        } else {
            showFeedback('Tap the IO insertion site to assess patency', 'error');
            state.errors++;
            updateUI();
        }
    }, { passive: false });

    // Step 4: allow dragging the stylet directly from the scene (mobile + desktop)
    if (canvas) canvas.addEventListener('pointerdown', (e) => {
        if (state.currentScreen !== 'training-screen') return;
        if (state.currentStep !== 4) return;
        if (state.draggedItem) return;

        e.preventDefault();

        const pt = getCanvasPointFromEvent(e);
        const x = pt.x;
        const y = pt.y;

        const styletItem = state.permanentItems.find(it => it.onlyStep === 4 && it.imageKey === 'stylet');
        if (!styletItem) return;

        const left = styletItem.x - styletItem.width / 2;
        const top = styletItem.y - styletItem.height / 2;
        const right = styletItem.x + styletItem.width / 2;
        const bottom = styletItem.y + styletItem.height / 2;

        if (x >= left && x <= right && y >= top && y <= bottom) {
            canvas.setPointerCapture?.(e.pointerId);
            startSceneDrag(styletItem, x, y, e.pointerId);
        }
    }, { passive: false });

    // ---------- START STATE ----------
    // Default to platform Welcome screen
    showScreen('welcome-screen');

    // Pre-render MOS so the next screen is instant
    renderMosGrid();

    // Ensure the single available task is the default selection for UI placeholders
    applySelectedTaskToUI(TASK_CATALOG['68W'][0]);
});
