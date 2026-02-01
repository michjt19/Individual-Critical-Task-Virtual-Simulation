# EZ-IO Humeral Insertion Training Simulation
### Task 081-68W-0237: Place an Intraosseous Device

## Overview

This is an interactive, browser-based training simulation for Army Combat Medics (68W) to practice EZ-IO humeral insertion procedures. This tool provides validated virtual training to supplement hands-on practice between live validations.

**Authoritative Standard:** STP 8-68W13-SM-TG, 06 March 2025

## Features

- ✅ **Realistic validation** - Drag-and-drop with position, angle, and sequence validation
- ✅ **Step-by-step progression** - Follows official task performance steps
- ✅ **GO/NO-GO tracking** - Automatically scores based on Army standards
- ✅ **Visual feedback** - Clear instructions and error messages
- ✅ **Performance metrics** - Tracks completion time and errors
- ✅ **Offline capable** - Runs entirely in browser, no internet required

## Quick Start

### 1. File Structure

Place all files in the same folder:

```
training-folder/
├── index.html
├── styles.css
├── script.js
├── patient_front.png (500×500)
├── target_humeral.png (561×445)
├── io_driver.png (500×500)
├── io_hub.png (225×225)
├── syringe.png (723×345)
├── plunger.png (334×150)
├── eye_pro.png (500×500)
├── gloves.png (275×183)
├── alcohol_pad.png (225×225)
├── sharps.png (480×480)
├── extension_set.png (201×231)
├── sf600.png (770×1024)
└── io_dressing.png (500×500)
```

### 2. Run the Simulation

Simply **double-click `index.html`** or open it in Chrome/Firefox/Safari.

That's it! No server, no installation needed.

## How to Use

### Basic Controls

1. **Read the instruction** at the top of each step
2. **Drag tools** from the right panel onto the patient/site
3. **Position accurately** - the simulation validates placement
4. **For the driver step:** Use **Q** and **E** keys to rotate the driver
5. **Debug mode:** Press **D** to toggle debug controls (shows hotspots and needle tip)

### Training Steps

The simulation follows the official 10-step EZ-IO humeral workflow:

1. **Don BSI Equipment** - Drag gloves and eye protection to PPE zone
2. **Clean Insertion Site** - Use alcohol pad on humeral site
3. **Insert EZ-IO Driver** - Position at 90° angle, hit the target
4. **Remove Driver/Stylet** - Automatic step (hub remains)
5. **Attach Extension Set** - Connect to IO hub
6. **Attach Syringe** - Connect saline syringe to extension set
7. **Flush Catheter** - Drag plunger to simulate 5-10mL flush
8. **Apply Dressing** - Secure catheter with dressing
9. **Dispose of Sharps** - Use sharps container (never recap!)
10. **Document Procedure** - Complete SF 600 form

### Performance Assessment

At completion, you'll see:
- **Steps completed** (must be 10/10)
- **Error count** (0 for GO rating)
- **Time elapsed**
- **Final rating:** GO or NO-GO

## Calibration Guide

If you need to adjust hit detection for your specific images, edit the `CONFIG` section in `script.js`:

```javascript
const CONFIG = {
    // Humeral target center (as fraction of canvas)
    HUMERAL_CENTER: { x: 0.48, y: 0.50 },
    
    // Where the needle tip is on the driver image
    DRIVER_TIP_OFFSET: { x: 0.94, y: 0.10 },
    
    // Syringe tip position
    SYRINGE_TIP_OFFSET: { x: 0.08, y: 0.52 },
    
    // How close items must be (in pixels)
    HIT_TOLERANCE: 40,
    
    // Angle tolerance for driver (degrees from vertical)
    ANGLE_TOLERANCE: 15,
};
```

### Calibration Process

1. Press **D** to open debug panel
2. Check **"Show Hotspots"** to see the target zone
3. Check **"Show Needle Tip"** when dragging the driver
4. Adjust `HUMERAL_CENTER` to move the target
5. Adjust `DRIVER_TIP_OFFSET` to calibrate where the needle tip is on your image
6. Adjust `HIT_TOLERANCE` to make validation easier/harder

## Image Requirements

### Required Images

All images should be PNG format with transparent backgrounds where appropriate:

- **patient_front.png** - Full body view for BSI step
- **target_humeral.png** - Close-up of humeral insertion site
- **io_driver.png** - EZ-IO power driver with needle
- **io_hub.png** - Catheter hub (appears after driver removed)
- **syringe.png** - Saline-filled syringe
- **plunger.png** - Syringe plunger
- **Tools:** eye_pro, gloves, alcohol_pad, extension_set, io_dressing, sharps, sf600

### Image Tips

- **Transparent backgrounds** work best for tools
- **High contrast** helps with visibility
- **Consistent scale** - driver should be proportional to site
- **Clear needle tip** on driver image for accurate validation

## Technical Notes

### Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ❌ Internet Explorer (not supported)

### Performance

- Runs smoothly on any modern computer
- No internet connection required after initial load
- All processing happens locally (no data sent anywhere)

### Customization

You can modify:
- **Step instructions** - Edit `STEPS` object in `script.js`
- **Validation strictness** - Adjust `CONFIG` tolerances
- **Visual styling** - Modify `styles.css`
- **Add audio cues** - Add sound effects for feedback

## Training Integration

### Recommended Use

- **Supplemental training** between hands-on validations
- **Refresher** before live practice
- **Self-assessment** for medics preparing for validation
- **NOT a replacement** for hands-on training with actual equipment

### Instructor Mode

- Press **D** for debug panel
- Use **"Skip Current Step"** to demonstrate specific procedures
- Review performance summary with students after completion

## Scope & Limitations

### Current Version (v1.0)

- ✅ EZ-IO humeral site (Steps 1-18 from task publication)
- ❌ FAST1 sternal placement (Steps 19-28) - deferred to future version
- ❌ Tibial sites - not implemented

### Known Limitations

- Simplified flush mechanism (doesn't simulate actual pressure/resistance)
- No real-time patient monitoring simulation
- Static patient (doesn't move/react)

## Troubleshooting

### Images not loading
- Ensure all PNG files are in the same folder as index.html
- Check that filenames match exactly (case-sensitive)
- Open browser console (F12) to see specific errors

### Drag-and-drop not working
- Make sure you're clicking inside the tool boxes
- Try refreshing the page
- Check that JavaScript is enabled in your browser

### Validation too strict/lenient
- Press **D** and enable "Show Hotspots" to see target zones
- Adjust `HIT_TOLERANCE` in script.js (higher = easier)

### Driver angle validation failing
- Press **D** and enable "Show Needle Tip"
- Use Q/E keys to rotate precisely
- Adjust `ANGLE_TOLERANCE` if needed

## Future Enhancements

Potential additions for future versions:
- FAST1 sternal insertion pathway
- Tibial insertion sites
- Complication scenarios (infiltration, bone resistance)
- Multiplayer mode for peer training
- Voice commands
- VR/AR integration
- Integration with Army training management systems

## Credits

**Developed for:** U.S. Army Combat Medic Training  
**Task Authority:** STP 8-68W13-SM-TG  
**Standards:** PHTLS and TCCC Guidelines  

## License & Usage

This simulation is intended for U.S. Army training use. Ensure compliance with local training SOPs and medical oversight requirements.

**Medical Disclaimer:** This is a training simulation only. Always follow current TCCC guidelines, medical direction, and unit SOPs in actual patient care situations.

---

## Contact & Feedback

For issues, improvements, or questions about this simulation, contact your unit training NCO or medical training department.

**Version:** 1.0  
**Last Updated:** January 2026
