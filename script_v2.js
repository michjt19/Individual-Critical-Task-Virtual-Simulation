// ============================================
// FUTURISTIC US ARMY EZ-IO TRAINING SIMULATOR
// Task 081-68W-0237
// ============================================

// ===== TASK METADATA (set dynamically by loadTaskData) =====
let TASK_NAME   = '';
let TASK_NUMBER = '';

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

    // 68Q — pharmacy vault hotspot positions (normalized 0–1)
    NCOIC_CENTER:         { x: 0.80, y: 0.40 },
    CHIEF_CENTER:         { x: 0.20, y: 0.40 },
    IRREGULARITY_ZONES: [
        { x: 0.20, y: 0.65, label: 'Overage' },
        { x: 0.35, y: 0.65, label: 'Shortage' },
        { x: 0.50, y: 0.65, label: 'Receipts' },
        { x: 0.65, y: 0.65, label: 'Pres. Errors' },
        { x: 0.80, y: 0.65, label: 'Calculations' },
    ],
    VAULT_FORM_TARGET:    { x: 0.50, y: 0.35 },
    COUNTING_TRAY_TARGET: { x: 0.50, y: 0.60 },
};


// ===== PLATFORM DATA (MOS / TASK CATALOG) =====
// Note: This is a proof-of-concept platform shell. Only 68W is enabled right now.
const MOS_LIST = [
  { code: '68A', title: 'Biomedical Equipment Specialist', enabled: false },
  { code: '68B', title: 'Orthopedic Specialist', enabled: false },
  { code: '68C', title: 'Practical Nursing Specialist', enabled: false },
  { code: '68D', title: 'Operating Room Specialist', enabled: false },
  { code: '68E', title: 'Dental Specialist', enabled: false },
  { code: '68F', title: 'Physical Therapy Specialist', enabled: false },
  { code: '68G', title: 'Patient Administration Specialist', enabled: false },
  { code: '68H', title: 'Optical Laboratory Specialist', enabled: false },
  { code: '68J', title: 'Medical Logistics Specialist', enabled: false },
  { code: '68K', title: 'Medical Laboratory Specialist', enabled: false },
  { code: '68L', title: 'Occupational Therapy Specialist', enabled: false },
  { code: '68M', title: 'Nutrition Care Specialist', enabled: false },
  { code: '68N', title: 'Cardiovascular Specialist', enabled: false },
  { code: '68P', title: 'Radiology Specialist', enabled: false },
  { code: '68Q', title: 'Pharmacy Specialist', enabled: true },
  { code: '68R', title: 'Veterinary Food Inspection Specialist', enabled: false },
  { code: '68S', title: 'Preventive Medicine Specialist', enabled: false },
  { code: '68T', title: 'Animal Care Specialist', enabled: false },
  { code: '68U', title: 'Ear, Nose, and Throat (ENT) Specialist', enabled: false },
  { code: '68V', title: 'Respiratory Specialist', enabled: false },
  { code: '68W', title: 'Combat Medic Specialist', enabled: true },
  { code: '68X', title: 'Behavioral Health Specialist', enabled: false },
  { code: '68Y', title: 'Eye Specialist', enabled: false },
  { code: '68Z', title: 'Chief Medical NCO', enabled: false },
];

const TASK_CATALOG = {
  '68W': [
    { id: '081-68W-0237', title: 'Place an Intraosseous Device', enabled: true },
    { id: '081-68W-0230', title: 'Place an Intermediate Airway Device', enabled: false, badge: 'Coming Soon' },
    { id: '081-68W-0238', title: 'Manage an Intraosseous Infusion', enabled: false, badge: 'Coming Soon' },
  ],
  '68Q': [
    { id: '081-68Q-0034', title: 'Inventory Controlled Substances', enabled: true },
  ]
};

function setIntroTask(taskId, taskTitle) {
  const nameEl = document.getElementById('task-name-intro');
  const numEl = document.getElementById('task-number-intro');
  if (nameEl) nameEl.textContent = taskTitle;
  if (numEl) numEl.textContent = taskId;

  // Keep the dynamic text used in later screens aligned too.
  const taskNameEl = document.getElementById('task-name-dynamic');
  if (taskNameEl) taskNameEl.textContent = taskTitle;
  const taskNumEl = document.getElementById('task-number-dynamic');
  if (taskNumEl) taskNumEl.textContent = `Task ${taskId}`;
  const taskNumHl = document.getElementById('task-number-highlight');
  if (taskNumHl) taskNumHl.textContent = taskId;

  // Update conditions and standards from registry
  const t = TASK_REGISTRY[taskId];
  if (t) {
    const condEl = document.getElementById('task-conditions-text');
    if (condEl) condEl.textContent = t.conditions;
    const stdEl  = document.getElementById('task-standards-text');
    if (stdEl)  stdEl.textContent  = t.standards;

    // caution visibility
    const cautionEl = document.getElementById('intro-caution-box');
    if (cautionEl) cautionEl.style.display = t.showCaution ? '' : 'none';

    // learning objectives
    const objGrid = document.getElementById('objectives-grid');
    if (objGrid && t.objectives) {
      objGrid.innerHTML = t.objectives
        .map(o => `<div class="objective">✓ ${o}</div>`)
        .join('');
    }

    // scope note
    const scopeEl = document.getElementById('scope-note-text');
    if (scopeEl) scopeEl.textContent = t.scope;
  }
}

function renderMosGrid() {
  const grid = document.getElementById('mos-grid');
  if (!grid) return;
  grid.innerHTML = '';

  MOS_LIST.forEach(m => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'mos-card' + (m.enabled ? '' : ' disabled');
    card.setAttribute('data-mos', m.code);
    card.innerHTML = `
      <div class="mos-code">${m.code}</div>
      <div class="mos-title">${m.title}</div>
      ${m.enabled ? '' : `<div class="mos-soon">Coming Soon</div>`}
    `;

    if (m.enabled) {
      card.addEventListener('click', () => {
        state.selectedMos = m.code;
        renderTaskGrid(m.code);
        const title = document.getElementById('task-screen-title');
        if (title) title.textContent = `${m.code} TASK CATALOG`;
        showScreen('task-screen');
      });
    } else {
      card.addEventListener('click', () => {
        showFeedback(`${m.code} is coming soon.`, 'error');
      });
    }

    grid.appendChild(card);
  });
}

function renderTaskGrid(mosCode) {
  const grid = document.getElementById('task-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const tasks = TASK_CATALOG[mosCode] || [];
  tasks.forEach(t => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'task-card' + (t.enabled ? '' : ' disabled');
    card.setAttribute('data-task', t.id);
    card.innerHTML = `
      <div class="task-card-num">${t.id}</div>
      <div class="task-card-title">${t.title}</div>
      ${t.enabled ? '' : `<div class="task-card-badge">${t.badge || 'Coming Soon'}</div>`}
    `;

    if (t.enabled) {
      card.addEventListener('click', () => {
        state.selectedTask = t.id;
        setIntroTask(t.id, t.title);
        showScreen('intro-screen');
      });
    } else {
      card.addEventListener('click', () => {
        showFeedback(`${t.id} is coming soon.`, 'error');
      });
    }

    grid.appendChild(card);
  });
}

// ===== STATE MANAGEMENT =====
const state = {
    currentScreen: 'welcome-screen',
    currentStep: 1,
    totalSteps: 10,
    errors: 0,
    startTime: null,
    stepsCompleted: new Set(),
    stepsWithErrors: new Set(),

    trainingMode: 'instructional',   // 'instructional' | 'evaluation'
    evaluationToolOrder: [],

    // Platform navigation
    selectedMos: null,
    selectedTask: null,

    // Active task validators (set by loadTaskData)
    activeValidators: {},

    
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
    // Feedback timer (2D)
    feedbackTimer: null,
};

const IS_COARSE_POINTER = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;


// Scale tolerance on phones/tablets to make drops less frustrating
function tol(px) {
return IS_COARSE_POINTER ? Math.round(px * 1.8) : px;
}


function getCanvasPointFromEvent(e) {
    // Convert viewport coordinates to *canvas coordinate space*.
    // Must account for CSS scaling (common on mobile/when panels resize).
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}
// ===== STEP DEFINITIONS =====
const STEPS_68W_0237 = {
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
const TOOLS_68W_0237 = {
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
const QUESTION_BANK_68W_0237 = [
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

// ===== 68Q — STEP DEFINITIONS =====
const STEPS_68Q_0034 = {
    1: {
        title: "Step 1: Maintain Separate Records",
        instruction: "Drag a DA Form 3862 to each controlled substance binder on the shelf. A separate record must be maintained for each substance and dosage form.",
        scene: "pharmacy-vault",
        requiredTools: ["da_form_3862"],
        validate: () => state.da3862RecordsMaintained,
        remedialGuidance: {
            title: "Separate DA Form 3862 Per Substance",
            description: "Each controlled substance, including each dosage form and strength, must have its own DA Form 3862 Controlled Substances Stock Record.",
            hints: [
                "A separate form is required for EACH substance AND each dosage form",
                "Example: morphine 10mg tablets and morphine 10mg/mL injection require separate forms",
                "This is required by AR 40-3 for complete accountability",
                "Combining substances on one form is a serious regulatory violation",
                "Reference: AR 40-3 and TC 8-260"
            ]
        }
    },
    2: {
        title: "Step 2: Post Receipts",
        instruction: "Drag the supply receipt to the DA Form 3862 to post all receipts and turn-ins.",
        scene: "pharmacy-vault",
        requiredTools: ["supply_receipt"],
        validate: () => state.receiptsPosted,
        remedialGuidance: {
            title: "Posting Receipts to DA Form 3862",
            description: "All supply receipts and turn-ins that add controlled substances to stock must be posted as additions to the running balance.",
            hints: [
                "Post supply receipts (new stock) as additions to the balance",
                "Post turn-ins (returned medications) also as receipts",
                "All receipts must be posted before conducting the physical count",
                "Unposted receipts cause false shortage irregularities",
                "Reference: TC 8-260, DA Form 3862 instructions"
            ]
        }
    },
    3: {
        title: "Step 3: Post Expenditures",
        instruction: "Drag the expenditure record to the DA Form 3862 to post all expenditures.",
        scene: "pharmacy-vault",
        requiredTools: ["expenditure_record"],
        validate: () => state.expendituresPosted,
        remedialGuidance: {
            title: "Posting Expenditures to DA Form 3862",
            description: "All dispensed medications and other expenditures must be posted as subtractions from the running balance before conducting the physical count.",
            hints: [
                "Expenditures are medications dispensed on prescriptions",
                "Post expenditures as subtractions from the on-hand balance",
                "Include waste and destroyed quantities as expenditures",
                "All expenditures must be posted before counting to ensure accuracy",
                "Reference: AR 40-3, TC 8-260"
            ]
        }
    },
    4: {
        title: "Step 4: Count Controlled Substances",
        instruction: "Drag each controlled substance bottle/vial to the counting tray, then click the tray to confirm the count matches the DA Form 3862.",
        scene: "counting-area",
        requiredTools: ["medication_bottle"],
        validate: () => state.substancesCounted,
        remedialGuidance: {
            title: "Physical Inventory Count Procedure",
            description: "Each controlled substance must be physically counted and verified against the balance recorded on DA Form 3862.",
            hints: [
                "Count each controlled substance individually — do not estimate",
                "Compare the physical count to the DA Form 3862 running balance",
                "Any discrepancy between count and record is an irregularity",
                "Count must be conducted every normal administrative duty day",
                "Have a witness verify the count when possible",
                "Reference: AR 40-3"
            ]
        }
    },
    5: {
        title: "Step 5: Complete DA Form 3862",
        instruction: "Sign, date, and record the amount inventoried. Drag the pen to the signature block on the form.",
        scene: "pharmacy-vault",
        requiredTools: ["pen"],
        validate: () => state.da3862Completed,
        remedialGuidance: {
            title: "Completing and Signing DA Form 3862",
            description: "After the inventory count, the DA Form 3862 must be completed with the amount inventoried, signed, and dated by the person conducting the inventory.",
            hints: [
                "Record the exact amount counted in the 'Amount Inventoried' block",
                "Sign with black ink — pencil is not authorized",
                "Date the form with the actual date of inventory",
                "The person who conducted the count must sign the form",
                "Unsigned forms are a regulatory violation",
                "Reference: TC 8-260"
            ]
        }
    },
    6: {
        title: "Step 6: Notify NCOIC/OIC",
        instruction: "Click the NCOIC/OIC to report any irregularities discovered during the inventory.",
        scene: "pharmacy-vault",
        requiredTools: [],
        validate: () => state.ncoicNotified,
        remedialGuidance: {
            title: "Notifying the NCOIC/OIC of Irregularities",
            description: "Any irregularity discovered during the inventory must be reported to the NCOIC/OIC immediately — BEFORE making any adjustment to the DA Form 3862.",
            hints: [
                "Report ALL irregularities — never attempt to self-correct without authorization",
                "NCOIC/OIC must be notified BEFORE any adjustment is made",
                "Document the nature of the irregularity when reporting",
                "Failure to report is a serious regulatory and legal violation",
                "Reference: AR 40-3"
            ]
        }
    },
    7: {
        title: "Step 7: Determine Irregularity Reason",
        instruction: "Click each possible irregularity type to investigate and determine the reason before making any adjustment.",
        scene: "pharmacy-vault",
        requiredTools: [],
        validate: () => state.irregularityDetermined,
        remedialGuidance: {
            title: "Determining the Cause of Irregularities",
            description: "The reason for an irregularity must be determined before any correction is authorized. Possible causes include overages, shortages, receipt errors, prescription errors, and calculation errors.",
            hints: [
                "Overage: more on hand than recorded",
                "Shortage: less on hand than recorded",
                "Receipt errors: supply receipts posted incorrectly",
                "Prescription errors: dispensing errors not captured in expenditures",
                "Calculation errors: math mistakes in running balance",
                "Reference: TC 8-260"
            ]
        }
    },
    8: {
        title: "Step 8: Correct Irregularities",
        instruction: "Drag the pen to the erroneous entry to draw a single correction line and initial the correction.",
        scene: "pharmacy-vault",
        requiredTools: ["pen"],
        validate: () => state.irregularitiesCorrected,
        remedialGuidance: {
            title: "Correcting Irregularities on DA Form 3862",
            description: "Authorized corrections must be made using a single line through the error, with the correct entry written alongside and initialed in black ink.",
            hints: [
                "Draw ONE line through the error — do not obscure the original entry",
                "Write the correct information next to or above the error",
                "Initial the correction in black ink",
                "White-out and erasure are strictly PROHIBITED",
                "Electronic systems require a Memorandum for Record (MFR) signed by OIC/Chief",
                "Reference: AR 40-3, TC 8-260"
            ]
        }
    },
    9: {
        title: "Step 9: Notify Chief of Pharmacy",
        instruction: "Click the Chief of Pharmacy to report inventory results and any corrections made.",
        scene: "pharmacy-vault",
        requiredTools: [],
        validate: () => state.chiefNotified,
        remedialGuidance: {
            title: "Notifying the Chief of Pharmacy",
            description: "After completing all corrections and the inventory process, the Chief of Pharmacy must be notified of the inventory results and any irregularities and corrections.",
            hints: [
                "Notify the Chief of Pharmacy of inventory completion",
                "Report all irregularities found and corrections made",
                "The Chief of Pharmacy has command responsibility for CS accountability",
                "This notification is required by AR 40-3 regardless of whether irregularities were found",
                "Reference: AR 40-3"
            ]
        }
    }
};

// ===== 68Q — TOOL DEFINITIONS =====
const TOOLS_68Q_0034 = {
    da_form_3862:       { name: 'DA Form 3862',       image: 'da_form_3862.png',       size: { w: 400, h: 520 } },
    supply_receipt:     { name: 'Supply Receipt',     image: 'supply_receipt.png',     size: { w: 300, h: 200 } },
    expenditure_record: { name: 'Expenditure Record', image: 'expenditure_record.png', size: { w: 300, h: 200 } },
    medication_bottle:  { name: 'Controlled Substance', image: 'medication_bottle.png', size: { w: 200, h: 300 } },
    pen:                { name: 'Pen (Black Ink)',    image: 'pen.png',                size: { w: 250, h: 60  } },
};

// ===== 68Q — QUESTION BANK (20 questions, 10 randomized per test) =====
const QUESTION_BANK_68Q_0034 = [
    {
        question: "What is the primary purpose of DA Form 3862?",
        options: [
            "To requisition controlled substances",
            "To track controlled substance inventory receipts, expenditures, and balances",
            "To document patient prescriptions",
            "To report drug diversion to CID"
        ],
        correct: 1,
        relatedStep: 1,
        explanation: "DA Form 3862 is the Controlled Substances Stock Record used to document all receipts, expenditures, and running balances for each controlled substance."
    },
    {
        question: "How often must a physical inventory of controlled substances be conducted IAW AR 40-3?",
        options: [
            "Weekly",
            "Monthly",
            "Every normal administrative duty day",
            "Quarterly"
        ],
        correct: 2,
        relatedStep: 4,
        explanation: "AR 40-3 requires a physical inventory of all controlled substances every normal administrative duty day."
    },
    {
        question: "Must a separate DA Form 3862 be maintained for each dosage form and strength of a controlled substance?",
        options: [
            "No, one form per drug name is sufficient",
            "Yes, a separate record for each controlled substance and dosage form is required",
            "Only for Schedule II substances",
            "Only when total stock exceeds 100 units"
        ],
        correct: 1,
        relatedStep: 1,
        explanation: "A separate DA Form 3862 must be maintained for each controlled substance, including each dosage form and strength, to ensure accurate accounting."
    },
    {
        question: "When an irregularity is discovered during a controlled substance inventory, what is the FIRST action?",
        options: [
            "Make an immediate adjustment on the DA Form 3862",
            "Destroy all suspect medications",
            "Notify the NCOIC/OIC before making any adjustment",
            "Notify the military police"
        ],
        correct: 2,
        relatedStep: 6,
        explanation: "The FIRST action is to notify the NCOIC/OIC. The reason for the irregularity must be determined BEFORE any adjustment is made to the record."
    },
    {
        question: "What is the correct method for correcting an error on a paper DA Form 3862?",
        options: [
            "Use white-out to cover the error, then write the correct entry",
            "Erase the error completely and rewrite",
            "Draw a single line through the error, write the correction, and initial it with black ink",
            "Tear out the page and start a new form"
        ],
        correct: 2,
        relatedStep: 8,
        explanation: "Corrections must be made by drawing a single line through the error with black ink, writing the correct entry, and initialing. White-out and erasure are strictly prohibited."
    },
    {
        question: "Which of the following is PROHIBITED when correcting a DA Form 3862?",
        options: [
            "Initialing the correction",
            "Drawing a single line through the error",
            "Using white-out or erasure",
            "Writing the correction in black ink"
        ],
        correct: 2,
        relatedStep: 8,
        explanation: "White-out, erasure, or any method that obscures the original entry is prohibited on controlled substance records."
    },
    {
        question: "After completing the DA Form 3862 inventory, who must sign and date the form?",
        options: [
            "The unit commander",
            "The pharmacy specialist conducting the inventory",
            "Any senior NCO",
            "The installation pharmacist only"
        ],
        correct: 1,
        relatedStep: 5,
        explanation: "The pharmacy specialist (or pharmacist) who conducted the inventory must sign and date the DA Form 3862 and record the amount inventoried."
    },
    {
        question: "Both the NCOIC/OIC AND the Chief of Pharmacy must be notified of inventory irregularities. Why must the Chief of Pharmacy be notified?",
        options: [
            "It is not required to notify the Chief of Pharmacy",
            "To ensure command-level oversight and compliance with AR 40-3",
            "Only to notify CID",
            "Only if the amount is over $500"
        ],
        correct: 1,
        relatedStep: 9,
        explanation: "AR 40-3 requires notification of both the NCOIC/OIC and the Chief of Pharmacy to ensure appropriate command oversight of controlled substance discrepancies."
    },
    {
        question: "Which regulation primarily governs Army pharmacy operations and controlled substance management?",
        options: [
            "AR 40-501",
            "AR 350-1",
            "AR 40-3",
            "DA Pam 30-22"
        ],
        correct: 2,
        relatedStep: 1,
        explanation: "AR 40-3 (Medical, Dental, and Veterinary Care) is the primary regulation governing Army pharmacy operations and controlled substance accountability."
    },
    {
        question: "What are 'receipts' in the context of DA Form 3862 posting?",
        options: [
            "Only prescriptions dispensed to patients",
            "Supply receipts and turn-ins that increase the on-hand balance",
            "Expenditures that decrease the balance",
            "End-of-day summaries"
        ],
        correct: 1,
        relatedStep: 2,
        explanation: "Receipts include supply receipts AND turn-ins — anything that adds to the on-hand balance. Both must be posted to the DA Form 3862."
    },
    {
        question: "Which of the following is classified as an 'expenditure' when posting to DA Form 3862?",
        options: [
            "A new stock shipment arrival",
            "A turn-in to supply",
            "A medication dispensed on a prescription",
            "A quarterly inventory count"
        ],
        correct: 2,
        relatedStep: 3,
        explanation: "Expenditures are medications dispensed (used) — they are subtracted from the on-hand balance. Supply receipts and turn-ins are receipts (additions)."
    },
    {
        question: "Which TC publication provides detailed procedures for Army pharmacy controlled substance accountability?",
        options: [
            "TC 8-800",
            "TC 8-260",
            "TC 4-02.1",
            "TC 3-04.11"
        ],
        correct: 1,
        relatedStep: 1,
        explanation: "TC 8-260 (Army Medical Department Pharmacy) provides detailed procedures for controlled substance accounting in Army pharmacies."
    },
    {
        question: "What does an OVERAGE irregularity indicate on a controlled substance inventory?",
        options: [
            "Less medication on hand than the record shows",
            "More medication on hand than the record shows",
            "A prescription dispensing error",
            "A receipt that was never posted"
        ],
        correct: 1,
        relatedStep: 7,
        explanation: "An overage means more controlled substance is physically on hand than the DA Form 3862 balance indicates — possible posting or receipt error."
    },
    {
        question: "What does a SHORTAGE irregularity indicate on a controlled substance inventory?",
        options: [
            "More on hand than recorded",
            "Less on hand than the DA Form 3862 balance shows",
            "A form that was never signed",
            "A supply requisition that was denied"
        ],
        correct: 1,
        relatedStep: 7,
        explanation: "A shortage means less controlled substance is physically on hand than the DA Form 3862 balance shows — could indicate diversion, dispensing error, or posting error."
    },
    {
        question: "If an electronic system is used for controlled substance records, what additional document is required for corrections per AR 40-3?",
        options: [
            "An SF 600",
            "A DA Form 4856",
            "A Memorandum for Record (MFR) signed by the OIC or Chief of Pharmacy",
            "No additional documents — electronic corrections are self-documenting"
        ],
        correct: 2,
        relatedStep: 8,
        explanation: "Electronic corrections require a Memorandum for Record (MFR) signed by the OIC or Chief of Pharmacy to document the reason for the change."
    },
    {
        question: "What is the purpose of determining the reason for an irregularity BEFORE making an adjustment?",
        options: [
            "It is not required to determine a reason first",
            "To ensure proper accountability and prevent undetected drug diversion",
            "To delay reporting to allow for self-correction",
            "To calculate the financial cost of the loss"
        ],
        correct: 1,
        relatedStep: 7,
        explanation: "Determining the cause first ensures that drug diversion or other criminal activity is not concealed by an administrative correction."
    },
    {
        question: "Which form is used to report confirmed controlled substance loss or theft to authorities?",
        options: [
            "DA Form 3862",
            "SF 600",
            "DA Form 3949",
            "DD Form 1380"
        ],
        correct: 2,
        relatedStep: 6,
        explanation: "DA Form 3949 (Controlled Substances Report) is submitted to report confirmed loss or theft of controlled substances."
    },
    {
        question: "How are supply receipts for controlled substances posted to DA Form 3862?",
        options: [
            "As a subtraction from the current balance",
            "As an addition to the current on-hand balance",
            "They are not posted until the end of the month",
            "They are posted only by the OIC"
        ],
        correct: 1,
        relatedStep: 2,
        explanation: "Supply receipts are posted as additions (credits) to the running balance on DA Form 3862, increasing the amount on hand."
    },
    {
        question: "After completing the physical count, what must be verified during the inventory?",
        options: [
            "That all medications are past their expiration date",
            "That the physical count matches the balance shown on DA Form 3862",
            "That the OIC has signed all prescriptions",
            "That the storage temperature is below 30°C"
        ],
        correct: 1,
        relatedStep: 4,
        explanation: "The physical count of each controlled substance must be verified against the running balance on DA Form 3862. Any discrepancy is an irregularity requiring investigation."
    },
    {
        question: "Which of the following best describes a 'calculation error' irregularity?",
        options: [
            "A medication that was stolen",
            "A math error in posting receipts, expenditures, or running balances on DA Form 3862",
            "A drug that expired in storage",
            "A requisition that was submitted late"
        ],
        correct: 1,
        relatedStep: 7,
        explanation: "A calculation error irregularity occurs when arithmetic mistakes in posting amounts cause the recorded balance to differ from the actual quantity on hand."
    }
];

// ===== DYNAMIC TASK GLOBALS (set by loadTaskData each run) =====
let STEPS         = null;
let TOOLS         = null;
let QUESTION_BANK = null;

// ===== VALIDATOR DISPATCH TABLES =====
const VALIDATORS_68W_0237 = {
    1:  validateBSI,
    2:  validateCleaning,
    3:  validateDriverInsertion,
    4:  validateSharpsDisposal,
    5:  validateDressing,
    6:  validateExtensionSet,
    7:  validateSyringe,
    8:  validateFlush,
    10: validateDocumentation,
    // step 9 (IO site check) is click-based — handled in canvas pointerup
};

const VALIDATORS_68Q_0034 = {
    1: validateDA3862Records,
    2: validateReceiptsPosted,
    3: validateExpendituresPosted,
    4: validateCountSubstances,
    5: validateCompleteDA3862,
    // steps 6, 7, 9 are click-based — handled in canvas pointerup
    8: validateCorrectIrregularities,
};

// ===== TASK REGISTRY =====
const TASK_REGISTRY = {
    '081-68W-0237': {
        name:        'Place an Intraosseous Device',
        mos:         '68W',
        totalSteps:  10,
        conditions:  'You are in an operational environment with a casualty requiring IO infusion. Equipment provided: IO driver, cartridge, alcohol prep pads, sterile syringe, NS flush, extension set, gauze, biohazard bag, and SF 600.',
        standards:   'Place an IO device IAW PHTLS Prehospital Trauma Life Support and TCCC Guidelines while adhering to all warnings and cautions, without error.',
        steps:        STEPS_68W_0237,
        tools:        TOOLS_68W_0237,
        questionBank: QUESTION_BANK_68W_0237,
        validators:   VALIDATORS_68W_0237,
        resetFlags:   resetFlags_68W_0237,
        showCaution: true,
        objectives: [
            'Demonstrate proper BSI procedures',
            'Apply aseptic technique for site preparation',
            'Position driver at 90-degree angle',
            'Attach extension set before syringe',
            'Flush catheter with 5-10mL saline',
            'Secure catheter with dressing',
            'Dispose of sharps without recapping',
            'Document on SF 600',
        ],
        debriefObjectives: [
            'Demonstrated proper BSI procedures',
            'Applied aseptic technique for site preparation',
            'Positioned EZ-IO driver at 90-degree angle',
            'Attached extension set before syringe (safety)',
            'Flushed catheter with appropriate saline volume',
            'Secured catheter with dressing',
            'Disposed of sharps properly without recapping',
            'Documented procedure appropriately',
        ],
        taskSummary: 'You have practiced essential steps for establishing intraosseous access using the EZ-IO system at the humeral insertion site. This skill is critical for providing vascular access when traditional IV access is difficult or impossible in tactical and emergency settings.',
        keyPoints: [
            'Always observe BSI precautions',
            'Use aseptic technique throughout',
            'Position driver perpendicular (90°) to bone',
            'Never attach syringe directly to hub - use extension set',
            'Flush with 5-10mL saline, observe for infiltration',
            'Never recap needles - sharps container only',
            'Document all procedures IAW TCCC guidelines',
        ],
        scope: 'EZ-IO Humeral Insertion (Performance Measures 1-18). FAST1 sternal placement not included.',
    },
    '081-68Q-0034': {
        name:        'Inventory Controlled Substances',
        mos:         '68Q',
        totalSteps:  9,
        conditions:  'Given a pharmacy controlled substance vault with stock on hand. Equipment provided: DA Form 3862 records, supply receipts, expenditure records, and a pen (black ink). Applicable references: AR 40-3, TC 8-260.',
        standards:   'Inventory all controlled substances IAW AR 40-3. All 9 performance measures must be completed correctly to standard. GO/NO-GO.',
        steps:        STEPS_68Q_0034,
        tools:        TOOLS_68Q_0034,
        questionBank: QUESTION_BANK_68Q_0034,
        validators:   VALIDATORS_68Q_0034,
        resetFlags:   resetFlags_68Q_0034,
        showCaution: false,
        objectives: [
            'Maintain separate accounting records per substance and dosage form',
            'Post all receipts and turn-ins to DA Form 3862',
            'Post all expenditures to the running balance',
            'Physically count controlled substances and verify against records',
            'Complete DA Form 3862 with signature, date, and amount inventoried',
            'Report irregularities to NCOIC/OIC before making adjustments',
            'Investigate and determine the reason for each irregularity',
            'Correct documentation errors IAW regulatory standards',
            'Notify Chief of Pharmacy of inventory results and corrections',
        ],
        debriefObjectives: [
            'Maintained separate accounting records per substance and dosage form',
            'Posted all receipts and turn-ins to DA Form 3862',
            'Posted all expenditures to the running balance',
            'Physically counted controlled substances and verified against records',
            'Completed DA Form 3862 with signature, date, and amount inventoried',
            'Reported irregularities to NCOIC/OIC before making adjustments',
            'Investigated and determined the reason for each irregularity',
            'Corrected documentation errors IAW regulatory standards',
            'Notified Chief of Pharmacy of inventory results and corrections',
        ],
        taskSummary: 'You have practiced essential steps for conducting a controlled substance vault inventory IAW AR 40-3. This skill is critical for maintaining accurate accountability of controlled substances and ensuring regulatory compliance in a pharmacy setting.',
        keyPoints: [
            'Maintain separate records for each substance and dosage form',
            'Post all receipts, turn-ins, and expenditures to DA Form 3862',
            'Physically verify counts against records each inventory',
            'Always sign and date DA Form 3862 with amount inventoried',
            'Report all irregularities to NCOIC/OIC before adjusting records',
            'Document and investigate the cause of each irregularity',
            'Notify Chief of Pharmacy of all inventory results and corrections',
        ],
        scope: 'Controlled substance vault inventory IAW AR 40-3 (Performance Measures 1-9). Biennial inventory procedures not included.',
    }
};

// ===== TASK LOADER =====
function loadTaskData(taskId) {
    const t = TASK_REGISTRY[taskId];
    if (!t) { console.error('Unknown taskId:', taskId); return; }
    STEPS               = t.steps;
    TOOLS               = t.tools;
    QUESTION_BANK       = t.questionBank;
    TASK_NAME           = t.name;
    TASK_NUMBER         = taskId;
    state.totalSteps    = t.totalSteps;
    state.activeValidators = t.validators;
    t.resetFlags();

    // Update HUD task code and step total
    const hudCode = document.getElementById('task-code-hud');
    if (hudCode) hudCode.textContent = taskId;
    const stepTotal = document.getElementById('step-total-display');
    if (stepTotal) stepTotal.textContent = t.totalSteps;
}

// ===== TASK-SPECIFIC FLAG RESET FUNCTIONS =====
function resetFlags_68W_0237() {
    state.bsiDonned         = { gloves: false, eyePro: false };
    state.driverInserted    = false;
    state.extensionAttached = false;
    state.syringeAttached   = false;
    state.flushed           = false;
    state.dressingApplied   = false;
    state.sharpsDisposed    = false;
    state.styletDisposed    = false;
    state.documented        = false;
    state.siteChecked       = false;
    state.permanentItems    = [];
}

function resetFlags_68Q_0034() {
    state.da3862RecordsMaintained = false;
    state.receiptsPosted          = false;
    state.expendituresPosted      = false;
    state.substancesCounted       = false;
    state.da3862Completed         = false;
    state.ncoicNotified           = false;
    state.irregularityDetermined  = false;
    state.irregularitiesCorrected = false;
    state.chiefNotified           = false;
    state.permanentItems          = [];
}

// ===== 68Q DROP VALIDATORS =====
function getVaultTarget() {
    return { x: CONFIG.VAULT_FORM_TARGET.x * canvas.width, y: CONFIG.VAULT_FORM_TARGET.y * canvas.height };
}

function getCountingTrayTarget() {
    return { x: CONFIG.COUNTING_TRAY_TARGET.x * canvas.width, y: CONFIG.COUNTING_TRAY_TARGET.y * canvas.height };
}

function validateDA3862Records(item) {
    if (item.type !== 'da_form_3862') {
        showFeedback('Drag the DA Form 3862 to the substance binder', 'error');
        logError(); return;
    }
    const target = getVaultTarget();
    if (distance(item, target) < tol(CONFIG.HIT_TOLERANCE * 2)) {
        state.da3862RecordsMaintained = true;
        showFeedback('✓ Separate DA Form 3862 maintained for each controlled substance', 'success');
        document.querySelector(`[data-tool-key="${item.type}"]`)?.classList.add('used');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Drag the form to the substance binder shelf area', 'error');
        logError();
    }
}

function validateReceiptsPosted(item) {
    if (item.type !== 'supply_receipt') {
        showFeedback('Drag the supply receipt to the DA Form 3862', 'error');
        logError(); return;
    }
    const target = getVaultTarget();
    if (distance(item, target) < tol(CONFIG.HIT_TOLERANCE * 2)) {
        state.receiptsPosted = true;
        showFeedback('✓ All receipts and turn-ins posted to DA Form 3862', 'success');
        document.querySelector(`[data-tool-key="${item.type}"]`)?.classList.add('used');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Drag the receipt to the DA Form 3862 on the shelf', 'error');
        logError();
    }
}

function validateExpendituresPosted(item) {
    if (item.type !== 'expenditure_record') {
        showFeedback('Drag the expenditure record to the DA Form 3862', 'error');
        logError(); return;
    }
    const target = getVaultTarget();
    if (distance(item, target) < tol(CONFIG.HIT_TOLERANCE * 2)) {
        state.expendituresPosted = true;
        showFeedback('✓ All expenditures posted to DA Form 3862', 'success');
        document.querySelector(`[data-tool-key="${item.type}"]`)?.classList.add('used');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Drag the expenditure record to the DA Form 3862', 'error');
        logError();
    }
}

function validateCountSubstances(item) {
    if (item.type !== 'medication_bottle') {
        showFeedback('Drag the controlled substance bottle to the counting tray', 'error');
        logError(); return;
    }
    const target = getCountingTrayTarget();
    if (distance(item, target) < tol(CONFIG.HIT_TOLERANCE * 2)) {
        state.substancesCounted = true;
        showFeedback('✓ Physical count complete — count matches DA Form 3862 balance', 'success');
        document.querySelector(`[data-tool-key="${item.type}"]`)?.classList.add('used');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Drag the controlled substance to the counting tray', 'error');
        logError();
    }
}

function validateCompleteDA3862(item) {
    if (item.type !== 'pen') {
        showFeedback('Use the pen (black ink) to sign the DA Form 3862', 'error');
        logError(); return;
    }
    const target = getVaultTarget();
    if (distance(item, target) < tol(CONFIG.HIT_TOLERANCE * 2)) {
        state.da3862Completed = true;
        showFeedback('✓ DA Form 3862 signed, dated, and amount inventoried recorded', 'success');
        document.querySelector(`[data-tool-key="${item.type}"]`)?.classList.add('used');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Drag the pen to the signature block on the DA Form 3862', 'error');
        logError();
    }
}

function validateCorrectIrregularities(item) {
    if (item.type !== 'pen') {
        showFeedback('Use the pen to make a single-line correction on the form', 'error');
        logError(); return;
    }
    const target = getVaultTarget();
    if (distance(item, target) < tol(CONFIG.HIT_TOLERANCE * 2)) {
        state.irregularitiesCorrected = true;
        showFeedback('✓ Irregularities corrected — single line, initialed in black ink', 'success');
        document.querySelector(`[data-tool-key="${item.type}"]`)?.classList.add('used');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Drag the pen to the erroneous entry on the DA Form 3862', 'error');
        logError();
    }
}

// ===== 68Q CLICK-BASED VALIDATORS =====
function handlePharmacyClick(pt) {
    if (state.currentStep === 6) {
        validateNcoicNotification(pt);
    } else if (state.currentStep === 7) {
        validateIrregularityDetermination(pt);
    } else if (state.currentStep === 9) {
        validateChiefNotification(pt);
    }
}

function validateNcoicNotification(pt) {
    const cx = CONFIG.NCOIC_CENTER.x * canvas.width;
    const cy = CONFIG.NCOIC_CENTER.y * canvas.height;
    if (distance(pt, { x: cx, y: cy }) < tol(CONFIG.HIT_TOLERANCE * 3)) {
        state.ncoicNotified = true;
        showFeedback('✓ NCOIC/OIC notified of inventory irregularities', 'success');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Click the NCOIC/OIC figure to report irregularities', 'error');
        logError();
        updateUI();
    }
}

function validateIrregularityDetermination(pt) {
    const hit = CONFIG.IRREGULARITY_ZONES.some(zone => {
        const zx = zone.x * canvas.width;
        const zy = zone.y * canvas.height;
        return distance(pt, { x: zx, y: zy }) < tol(CONFIG.HIT_TOLERANCE * 2);
    });
    if (hit) {
        state.irregularityDetermined = true;
        showFeedback('✓ Irregularity reason determined before making any adjustment', 'success');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Click an irregularity type to investigate the reason', 'error');
        logError();
        updateUI();
    }
}

function validateChiefNotification(pt) {
    const cx = CONFIG.CHIEF_CENTER.x * canvas.width;
    const cy = CONFIG.CHIEF_CENTER.y * canvas.height;
    if (distance(pt, { x: cx, y: cy }) < tol(CONFIG.HIT_TOLERANCE * 3)) {
        state.chiefNotified = true;
        showFeedback('✓ Chief of Pharmacy notified of inventory results and corrections', 'success');
        setTimeout(() => advanceStep(), 1500);
    } else {
        showFeedback('Click the Chief of Pharmacy to report inventory results', 'error');
        logError();
        updateUI();
    }
}

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
        // Step 1 BSI visuals (68W)
        { key: 'hands', src: 'hands.png' },
        { key: 'face', src: 'face.png' },
        // Step 4 stylet (scene-only draggable, 68W)
        { key: 'stylet', src: 'stylet.png' },
        { key: 'target_humeral', src: 'target_humeral.png' },
        { key: 'io_hub', src: 'io_hub.png' },
        // 68Q scene backgrounds
        { key: 'pharmacy_vault_bg', src: 'pharmacy_vault_bg.png' },
        { key: 'counting_area_bg', src: 'counting_area_bg.png' },
        // 68W tools
        ...Object.keys(TOOLS_68W_0237).map(key => ({ key, src: TOOLS_68W_0237[key].image })),
        // 68Q tools
        ...Object.keys(TOOLS_68Q_0034).map(key => ({ key, src: TOOLS_68Q_0034[key].image })),
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
    } else if (state.currentScene === 'pharmacy-vault') {
        if (images.pharmacy_vault_bg) {
            ctx.drawImage(images.pharmacy_vault_bg, 0, 0, canvas.width, canvas.height);
        } else {
            // Placeholder background
            ctx.fillStyle = '#0d1f16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#1a3a25';
            ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
            ctx.fillStyle = '#2a5a38';
            ctx.fillRect(40, 40, canvas.width - 80, canvas.height * 0.55);
            ctx.fillStyle = 'rgba(212,175,55,0.15)';
            ctx.fillRect(40, 40, canvas.width - 80, 30);
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PHARMACY CONTROLLED SUBSTANCE VAULT', canvas.width / 2, 62);
            ctx.textAlign = 'left';
        }

        // Drop target zone (steps 1-3, 5, 8)
        if ([1, 2, 3, 5, 8].includes(state.currentStep)) {
            const tx = CONFIG.VAULT_FORM_TARGET.x * canvas.width;
            const ty = CONFIG.VAULT_FORM_TARGET.y * canvas.height;
            ctx.save();
            ctx.strokeStyle = 'rgba(212,175,55,0.7)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(tx - 65, ty - 90, 130, 180);
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(212,175,55,0.08)';
            ctx.fillRect(tx - 65, ty - 90, 130, 180);
            ctx.fillStyle = 'rgba(212,175,55,0.8)';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('DA FORM 3862', tx, ty + 105);
            ctx.textAlign = 'left';
            ctx.restore();
        }

        // Step 6: NCOIC/OIC click target
        if (state.currentStep === 6) {
            const nx = CONFIG.NCOIC_CENTER.x * canvas.width;
            const ny = CONFIG.NCOIC_CENTER.y * canvas.height;
            ctx.save();
            ctx.fillStyle = 'rgba(80,160,80,0.75)';
            ctx.fillRect(nx - 38, ny - 65, 76, 130);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NCOIC/OIC', nx, ny - 72);
            ctx.fillStyle = 'rgba(80,200,80,0.9)';
            ctx.font = '10px monospace';
            ctx.fillText('[CLICK TO REPORT]', nx, ny + 80);
            ctx.textAlign = 'left';
            ctx.restore();
        }

        // Step 7: Irregularity zone click targets
        if (state.currentStep === 7) {
            ctx.save();
            CONFIG.IRREGULARITY_ZONES.forEach(zone => {
                const zx = zone.x * canvas.width;
                const zy = zone.y * canvas.height;
                ctx.fillStyle = 'rgba(200,140,40,0.75)';
                ctx.fillRect(zx - 42, zy - 22, 84, 44);
                ctx.strokeStyle = '#d4af37';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(zx - 42, zy - 22, 84, 44);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(zone.label, zx, zy + 4);
            });
            ctx.fillStyle = 'rgba(212,175,55,0.85)';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('CLICK AN IRREGULARITY TYPE TO INVESTIGATE', canvas.width / 2, canvas.height * 0.55);
            ctx.textAlign = 'left';
            ctx.restore();
        }

        // Step 9: Chief of Pharmacy click target
        if (state.currentStep === 9) {
            const cx2 = CONFIG.CHIEF_CENTER.x * canvas.width;
            const cy2 = CONFIG.CHIEF_CENTER.y * canvas.height;
            ctx.save();
            ctx.fillStyle = 'rgba(60,80,180,0.75)';
            ctx.fillRect(cx2 - 38, cy2 - 65, 76, 130);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('CHIEF OF', cx2, cy2 - 72);
            ctx.fillText('PHARMACY', cx2, cy2 - 58);
            ctx.fillStyle = 'rgba(120,160,255,0.9)';
            ctx.font = '10px monospace';
            ctx.fillText('[CLICK TO REPORT]', cx2, cy2 + 80);
            ctx.textAlign = 'left';
            ctx.restore();
        }

    } else if (state.currentScene === 'counting-area') {
        if (images.counting_area_bg) {
            ctx.drawImage(images.counting_area_bg, 0, 0, canvas.width, canvas.height);
        } else {
            // Placeholder background
            ctx.fillStyle = '#1a1a0d';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#2e2e1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#4a4535';
            ctx.fillRect(80, 160, canvas.width - 160, canvas.height - 240);
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('CONTROLLED SUBSTANCE COUNTING AREA', canvas.width / 2, 145);
            ctx.textAlign = 'left';
        }

        // Counting tray drop zone
        const ttx = CONFIG.COUNTING_TRAY_TARGET.x * canvas.width;
        const tty = CONFIG.COUNTING_TRAY_TARGET.y * canvas.height;
        ctx.save();
        ctx.fillStyle = 'rgba(212,175,55,0.12)';
        ctx.fillRect(ttx - 90, tty - 55, 180, 110);
        ctx.strokeStyle = 'rgba(212,175,55,0.8)';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(ttx - 90, tty - 55, 180, 110);
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('COUNTING TRAY', ttx, tty + 5);
        ctx.font = '10px monospace';
        ctx.fillText('DROP SUBSTANCE HERE', ttx, tty + 22);
        ctx.textAlign = 'left';
        ctx.restore();
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
    // Hide site nav/footer during training; restore on all other screens
    document.body.classList.toggle('training-active', screenId === 'training-screen');

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
    // Load task-specific data and reset task-specific flags.
    loadTaskData(state.selectedTask);

    state.startTime = Date.now();
    state.currentStep = 1;
    state.errors = 0;
    state.stepsCompleted.clear();
    state.stepsWithErrors.clear();

    const activeMode = document.querySelector('.mode-btn.active');
    state.trainingMode = activeMode ? activeMode.dataset.mode : 'instructional';
    state.evaluationToolOrder = shuffleArray(Object.keys(TOOLS));

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

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function logError() {
    state.errors++;
    state.stepsWithErrors.add(state.currentStep);
}

// ===== UI UPDATES =====
function updateUI() {
    const stepInfo = STEPS[state.currentStep];
    document.getElementById('step-title').textContent =
        state.trainingMode === 'evaluation'
            ? `STEP ${state.currentStep} / ${state.totalSteps}`
            : stepInfo.title;
    const instrEl = document.getElementById('step-instruction');
    instrEl.style.display = state.trainingMode === 'evaluation' ? 'none' : '';
    instrEl.textContent = stepInfo.instruction;
    
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
        } else if (stepNum === state.currentStep && state.trainingMode !== 'evaluation') {
            item.classList.add('current');
        }
        const stepNameEl = item.querySelector('.step-name');
        if (stepNameEl && STEPS[stepNum]) {
            stepNameEl.textContent = state.trainingMode === 'evaluation'
                ? `PERFORMANCE MEASURE ${stepNum}`
                : STEPS[stepNum].title;
        }
    });

    updateToolsPanel();

    // Step-specific scene setup (68W only)
    if (state.selectedTask === '081-68W-0237' && state.currentStep === 4) {
        setupStep4SharpsScene();
    }
}

function updateToolsPanel() {
    const container = document.getElementById('tools-container');
    container.innerHTML = '';

    const toolKeys = state.trainingMode === 'evaluation'
        ? state.evaluationToolOrder
        : (STEPS[state.currentStep].requiredTools || []);

    if (toolKeys.length === 0) {
        container.innerHTML = '<p style="color: #a0aec0; text-align: center; padding: 20px;">No tools required for this step</p>';
        return;
    }

    toolKeys.forEach(toolKey => {
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

        const dragHint = document.createElement('div');
        dragHint.className = 'tool-drag-hint';
        dragHint.textContent = IS_COARSE_POINTER ? 'HOLD & DRAG' : 'DRAG TO SCENE';

        toolDiv.appendChild(img);
        toolDiv.appendChild(name);
        toolDiv.appendChild(dragHint);
        container.appendChild(toolDiv);
        
        toolDiv.addEventListener('pointerdown', startDrag, { passive: false });
    });
}

function showFeedback(message, type = 'info') {
    const feedbackEl = document.getElementById('feedback-message');
    feedbackEl.textContent = message;
    feedbackEl.className = 'feedback-overlay ' + type;
    feedbackEl.classList.remove('hidden');

    // 2D — Errors stay longer so users can read why they failed
    const duration = type === 'error' ? 3500 : CONFIG.FEEDBACK_DURATION;
    if (state.feedbackTimer) clearTimeout(state.feedbackTimer);
    state.feedbackTimer = setTimeout(() => {
        feedbackEl.classList.add('hidden');
    }, duration);
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

    const evalFailed = state.trainingMode === 'evaluation' && state.errors > 0;

    // Toggle banner
    const banner = document.getElementById('debrief-banner');
    const resultIcon = document.getElementById('debrief-result-icon');
    const resultTitle = document.getElementById('debrief-result-title');
    if (evalFailed) {
        banner.classList.add('fail');
        resultIcon.textContent = '✗';
        resultTitle.textContent = 'PERFORMANCE EVALUATION: NOT PASSED';
    } else {
        banner.classList.remove('fail');
        resultIcon.textContent = '✓';
        resultTitle.textContent = 'SIMULATION COMPLETE';
    }

    // Hide proceed button and objectives in fail state
    document.getElementById('proceed-to-test-btn').style.display = evalFailed ? 'none' : '';
    document.getElementById('debrief-objectives').style.display = evalFailed ? 'none' : '';

    // Populate and show error breakdown in fail state
    const breakdownEl = document.getElementById('debrief-error-breakdown');
    if (evalFailed) {
        const stepNums = [...state.stepsWithErrors].sort((a, b) => a - b);
        const items = stepNums.map(n => {
            const g = STEPS[n].remedialGuidance;
            return `<div class="error-step-item">
                <div class="error-step-label">⚠ PERFORMANCE MEASURE ${n}: ${g.title}</div>
                <div class="error-step-desc">${g.description}</div>
            </div>`;
        }).join('');
        breakdownEl.innerHTML = `<div class="error-breakdown-title">AREAS REQUIRING REMEDIATION</div>${items}`;
        breakdownEl.style.display = '';
    } else {
        breakdownEl.style.display = 'none';
    }

    // Populate debrief content from registry
    const taskData = TASK_REGISTRY[TASK_NUMBER];
    if (taskData) {
        const objList = document.getElementById('debrief-objectives-list');
        if (objList && taskData.debriefObjectives) {
            objList.innerHTML = taskData.debriefObjectives
                .map(o => `<div class="objective-achieved">✅ ${o}</div>`)
                .join('');
        }
        const titleEl = document.getElementById('debrief-task-title');
        if (titleEl) titleEl.innerHTML = `<strong>Task ${TASK_NUMBER}: ${taskData.name}</strong>`;
        const descEl = document.getElementById('debrief-task-desc');
        if (descEl && taskData.taskSummary) descEl.textContent = taskData.taskSummary;
        const kpList = document.getElementById('debrief-key-points-list');
        if (kpList && taskData.keyPoints) {
            kpList.innerHTML = taskData.keyPoints.map(p => `<li>${p}</li>`).join('');
        }
    }

    showScreen('debrief-screen');
}
// ===== DRAG GUARDS (prevents "instant drop" on some enterprise builds) =====
const DRAG_START_THRESHOLD_PX = IS_COARSE_POINTER ? 14 : 8; // movement required before we consider it a real drag

const dragGuard = {
  isDragging: false,
  startedOnTool: false,
  hasMoved: false,
  startClientX: 0,
  startClientY: 0,
  lastClientX: 0,
  lastClientY: 0,

  // Tool-panel "pending drag" (we don't create a draggedItem until user moves enough)
  pendingToolKey: null,
  pendingToolDiv: null,
  pendingScaleFactor: 0.3,

  // Suppress the synthetic click some browsers fire after a drag
  suppressNextClick: false
};

// Capture-phase click suppressor: prevents "click" from firing after a drag on some mouse builds.
// This is intentionally global so tool buttons and the canvas don't accidentally treat a drag as a click.
document.addEventListener('click', (e) => {
  if (dragGuard.suppressNextClick) {
    e.preventDefault();
    e.stopPropagation();
    dragGuard.suppressNextClick = false;
  }
}, true);


function isPointInCanvasFromClient(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function clampCanvasPoint(pt) {
  return {
    x: Math.max(0, Math.min(canvas.width, pt.x)),
    y: Math.max(0, Math.min(canvas.height, pt.y))
  };
}
// ===== DRAG & DROP =====
function startDrag(e) {
  // NOTE: For mouse users, some enterprise builds will generate an immediate click/drag combo.
  // We treat pointerdown as "intent" only and only create a dragged item after the user moves
  // past DRAG_START_THRESHOLD_PX. This prevents instant validation / instant-use behavior.
  e.preventDefault();
  e.stopPropagation();

  const toolDiv = e.currentTarget;
  const toolKey = toolDiv.dataset.toolKey;
  const tool = TOOLS[toolKey];
  if (!tool) return;

  // Record drag intent + baseline pointer position
  dragGuard.isDragging = true;
  dragGuard.startedOnTool = true;
  dragGuard.hasMoved = false;
  dragGuard.startClientX = e.clientX;
  dragGuard.startClientY = e.clientY;
  dragGuard.lastClientX = e.clientX;
  dragGuard.lastClientY = e.clientY;

  // Store pending tool info; we won't instantiate state.draggedItem until the user actually moves.
  dragGuard.pendingToolKey = toolKey;
  dragGuard.pendingToolDiv = toolDiv;

  // Capture pointer so drag continues reliably
  toolDiv.setPointerCapture?.(e.pointerId);

  // Lock page scrolling for the entire drag gesture
  document.body.style.overflow = 'hidden';

  document.addEventListener('pointermove', drag, { passive: false });
  document.addEventListener('pointerup', endDrag, { passive: false });
  document.addEventListener('pointercancel', endDrag, { passive: false });
}

// Start dragging a scene-only item (e.g., Step 4 stylet) by clicking it on the canvas.
function startSceneDrag(sceneItem, startX, startY, pointerId) {
  if (!sceneItem) return;

  dragGuard.isDragging = true;
  dragGuard.startedOnTool = false;
  dragGuard.hasMoved = false;
  dragGuard.startClientX = startX; // not used for canvas items, but keep consistent
  dragGuard.startClientY = startY;
  dragGuard.lastClientX = startX;
  dragGuard.lastClientY = startY;

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

  // Lock page scrolling for the entire drag gesture
  document.body.style.overflow = 'hidden';

  document.addEventListener('pointermove', drag, { passive: false });
  document.addEventListener('pointerup', endDrag, { passive: false });
  document.addEventListener('pointercancel', endDrag, { passive: false });

  renderScene();
}

function drag(e) {
  e.preventDefault();

  // Update movement tracking first
  dragGuard.lastClientX = e.clientX;
  dragGuard.lastClientY = e.clientY;

  const dx = e.clientX - dragGuard.startClientX;
  const dy = e.clientY - dragGuard.startClientY;

  // Only consider this a real drag after crossing the threshold
  if (!dragGuard.hasMoved && (dx * dx + dy * dy) >= (DRAG_START_THRESHOLD_PX * DRAG_START_THRESHOLD_PX)) {
    dragGuard.hasMoved = true;

    // Scroll canvas into view so user can see where they are dropping
    canvas.scrollIntoView({ block: 'center', behavior: 'smooth' });

    // If this drag started from a tool in the panel, instantiate the dragged item now
    if (dragGuard.startedOnTool && !state.draggedItem && dragGuard.pendingToolKey) {
      const toolKey = dragGuard.pendingToolKey;
      const tool = TOOLS[toolKey];
      if (tool) {
        const pt = clampCanvasPoint(getCanvasPointFromEvent(e));
        const scaleFactor = dragGuard.pendingScaleFactor ?? 0.3;

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
      }
    }
  }

  // If we still don't have an active dragged item, do nothing (intent-only, no-ops until threshold)
  if (!state.draggedItem) return;


  const pt = clampCanvasPoint(getCanvasPointFromEvent(e));
  state.draggedItem.x = pt.x;
  state.draggedItem.y = pt.y;

  renderScene();
}

function endDrag(e) {
  // End of drag for both "active" drags and "pending" drags that never crossed the threshold
  if (!dragGuard.isDragging && !state.draggedItem) return;
  e.preventDefault();
  const wasRealDrag = !!dragGuard.hasMoved;

  canvas.classList.remove('dragging');

  document.removeEventListener('pointermove', drag);
  document.removeEventListener('pointerup', endDrag);
  document.removeEventListener('pointercancel', endDrag);

  // Also remove any legacy mouse listeners (safe no-ops)
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', endDrag);

  // Restore scroll
  document.body.style.overflow = '';

  // HARD GUARDS:
  // 1) If the pointer never actually moved, treat as "cancel" (prevents instant validation on clicky enterprise builds).
  // 2) If the pointer-up happened outside the canvas, treat as "cancel" (user didn’t drop on work area).
  const droppedOverCanvas = isPointInCanvasFromClient(e.clientX, e.clientY);

  if (!dragGuard.hasMoved || !droppedOverCanvas) {
    // If this was a scene item (Step 4 stylet), put it back so they can try again.
    if (state.draggedItem && state.draggedItem._fromScene && state.currentStep === 4 && !state.styletDisposed) {
      setupStep4SharpsScene();
    }

    // Clear state without validating
    dragGuard.suppressNextClick = wasRealDrag;
    state.draggedItem = null;
    dragGuard.isDragging = false;
    dragGuard.startedOnTool = false;
    dragGuard.hasMoved = false;
    dragGuard.pendingToolKey = null;
    dragGuard.pendingToolDiv = null;

    renderScene();
    return;
  }

  // Only validate on a real drop over canvas
  validateDrop(state.draggedItem);

  dragGuard.suppressNextClick = wasRealDrag;
  state.draggedItem = null;
  dragGuard.isDragging = false;
  dragGuard.startedOnTool = false;
  dragGuard.hasMoved = false;

  renderScene();
}

// ===== VALIDATION =====
function validateDrop(item) {
    const validator = state.activeValidators[state.currentStep];
    if (validator) validator(item);
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
            logError();
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
            logError();
        }
    } else {
        showFeedback('Use gloves and eye protection for BSI', 'error');
        logError();
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
        logError();
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
        logError();
    }
}

function validateDriverInsertion(item) {
    if (item.type !== 'io_driver') {
        showFeedback('Use the EZ-IO driver', 'error');
        logError();
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
            logError();
        }
    } else {
        showFeedback('Position the needle tip over the insertion site. Use Q/E to rotate.', 'error');
        logError();
    }
}

function validateExtensionSet(item) {
    if (item.type !== 'extension_set') {
        showFeedback('Attach the extension set', 'error');
        logError();
        return;
    }
    
    if (!state.driverInserted) {
        showFeedback('Complete driver insertion first', 'error');
        logError();
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
        logError();
    }
}

function validateSyringe(item) {
    if (item.type !== 'syringe') {
        showFeedback('Attach the saline syringe', 'error');
        logError();
        return;
    }
    
    if (!state.extensionAttached) {
        showFeedback('Attach extension set first', 'error');
        logError();
        return;
    }
    
    // Find the snapped extension set and compute the BLUE port location.
    const ext = state.permanentItems.find(it => it.imageKey === 'extension_set');
    if (!ext) {
        showFeedback('Attach extension set first', 'error');
        logError();
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
        logError();
    }
}

function validateFlush(item) {
    if (item.type !== 'plunger') {
        showFeedback('Use the plunger to flush', 'error');
        logError();
        return;
    }
    
    if (!state.syringeAttached) {
        showFeedback('Attach syringe first', 'error');
        logError();
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
        logError();
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
        logError();
    }
}

function validateSharpsDisposal(item) {
    // Step 4: Drag the stylet into the sharps container (both are present in the scene)
    if (item.type !== 'stylet') {
        showFeedback('Drag the stylet into the sharps container', 'error');
        logError();
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
        logError();
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
        logError();
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
        logError();
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

    // 5B — carry task context forward to test screen
    const testTaskNum = document.getElementById('test-task-number');
    if (testTaskNum && state.selectedTask) testTaskNum.textContent = state.selectedTask;

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
    // Wire the start button first so the intro screen is never "dead" even if
    // something else fails to initialize.
    const startBtn = document.getElementById('start-training-btn');
    if (startBtn) startBtn.addEventListener('click', startTraining);

    // Platform navigation (Welcome -> MOS -> Task Catalog -> Task Overview)
    const goMosBtn = document.getElementById('go-mos-btn');
    if (goMosBtn) goMosBtn.addEventListener('click', () => {
        renderMosGrid();
        showScreen('mos-screen');
    });

    const mosBackBtn = document.getElementById('mos-back-btn');
    if (mosBackBtn) mosBackBtn.addEventListener('click', () => showScreen('welcome-screen'));

    const taskBackBtn = document.getElementById('task-back-btn');
    if (taskBackBtn) taskBackBtn.addEventListener('click', () => showScreen('mos-screen'));

    // Initial render for MOS screen if user lands there (e.g., via reload)
    renderMosGrid();

    // Initialize canvas + preload images (guarded so a missing element doesn't
    // kill all event wiring).
    try {
        initCanvas();
        loadImages();
    } catch (err) {
        console.error('Initialization error:', err);
    }

    // Canvas pointerup: tap handler for click-based steps
    if (canvas) canvas.addEventListener('pointerup', (e) => {
        if (state.currentScreen !== 'training-screen') return;

        // 68W: Step 9 — IO site assessment
        if (state.selectedTask === '081-68W-0237' && state.currentStep === 9) {
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
                logError();
                updateUI();
            }
            return;
        }

        // 68Q: Click-based steps 6, 7, 9
        if (state.selectedTask === '081-68Q-0034' && [6, 7, 9].includes(state.currentStep)) {
            if (dragGuard.suppressNextClick) return;
            e.preventDefault();
            const pt = getCanvasPointFromEvent(e);
            handlePharmacyClick(pt);
        }
    }, { passive: false });

    // Canvas pointerdown: allow dragging of scene-only items (Step 4 stylet)
    if (canvas) canvas.addEventListener('pointerdown', (e) => {
        if (state.currentScreen !== 'training-screen') return;
        if (state.currentStep !== 4) return;
        if (state.draggedItem) return;

        // Prevent the page from scrolling/zooming when starting a drag on mobile
        e.preventDefault();
        e.stopPropagation();

        const pt = getCanvasPointFromEvent(e);
        const x = pt.x;
        const y = pt.y;

        // Find any draggable scene item under the pointer (currently only the stylet)
        const hitPad = tol(28); // forgiving hit box on phones/tablets
        const sceneItem = state.permanentItems
            .filter(it => it.onlyStep === 4 && it.sceneDraggable)
            .find(it => {
                const left = it.x - it.width / 2 - hitPad;
                const top = it.y - it.height / 2 - hitPad;
                const right = it.x + it.width / 2 + hitPad;
                const bottom = it.y + it.height / 2 + hitPad;
                return (x >= left && x <= right && y >= top && y <= bottom);
            });

        if (!sceneItem) return;

        canvas.setPointerCapture?.(e.pointerId);
        startSceneDrag(sceneItem, x, y, e.pointerId);
    }, { passive: false });
    
    // Intro screen back button
    const introBackBtn = document.getElementById('intro-back-btn');
    if (introBackBtn) introBackBtn.addEventListener('click', () => showScreen('task-screen'));

    // Mode selector toggle
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Training screen quit button
    const quitTrainingBtn = document.getElementById('quit-training-btn');
    if (quitTrainingBtn) quitTrainingBtn.addEventListener('click', () => showScreen('intro-screen'));

    // Debrief screen
    const debriefRestartBtn = document.getElementById('debrief-restart-btn');
    if (debriefRestartBtn) debriefRestartBtn.addEventListener('click', () => showScreen('intro-screen'));

    document.getElementById('proceed-to-test-btn').addEventListener('click', initTest);
    
    // Test screen
    document.getElementById('quit-test-btn').addEventListener('click', () => showScreen('debrief-screen'));
    document.getElementById('prev-question-btn').addEventListener('click', prevQuestion);
    document.getElementById('next-question-btn').addEventListener('click', nextQuestion);
    document.getElementById('submit-test-btn').addEventListener('click', submitTest);
    
    // Test results
    document.getElementById('start-remedial-btn').addEventListener('click', startRemedialTraining);
    document.getElementById('proceed-to-congratulations-btn').addEventListener('click', () => showScreen('congratulations-screen'));
    
    // Remedial
    document.getElementById('complete-remedial-btn').addEventListener('click', completeRemedial);
    
    // Congratulations
    document.getElementById('restart-from-congratulations-btn').addEventListener('click', () => {
        location.reload();
    });

    const selectNewTaskBtn = document.getElementById('select-new-task-btn');
    if (selectNewTaskBtn) selectNewTaskBtn.addEventListener('click', () => showScreen('mos-screen'));
    
    // Debug
    document.getElementById('show-hotspots').addEventListener('change', (e) => {
        state.showHotspots = e.target.checked;
        renderScene();
    });
    
    document.getElementById('skip-step-btn').addEventListener('click', () => {
        advanceStep();
    });
    
    // Default selected task (proof of concept)
    setIntroTask('081-68W-0237', 'Place an Intraosseous Device');

    // Site nav links
    document.getElementById('nav-home-link').addEventListener('click', () => showScreen('welcome-screen'));
    document.getElementById('nav-link-home').addEventListener('click', () => showScreen('welcome-screen'));
    document.getElementById('nav-link-modules').addEventListener('click', () => showScreen('mos-screen'));

    // Debug panel toggle
    document.addEventListener('keydown', (e) => {
        if (e.key === 'd' || e.key === 'D') {
            if (!e.ctrlKey && !e.metaKey) {
                document.getElementById('debug-panel').classList.toggle('hidden');
            }
        }
    });
});
