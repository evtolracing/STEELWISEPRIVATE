# Phase 17: Plastics vs Metals Processing & BOM Differences

**Document Version:** 1.0  
**Date:** January 17, 2026  
**Status:** Manufacturing Engineering Specification

---

## 1. EXECUTIVE SUMMARY

This document defines the key differences between metals and plastics processing within the SteelWise platform. While both material families share common workflows (receiving, cutting, fabrication, shipping), they differ significantly in tolerances, machining parameters, BOM structures, quality control, scrap handling, packaging requirements, and time estimation. Understanding these differences is critical for accurate job costing, scheduling, and quality management.

### Material Family Overview

| Aspect | Metals (STL, ALU, SPC) | Plastics (PLA) |
|--------|------------------------|----------------|
| **Primary Forms** | Sheet, plate, bar, tube, structural | Sheet, rod, tube, film |
| **Key Materials** | Carbon steel, stainless, aluminum, brass | HDPE, UHMW, acrylic, polycarbonate, nylon |
| **Thermal Sensitivity** | High melting points, heat treatment | Low melting points, thermal expansion issues |
| **Machining** | Aggressive feeds, flood coolant | Conservative feeds, air/mist cooling |
| **Tolerances** | Tighter achievable (±0.001") | Looser typical (±0.005-0.010") |
| **Scrap Value** | High (recyclable at commodity price) | Low (limited recycling value) |

---

## 2. COMPREHENSIVE DIFFERENCE MATRIX

### 2.1 Master Comparison Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          METALS VS PLASTICS: PROCESSING DIFFERENCE MATRIX                                │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  CATEGORY          │ METALS                              │ PLASTICS                                    │
│  ══════════════════│═════════════════════════════════════│═════════════════════════════════════════════│
│                                                                                                         │
│  TOLERANCES                                                                                             │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Linear (cutting)  │ ±0.030" standard, ±0.015" precision │ ±0.060" standard, ±0.030" precision         │
│  Linear (machining)│ ±0.005" standard, ±0.001" precision │ ±0.010" standard, ±0.005" precision         │
│  Flatness          │ 0.015"/ft standard                  │ 0.030"/ft standard (stress relief needed)   │
│  Squareness        │ ±0.5° standard                      │ ±1.0° standard                              │
│  Hole diameter     │ ±0.002" standard                    │ ±0.005" standard                            │
│  Surface finish    │ 125 Ra standard, 32 Ra achievable   │ 250 Ra standard, 63 Ra achievable           │
│  Repeatability     │ Excellent (stable material)         │ Fair (thermal/humidity sensitivity)         │
│                                                                                                         │
│  THERMAL PROPERTIES                                                                                     │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Expansion coeff.  │ 6-13 µin/in/°F (steel/aluminum)     │ 30-100 µin/in/°F (5-10x higher)             │
│  Melting point     │ 1,200-2,800°F                       │ 200-600°F                                   │
│  Heat dissipation  │ High thermal conductivity           │ Low thermal conductivity (heat buildup)     │
│  Ambient temp sens.│ Minimal                             │ Significant (measure in AM, machine in AM)  │
│                                                                                                         │
│  MACHINING PARAMETERS                                                                                   │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Cutting speed     │ 100-600 SFM (material dependent)    │ 200-1000 SFM (can go faster)                │
│  Feed rate         │ 0.005-0.020 IPT aggressive          │ 0.003-0.010 IPT conservative                │
│  Depth of cut      │ 0.050-0.250" roughing               │ 0.020-0.100" (avoid heat buildup)           │
│  Tool geometry     │ Neutral to positive rake            │ High positive rake (sharp edges)            │
│  Coolant           │ Flood coolant (water-soluble)       │ Air blast or mist (no flood)                │
│  Chip formation    │ Continuous/segmented chips          │ Stringy chips, melting risk                 │
│  Tool wear         │ Abrasive/adhesive wear              │ Edge buildup, melting on tool               │
│                                                                                                         │
│  SAWING PARAMETERS                                                                                      │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Blade type        │ Bi-metal, carbide-tipped            │ Skip-tooth, plastic-specific                │
│  TPI (teeth/inch)  │ 4-14 TPI based on thickness         │ 2-6 TPI (fewer teeth, bigger gullets)       │
│  Blade speed       │ 150-350 FPM (band saw)              │ 1,000-3,000 FPM (much faster)               │
│  Feed pressure     │ Medium-high                         │ Light (prevent melting/chipping)            │
│  Coolant           │ Required (flood or mist)            │ None or air only                            │
│                                                                                                         │
│  LASER/PLASMA CUTTING                                                                                   │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Laser cutting     │ CO2 or fiber laser, O2/N2 assist    │ CO2 laser preferred, air assist             │
│  Max thickness     │ 1" steel, 0.5" aluminum             │ 0.5" acrylic, 0.25" HDPE                    │
│  Edge quality      │ Excellent, minimal HAZ              │ Good but melted edge, polishing may needed  │
│  Fume extraction   │ Metal fume extraction               │ Critical (toxic fumes from some plastics)   │
│  Fire risk         │ Low                                 │ High (flammable materials)                  │
│                                                                                                         │
│  DRILLING/BORING                                                                                        │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Point angle       │ 118° standard, 135° for harder      │ 60-90° (prevents grabbing)                  │
│  Helix angle       │ 30° standard                        │ 15-20° (slow helix for chip clearance)      │
│  Peck drilling     │ Optional for deep holes             │ Required (chip clearing, heat prevention)   │
│  Speeds            │ Standard HSS/carbide speeds         │ 2-3x faster than metals                     │
│  Breakout support  │ Optional                            │ Required (prevent chipping/cracking)        │
│                                                                                                         │
│  BENDING/FORMING                                                                                        │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Cold forming      │ Standard for most metals            │ Limited (many plastics crack)               │
│  Hot forming       │ Heat treatment, annealing           │ Required for most bends (heat guns, ovens)  │
│  Bend radius       │ Tight bends possible (1-2x thick)   │ Large radius required (5-10x thickness)     │
│  Springback        │ 1-3° typical, predictable           │ Variable, material-dependent                │
│  Stress relief     │ Optional post-forming               │ Often required (annealing)                  │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 QC & Inspection Differences

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          QUALITY CONTROL DIFFERENCES                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  QC ASPECT         │ METALS                              │ PLASTICS                                    │
│  ══════════════════│═════════════════════════════════════│═════════════════════════════════════════════│
│                                                                                                         │
│  INCOMING INSPECTION                                                                                    │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Certification     │ MTR required (chemistry, mechanicals)│ COC/COA typical (manufacturer cert)        │
│  Traceability      │ Heat number mandatory               │ Lot number (less stringent)                 │
│  Visual inspection │ Surface defects, mill scale         │ Color, clarity, inclusions, UV damage       │
│  Dimensional       │ Thickness, width, length            │ Same + flatness (warping common)            │
│  Hardness test     │ Common (Rockwell, Brinell)          │ Shore D durometer                           │
│                                                                                                         │
│  IN-PROCESS INSPECTION                                                                                  │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  First piece       │ Dimensional check, go/no-go         │ Dimensional + visual (melting, chipping)    │
│  Frequency         │ Per setup or per 25-50 pieces       │ More frequent (1:10 due to variability)     │
│  Measurements      │ Calipers, micrometers, CMM          │ Same + optical comparators (soft material)  │
│  Surface checks    │ Profilometer, visual                │ Visual for crazing, stress marks            │
│  Temperature       │ Not typically monitored             │ Monitor part temp (dimensional stability)   │
│                                                                                                         │
│  FINAL INSPECTION                                                                                       │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Sampling plan     │ AQL 1.0-2.5 typical                 │ AQL 2.5-4.0 (looser due to variability)     │
│  Critical dims     │ 100% inspection                     │ 100% inspection + visual                    │
│  Documentation     │ Inspection report, MTR traceback    │ Inspection report, lot traceback            │
│  Defect types      │ Dimensional, burrs, scratches       │ Cracks, chips, melting, stress whitening    │
│                                                                                                         │
│  SPECIAL TESTS                                                                                          │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Mechanical tests  │ Tensile, impact, hardness           │ Tensile, flexural, impact (Izod/Charpy)     │
│  Chemical tests    │ Spark test, spectrometer            │ FTIR, density measurement                   │
│  NDT               │ UT, MT, PT, RT                      │ Visual, UT (limited)                        │
│  Environmental     │ Corrosion testing                   │ UV exposure, chemical resistance            │
│                                                                                                         │
│  DEFECT CLASSIFICATION                                                                                  │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Critical          │ Cracks, wrong material, undersized  │ Cracks, wrong material, melting damage      │
│  Major             │ Out of tolerance, heavy burrs       │ Out of tolerance, stress whitening          │
│  Minor             │ Light scratches, minor burrs        │ Surface marks, minor chips                  │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Scrap & Waste Handling

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          SCRAP & WASTE HANDLING                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  SCRAP ASPECT      │ METALS                              │ PLASTICS                                    │
│  ══════════════════│═════════════════════════════════════│═════════════════════════════════════════════│
│                                                                                                         │
│  VALUE RECOVERY                                                                                         │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Scrap value       │ 20-50% of material cost             │ 0-10% of material cost                      │
│  Market demand     │ High (commodity scrap markets)      │ Low (limited plastic recyclers)             │
│  Segregation req.  │ By alloy/grade (critical for value) │ By resin type (often not worth it)          │
│  Example values:                                                                                        │
│    Carbon steel    │ $0.08-0.12/lb                       │ HDPE: $0.02-0.05/lb                         │
│    Aluminum        │ $0.40-0.80/lb                       │ Acrylic: $0.00 (landfill)                   │
│    Stainless 304   │ $0.50-0.80/lb                       │ Polycarbonate: $0.01-0.03/lb                │
│                                                                                                         │
│  SCRAP SEGREGATION                                                                                      │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Containers        │ Separate bins by alloy              │ Single bin (often not segregated)           │
│  Labeling          │ Required (affects scrap price)      │ Optional                                    │
│  Contamination     │ Critical (oil, mixed metals)        │ Less critical (already low value)           │
│  Pickup frequency  │ Weekly (when bin full)              │ Monthly or on-call                          │
│                                                                                                         │
│  ENVIRONMENTAL CONSIDERATIONS                                                                           │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Fumes/dust        │ Metal fumes (welding, cutting)      │ Toxic fumes (PVC, acrylic)                  │
│  Ventilation       │ Required at cutting stations        │ Critical at laser/heat stations            │
│  Disposal          │ Scrap dealer pickup                 │ Landfill or specialty recycler              │
│  Coolant disposal  │ Recycled or hazmat disposal         │ Minimal coolant used                        │
│                                                                                                         │
│  SCRAP TRACKING                                                                                         │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Tracking method   │ By work order, weight               │ By work order, weight (less precise)        │
│  Scrap rate target │ 5-15% of material (operation dep.)  │ 8-20% of material (less optimized nesting)  │
│  Recovery credit   │ Applied to job costing              │ Usually ignored (immaterial)                │
│                                                                                                         │
│  COST IMPACT MODEL                                                                                      │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│                                                                                                         │
│  METALS:                                                                                                │
│  Net Material Cost = Gross Material - (Scrap Weight × Scrap Price)                                     │
│  Example: $1,000 material - (100 lbs × $0.40/lb) = $960 net cost                                       │
│                                                                                                         │
│  PLASTICS:                                                                                              │
│  Net Material Cost = Gross Material - (Scrap Weight × ~$0)  ≈ Gross Material                           │
│  Example: $500 material - (50 lbs × $0.02/lb) = $499 net cost                                          │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Packaging Differences

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          PACKAGING REQUIREMENTS                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  PACKAGING ASPECT  │ METALS                              │ PLASTICS                                    │
│  ══════════════════│═════════════════════════════════════│═════════════════════════════════════════════│
│                                                                                                         │
│  SURFACE PROTECTION                                                                                     │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Primary concern   │ Corrosion, scratches                │ Scratches, UV damage, stress cracking       │
│  Protection method │ VCI paper, oil coating, wrap        │ PE film, foam interleave, opaque wrap       │
│  Edge protection   │ Caps or tape on sharp edges         │ Full wrap (edges chip easily)               │
│  Interleaving      │ Paper or cardboard between pieces   │ Foam or PE sheet between pieces             │
│                                                                                                         │
│  STACKING & HANDLING                                                                                    │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Stacking weight   │ High (metal supports metal)         │ Low (plastics deform under weight)          │
│  Dunnage           │ Wood (can support heavy loads)      │ Foam, cardboard (lighter loads)             │
│  Banding           │ Steel banding for heavy items       │ Plastic banding or shrink wrap              │
│  Skid design       │ Heavy-duty wood or steel skids      │ Standard wood pallets                       │
│                                                                                                         │
│  ENVIRONMENTAL PROTECTION                                                                               │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Moisture          │ Critical (rust prevention)          │ Moderate (some absorb moisture)             │
│  Temperature       │ Not critical                        │ Critical (avoid heat distortion)            │
│  UV exposure       │ Not critical                        │ Critical (degradation of many plastics)     │
│  Storage duration  │ Months with proper protection       │ Weeks without UV protection                 │
│                                                                                                         │
│  SPECIAL PACKAGING                                                                                      │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Precision parts   │ Custom foam, hard cases             │ Same + climate control                      │
│  Finished surfaces │ PE film, soft interleave            │ Double-wrap, non-abrasive only              │
│  Long parts        │ Bundled with support                │ Continuous support (no sagging)             │
│  Clear plastics    │ N/A                                 │ Leave protective film until install         │
│                                                                                                         │
│  PACKAGING COST FACTORS                                                                                 │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Material cost     │ $0.02-0.05/lb shipped               │ $0.05-0.15/lb shipped (more protection)     │
│  Labor time        │ 2-5 min per package                 │ 5-10 min per package (more careful)         │
│  Returns (damage)  │ 1-2% of shipments                   │ 2-4% of shipments (more fragile)            │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 Time Estimation Differences

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          TIME ESTIMATION DIFFERENCES                                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  OPERATION         │ METALS                              │ PLASTICS                                    │
│  ══════════════════│═════════════════════════════════════│═════════════════════════════════════════════│
│                                                                                                         │
│  SAWING (per cut)                                                                                       │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Setup time        │ 5-10 min                            │ 5-10 min                                    │
│  Cutting speed     │ 1-3 sq in/min (steel)               │ 3-8 sq in/min (faster)                      │
│  1" thick × 6" wide│ ~6 min cut time                     │ ~2 min cut time                             │
│  Deburring         │ 1-2 min per piece                   │ 0.5-1 min per piece (less burrs)            │
│                                                                                                         │
│  SHEARING (per cut)                                                                                     │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Setup time        │ 3-5 min                             │ 3-5 min                                     │
│  Cycle time        │ 5-10 sec per cut                    │ 5-10 sec per cut                            │
│  Max thickness     │ 0.25" mild steel                    │ 0.5" (but edge quality poor)                │
│  Edge quality      │ Good                                │ Poor (chipping, stress marks)               │
│                                                                                                         │
│  LASER/PLASMA CUTTING                                                                                   │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Setup time        │ 10-15 min (nesting, material load)  │ 15-20 min (+fume extraction check)          │
│  Cutting speed     │ 100-300 IPM (thickness dependent)   │ 50-150 IPM (slower to avoid melting)        │
│  Pierce time       │ 0.5-2 sec                           │ 1-3 sec (dwell to start)                    │
│  Cool-down         │ Not required                        │ 30-60 sec between parts (heat buildup)      │
│                                                                                                         │
│  DRILLING (per hole)                                                                                    │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Setup time        │ 2-5 min                             │ 2-5 min                                     │
│  Drilling time     │ 5-15 sec (0.5" hole × 0.25" thick)  │ 3-8 sec (faster but peck cycles)            │
│  Deburring         │ 5-10 sec per hole                   │ 10-15 sec per hole (both sides critical)    │
│                                                                                                         │
│  MILLING/ROUTING                                                                                        │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Setup time        │ 15-30 min                           │ 15-30 min                                   │
│  Material removal  │ 1-5 cu in/min                       │ 5-15 cu in/min (faster)                     │
│  Finishing passes  │ 1-2 passes                          │ 2-3 passes (get clean edge)                 │
│  Chip clearing     │ Coolant clears chips                │ Air blast + vacuum (chips stick)            │
│                                                                                                         │
│  BENDING (per bend)                                                                                     │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Setup time        │ 5-10 min per setup                  │ 10-20 min (includes heating setup)          │
│  Bend cycle        │ 10-30 sec per bend                  │ 30-120 sec per bend (heating time)          │
│  Springback adj.   │ 2-3 trial bends                     │ 5-8 trial bends (less predictable)          │
│  Cooling           │ Not required                        │ 30-60 sec hold in bent position             │
│                                                                                                         │
│  WELDING/JOINING                                                                                        │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Setup time        │ 5-15 min                            │ 10-20 min (surface prep critical)           │
│  Weld/bond time    │ 3-6 in/min (MIG/TIG)               │ 1-2 in/min (solvent/adhesive bonding)       │
│  Cure time         │ Immediate (cooling)                 │ 4-24 hours (adhesive cure)                  │
│  Post-process      │ Grinding, cleaning: 5-15 min        │ Minimal: 2-5 min                            │
│                                                                                                         │
│  TIME ESTIMATION FACTORS                                                                                │
│  ══════════════════│═════════════════════════════════════│═════════════════════════════════════════════│
│  Variability       │ ±15% typical                        │ ±25% typical (more variables)               │
│  Learning curve    │ Faster stabilization                │ Longer to master parameters                 │
│  Temperature adj.  │ Not required                        │ Add 5-10% in summer (heat issues)           │
│  Contingency       │ 10% buffer                          │ 15-20% buffer                               │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. BOM STRUCTURE DIFFERENCES

### 3.1 BOM Component Comparison

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                          BOM STRUCTURE: METALS VS PLASTICS                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  BOM ELEMENT       │ METALS                              │ PLASTICS                                    │
│  ══════════════════│═════════════════════════════════════│═════════════════════════════════════════════│
│                                                                                                         │
│  MATERIAL SPECIFICATION                                                                                 │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Primary spec      │ ASTM/AISI/SAE grade (A36, 304, 6061)│ Resin type + trade name                     │
│  Examples          │ ASTM A36, AISI 304, SAE 1018        │ UHMW-PE, Acrylic (Plexiglas), Delrin        │
│  Condition/Temper  │ Hot-rolled, cold-rolled, T6, etc.   │ Extruded, cast, FDA-grade, UV-stabilized    │
│  Certification     │ MTR required (heat number)          │ COC/COA (lot number)                        │
│  Alternates        │ Tightly controlled (mech. props)    │ More flexible (visual/functional)           │
│                                                                                                         │
│  DIMENSIONAL SPECIFICATION                                                                              │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Stock tolerance   │ Per ASTM/mill standard              │ Per manufacturer (wider tolerances)         │
│  Overbuy %         │ 5-10% for cutting kerf              │ 10-15% (more waste in nesting)              │
│  Min order qty     │ Often 1 piece or by weight          │ Often by sheet/bar (full units)             │
│                                                                                                         │
│  CONSUMABLES                                                                                            │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Cutting           │ Blades, plasma tips, laser lenses   │ Blades (specialized), router bits           │
│  Drilling          │ HSS/carbide drills, reamers         │ Plastic-specific drills (less wear)         │
│  Coolants          │ Water-soluble, straight oil         │ None or air only                            │
│  Welding/joining   │ Wire, gas, flux, electrodes         │ Solvents, adhesives, welding rod            │
│  Finishing         │ Grinding wheels, belts, paint       │ Polishing compounds, plastic polish         │
│                                                                                                         │
│  HARDWARE                                                                                               │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Fasteners         │ Standard hardware (bolts, nuts)     │ Plastic fasteners or inserts required       │
│  Inserts           │ Weld nuts, PEM fasteners            │ Threaded inserts (heat-set or press-fit)    │
│  Compatibility     │ Any plated/coated fastener          │ Check chemical compatibility                │
│                                                                                                         │
│  PACKAGING                                                                                              │
│  ──────────────────│─────────────────────────────────────│─────────────────────────────────────────────│
│  Materials         │ VCI paper, steel banding            │ PE film, foam, opaque wrap                  │
│  Skids/pallets     │ Heavy-duty (included in BOM?)       │ Standard (usually not in BOM)               │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Example BOM Comparison

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  EXAMPLE: BRACKET FABRICATION                                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                         │
│  METAL BRACKET BOM (Steel)                       │  PLASTIC BRACKET BOM (HDPE)                         │
│  ════════════════════════════════════════════════│══════════════════════════════════════════════════════│
│                                                                                                         │
│  MATERIAL:                                       │  MATERIAL:                                          │
│  ┌─────────────────────────────────────────────┐ │  ┌─────────────────────────────────────────────────┐│
│  │ Line │ Item           │ Qty    │ UOM       │ │  │ Line │ Item           │ Qty    │ UOM       │    ││
│  │──────│────────────────│────────│───────────│ │  │──────│────────────────│────────│───────────│    ││
│  │  1   │ A36 Plate      │ 2.5    │ LB        │ │  │  1   │ HDPE Sheet     │ 1.8    │ LB        │    ││
│  │      │ 0.25" × 4" × 6"│        │           │ │  │      │ 0.5" × 5" × 7" │        │           │    ││
│  │      │ MTR Required   │        │           │ │  │      │ Natural color  │        │           │    ││
│  └─────────────────────────────────────────────┘ │  │      │ FDA grade      │        │           │    ││
│                                                  │  └─────────────────────────────────────────────────┘│
│  CONSUMABLES:                                    │                                                      │
│  ┌─────────────────────────────────────────────┐ │  CONSUMABLES:                                       │
│  │  2   │ Saw blade      │ 0.01   │ EA (alloc)│ │  ┌─────────────────────────────────────────────────┐│
│  │  3   │ Drill bit 3/8" │ 0.02   │ EA (alloc)│ │  │  2   │ Router bit 1/4"│ 0.01   │ EA (alloc)│    ││
│  │  4   │ Grinding wheel │ 0.01   │ EA (alloc)│ │  │  3   │ Drill bit 3/8" │ 0.01   │ EA (alloc)│    ││
│  │  5   │ Coolant        │ 0.05   │ GAL       │ │  │      │ Plastic-spec.  │        │           │    ││
│  │  6   │ Weld wire ER70 │ 0.10   │ LB        │ │  └─────────────────────────────────────────────────┘│
│  │  7   │ Shielding gas  │ 5      │ CF        │ │                                                      │
│  └─────────────────────────────────────────────┘ │  HARDWARE:                                          │
│                                                  │  ┌─────────────────────────────────────────────────┐│
│  HARDWARE:                                       │  │  4   │ SS Insert 3/8" │ 4      │ EA        │    ││
│  ┌─────────────────────────────────────────────┐ │  │      │ Heat-set type  │        │           │    ││
│  │  8   │ Bolt 3/8-16×1" │ 4      │ EA        │ │  │  5   │ SS Bolt 3/8"   │ 4      │ EA        │    ││
│  │  9   │ Lock washer    │ 4      │ EA        │ │  │  6   │ SS Flat washer │ 8      │ EA        │    ││
│  │ 10   │ Flat washer    │ 4      │ EA        │ │  │      │ (load spread)  │        │           │    ││
│  └─────────────────────────────────────────────┘ │  └─────────────────────────────────────────────────┘│
│                                                  │                                                      │
│  PACKAGING:                                      │  PACKAGING:                                          │
│  ┌─────────────────────────────────────────────┐ │  ┌─────────────────────────────────────────────────┐│
│  │ 11   │ VCI paper      │ 1      │ EA        │ │  │  7   │ PE bag         │ 1      │ EA        │    ││
│  │ 12   │ Cardboard box  │ 1      │ EA        │ │  │  8   │ Foam wrap      │ 1      │ EA        │    ││
│  └─────────────────────────────────────────────┘ │  │  9   │ Cardboard box  │ 1      │ EA        │    ││
│                                                  │  └─────────────────────────────────────────────────┘│
│                                                                                                         │
│  KEY DIFFERENCES:                                                                                       │
│  • Metal BOM has welding consumables (wire, gas) — Plastic has none                                    │
│  • Metal uses standard hardware — Plastic needs threaded inserts                                       │
│  • Metal has coolant in BOM — Plastic has no coolant                                                   │
│  • Plastic hardware includes extra washers for load spreading                                          │
│  • Metal uses VCI paper — Plastic uses PE bag/foam                                                     │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. PROCESSING TEMPLATES

### 4.1 Operation Templates by Material Family

```typescript
// Base operation interface
interface OperationTemplate {
  operationCode: string;
  operationName: string;
  materialFamily: 'METAL' | 'PLASTIC' | 'BOTH';
  workCenterId: string;
  
  // Default parameters (overridden by specific material)
  defaultParameters: OperationParameters;
  
  // Material-specific overrides
  materialOverrides: {
    [materialType: string]: Partial<OperationParameters>;
  };
  
  // Time estimation
  timeEstimation: TimeEstimationModel;
  
  // QC requirements
  qcRequirements: QCRequirement[];
}

interface OperationParameters {
  // Cutting parameters
  cuttingSpeed?: { min: number; max: number; unit: 'SFM' | 'IPM' };
  feedRate?: { min: number; max: number; unit: 'IPT' | 'IPM' | 'IPR' };
  depthOfCut?: { min: number; max: number; unit: 'IN' };
  
  // Tooling
  toolType: string;
  toolMaterial: string[];
  coolantType: 'FLOOD' | 'MIST' | 'AIR' | 'NONE';
  
  // Tolerances
  standardTolerance: number;
  precisionTolerance: number;
  toleranceUnit: 'IN' | 'MM';
  
  // Safety/handling
  requiresVentilation: boolean;
  fireRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  specialPPE: string[];
}

// SAWING operation templates
const sawingTemplates: OperationTemplate[] = [
  {
    operationCode: 'SAW-001',
    operationName: 'Band Saw Cutting',
    materialFamily: 'BOTH',
    workCenterId: 'WC-SAW-01',
    
    defaultParameters: {
      cuttingSpeed: { min: 150, max: 350, unit: 'SFM' },
      feedRate: { min: 0.5, max: 3.0, unit: 'IPM' },
      toolType: 'Band saw blade',
      toolMaterial: ['Bi-metal', 'Carbide-tipped'],
      coolantType: 'FLOOD',
      standardTolerance: 0.030,
      precisionTolerance: 0.015,
      toleranceUnit: 'IN',
      requiresVentilation: false,
      fireRisk: 'LOW',
      specialPPE: ['Safety glasses', 'Gloves']
    },
    
    materialOverrides: {
      'CARBON_STEEL': {
        cuttingSpeed: { min: 150, max: 250, unit: 'SFM' },
        coolantType: 'FLOOD'
      },
      'STAINLESS': {
        cuttingSpeed: { min: 80, max: 150, unit: 'SFM' },
        coolantType: 'FLOOD'
      },
      'ALUMINUM': {
        cuttingSpeed: { min: 250, max: 350, unit: 'SFM' },
        toolMaterial: ['Carbide-tipped'],  // Avoid bi-metal
        coolantType: 'MIST'
      },
      'HDPE': {
        cuttingSpeed: { min: 1000, max: 2000, unit: 'SFM' },
        feedRate: { min: 2.0, max: 8.0, unit: 'IPM' },
        toolType: 'Skip-tooth blade',
        toolMaterial: ['Carbon steel'],
        coolantType: 'NONE',
        standardTolerance: 0.060,
        precisionTolerance: 0.030
      },
      'ACRYLIC': {
        cuttingSpeed: { min: 1500, max: 3000, unit: 'SFM' },
        feedRate: { min: 3.0, max: 10.0, unit: 'IPM' },
        toolType: 'Triple-chip blade',
        coolantType: 'AIR',
        requiresVentilation: true,
        fireRisk: 'MEDIUM'
      },
      'POLYCARBONATE': {
        cuttingSpeed: { min: 1000, max: 2500, unit: 'SFM' },
        coolantType: 'AIR',
        requiresVentilation: true
      }
    },
    
    timeEstimation: {
      setupMinutes: 8,
      perCutCalculation: 'AREA_BASED',  // Time = area / rate
      baseRatePerSqIn: {
        'CARBON_STEEL': 0.5,    // 0.5 min per sq in
        'STAINLESS': 0.7,
        'ALUMINUM': 0.3,
        'HDPE': 0.15,
        'ACRYLIC': 0.12,
        'POLYCARBONATE': 0.15
      }
    },
    
    qcRequirements: [
      { type: 'DIMENSIONAL', frequency: 'FIRST_PIECE' },
      { type: 'VISUAL', frequency: 'EACH_PIECE' }
    ]
  }
];

// LASER CUTTING operation templates
const laserCuttingTemplates: OperationTemplate[] = [
  {
    operationCode: 'LSR-001',
    operationName: 'CO2 Laser Cutting',
    materialFamily: 'BOTH',
    workCenterId: 'WC-LASER-01',
    
    defaultParameters: {
      cuttingSpeed: { min: 50, max: 400, unit: 'IPM' },
      toolType: 'CO2 Laser',
      coolantType: 'NONE',
      standardTolerance: 0.005,
      precisionTolerance: 0.002,
      toleranceUnit: 'IN',
      requiresVentilation: true,
      fireRisk: 'MEDIUM',
      specialPPE: ['Laser safety glasses', 'Respirator']
    },
    
    materialOverrides: {
      'CARBON_STEEL': {
        cuttingSpeed: { min: 100, max: 300, unit: 'IPM' },
        // O2 assist for steel
      },
      'STAINLESS': {
        cuttingSpeed: { min: 80, max: 250, unit: 'IPM' },
        // N2 assist for stainless (clean edge)
      },
      'ALUMINUM': {
        cuttingSpeed: { min: 150, max: 400, unit: 'IPM' },
        // Fiber laser preferred for aluminum
      },
      'ACRYLIC': {
        cuttingSpeed: { min: 50, max: 200, unit: 'IPM' },
        standardTolerance: 0.010,
        fireRisk: 'HIGH',
        // Air assist, flame-polished edge
      },
      'HDPE': {
        cuttingSpeed: { min: 30, max: 100, unit: 'IPM' },
        standardTolerance: 0.015,
        fireRisk: 'HIGH',
        // Challenging - melty edges
      },
      'POLYCARBONATE': {
        // NOT RECOMMENDED - releases toxic fumes (phosgene)
        cuttingSpeed: { min: 0, max: 0, unit: 'IPM' },
        fireRisk: 'HIGH'
      }
    },
    
    timeEstimation: {
      setupMinutes: 15,
      perPieceCalculation: 'PERIMETER_BASED',
      baseRatePerInch: {
        'CARBON_STEEL': 0.01,   // 0.01 min per inch at 0.25" thick
        'STAINLESS': 0.012,
        'ALUMINUM': 0.008,
        'ACRYLIC': 0.015,
        'HDPE': 0.025
      },
      thicknessMultiplier: {
        // Multiply base rate by this for each 0.125" over 0.25"
        'CARBON_STEEL': 1.5,
        'ACRYLIC': 2.0
      }
    },
    
    qcRequirements: [
      { type: 'DIMENSIONAL', frequency: 'FIRST_PIECE' },
      { type: 'VISUAL', frequency: 'EACH_PIECE' },
      { type: 'EDGE_QUALITY', frequency: 'FIRST_PIECE' }
    ]
  }
];

// DRILLING operation templates
const drillingTemplates: OperationTemplate[] = [
  {
    operationCode: 'DRL-001',
    operationName: 'Drilling',
    materialFamily: 'BOTH',
    workCenterId: 'WC-DRILL-01',
    
    defaultParameters: {
      cuttingSpeed: { min: 50, max: 300, unit: 'SFM' },
      feedRate: { min: 0.002, max: 0.015, unit: 'IPR' },
      toolType: 'Twist drill',
      toolMaterial: ['HSS', 'Cobalt', 'Carbide'],
      coolantType: 'FLOOD',
      standardTolerance: 0.005,
      precisionTolerance: 0.002,
      toleranceUnit: 'IN',
      requiresVentilation: false,
      fireRisk: 'LOW',
      specialPPE: ['Safety glasses']
    },
    
    materialOverrides: {
      'CARBON_STEEL': {
        cuttingSpeed: { min: 80, max: 120, unit: 'SFM' },
        feedRate: { min: 0.005, max: 0.012, unit: 'IPR' },
        toolMaterial: ['HSS', 'Cobalt']
      },
      'STAINLESS': {
        cuttingSpeed: { min: 40, max: 80, unit: 'SFM' },
        feedRate: { min: 0.003, max: 0.008, unit: 'IPR' },
        toolMaterial: ['Cobalt', 'Carbide'],
        coolantType: 'FLOOD'  // Critical
      },
      'ALUMINUM': {
        cuttingSpeed: { min: 200, max: 400, unit: 'SFM' },
        feedRate: { min: 0.006, max: 0.015, unit: 'IPR' },
        toolMaterial: ['HSS', 'Carbide'],
        coolantType: 'MIST'
      },
      'HDPE': {
        cuttingSpeed: { min: 300, max: 600, unit: 'SFM' },
        feedRate: { min: 0.008, max: 0.020, unit: 'IPR' },
        toolType: 'Plastic drill (60° point)',
        toolMaterial: ['HSS'],
        coolantType: 'AIR',
        standardTolerance: 0.010,
        // Peck drilling required
      },
      'ACRYLIC': {
        cuttingSpeed: { min: 200, max: 500, unit: 'SFM' },
        feedRate: { min: 0.005, max: 0.015, unit: 'IPR' },
        toolType: 'Plastic drill (60° point)',
        coolantType: 'AIR',
        standardTolerance: 0.008,
        // Slow approach, backup support required
      },
      'POLYCARBONATE': {
        cuttingSpeed: { min: 150, max: 400, unit: 'SFM' },
        feedRate: { min: 0.004, max: 0.012, unit: 'IPR' },
        toolType: 'Plastic drill (90° point)',
        coolantType: 'AIR',
        // Very slow final approach to prevent grabbing
      }
    },
    
    timeEstimation: {
      setupMinutes: 5,
      perHoleCalculation: 'FORMULA_BASED',
      // Time = (depth / (RPM × feed)) + approach + retract
      pecksRequired: {
        'HDPE': true,       // Peck every 0.5"
        'ACRYLIC': true,
        'POLYCARBONATE': true,
        'CARBON_STEEL': false,
        'ALUMINUM': false
      }
    },
    
    qcRequirements: [
      { type: 'DIMENSIONAL', frequency: 'FIRST_PIECE' },
      { type: 'HOLE_LOCATION', frequency: 'FIRST_PIECE' },
      { type: 'VISUAL', frequency: 'EACH_PIECE' }
    ]
  }
];

// BENDING operation templates
const bendingTemplates: OperationTemplate[] = [
  {
    operationCode: 'BND-001',
    operationName: 'Press Brake Bending',
    materialFamily: 'METAL',
    workCenterId: 'WC-BRAKE-01',
    
    defaultParameters: {
      toolType: 'V-die',
      coolantType: 'NONE',
      standardTolerance: 0.5,  // degrees
      precisionTolerance: 0.25,
      toleranceUnit: 'DEG',
      requiresVentilation: false,
      fireRisk: 'LOW',
      specialPPE: ['Safety glasses', 'Gloves']
    },
    
    materialOverrides: {
      'CARBON_STEEL': {
        // Standard K-factor 0.33-0.50
      },
      'STAINLESS': {
        // Higher springback, K-factor 0.40-0.50
      },
      'ALUMINUM': {
        // Lower springback, K-factor 0.30-0.40
        // Watch for cracking on tight radii
      }
    },
    
    timeEstimation: {
      setupMinutes: 10,
      perBendMinutes: 0.5,
      trialBends: 3
    },
    
    qcRequirements: [
      { type: 'ANGLE', frequency: 'FIRST_PIECE' },
      { type: 'DIMENSIONAL', frequency: 'FIRST_PIECE' }
    ]
  },
  
  {
    operationCode: 'BND-002',
    operationName: 'Hot Bending (Plastics)',
    materialFamily: 'PLASTIC',
    workCenterId: 'WC-BEND-PL-01',
    
    defaultParameters: {
      toolType: 'Strip heater / Oven',
      coolantType: 'NONE',
      standardTolerance: 2.0,  // degrees (looser)
      precisionTolerance: 1.0,
      toleranceUnit: 'DEG',
      requiresVentilation: true,
      fireRisk: 'MEDIUM',
      specialPPE: ['Heat gloves', 'Safety glasses']
    },
    
    materialOverrides: {
      'ACRYLIC': {
        // Heat to 300-340°F, bend, hold until cool
        // Min bend radius = 2× thickness
      },
      'POLYCARBONATE': {
        // Heat to 280-320°F
        // More flexible than acrylic
      },
      'HDPE': {
        // Heat to 250-280°F
        // Large radius required (5-10× thickness)
        // Significant springback
      },
      'PVC': {
        // Heat to 200-250°F
        requiresVentilation: true,  // Critical - toxic fumes
        fireRisk: 'HIGH'
      }
    },
    
    timeEstimation: {
      setupMinutes: 15,
      heatingMinutes: {
        perQuarterInch: 2  // 2 min per 0.25" thickness
      },
      bendMinutes: 1,
      coolingMinutes: 3,
      trialBends: 5
    },
    
    qcRequirements: [
      { type: 'ANGLE', frequency: 'FIRST_PIECE' },
      { type: 'VISUAL', frequency: 'EACH_PIECE' },  // Check for stress marks
      { type: 'DIMENSIONAL', frequency: 'FIRST_PIECE' }
    ]
  }
];
```

### 4.2 Complete Template Library

```typescript
// Template registry
const operationTemplateRegistry = {
  // Cutting operations
  'SAW': sawingTemplates,
  'LASER': laserCuttingTemplates,
  'PLASMA': plasmaCuttingTemplates,
  'SHEAR': shearingTemplates,
  'WATERJET': waterjetTemplates,
  
  // Hole-making
  'DRILL': drillingTemplates,
  'TAP': tappingTemplates,
  'PUNCH': punchingTemplates,
  
  // Forming
  'BEND': bendingTemplates,
  'ROLL': rollingTemplates,
  
  // Machining
  'MILL': millingTemplates,
  'LATHE': latheTemplates,
  'ROUTE': routingTemplates,
  
  // Joining
  'WELD': weldingTemplates,
  'BOND': bondingTemplates,
  
  // Finishing
  'GRIND': grindingTemplates,
  'POLISH': polishingTemplates,
  'DEBURR': deburringTemplates
};

// Get appropriate template for material
function getOperationTemplate(
  operationType: string,
  materialType: string
): OperationTemplate | null {
  
  const templates = operationTemplateRegistry[operationType];
  if (!templates) return null;
  
  // Find template that applies to this material
  for (const template of templates) {
    if (template.materialFamily === 'BOTH' ||
        (template.materialFamily === 'METAL' && isMetalMaterial(materialType)) ||
        (template.materialFamily === 'PLASTIC' && isPlasticMaterial(materialType))) {
      
      // Check if material has override (supported)
      if (template.materialOverrides[materialType]) {
        return template;
      }
    }
  }
  
  return null;
}

// Get merged parameters for specific material
function getOperationParameters(
  template: OperationTemplate,
  materialType: string
): OperationParameters {
  
  const baseParams = template.defaultParameters;
  const overrides = template.materialOverrides[materialType] || {};
  
  return {
    ...baseParams,
    ...overrides
  };
}
```

---

## 5. DATA MODEL CHANGES

### 5.1 Extended Product Model

```typescript
// Extended Product to support material-specific properties
interface Product {
  productId: string;
  sku: string;
  name: string;
  
  // Material classification
  materialFamily: 'METAL' | 'PLASTIC' | 'COMPOSITE' | 'OTHER';
  divisionId: string;  // STL, ALU, PLA, SPC, SUP
  
  // Common properties
  baseProperties: {
    form: 'SHEET' | 'PLATE' | 'BAR' | 'TUBE' | 'STRUCTURAL' | 'ROD' | 'FILM';
    dimensions: DimensionSpec;
    weight: WeightSpec;
    uom: string;
  };
  
  // Material-specific properties (union type)
  materialProperties: MetalProperties | PlasticProperties;
  
  // Processing compatibility
  processingCapabilities: ProcessingCapability[];
  
  // Tolerances
  standardTolerances: ToleranceSpec;
}

interface MetalProperties {
  type: 'METAL';
  
  // Grade/specification
  specification: string;           // ASTM A36, AISI 304, etc.
  grade: string;
  condition: string;               // Hot-rolled, Cold-rolled, T6, etc.
  
  // Mechanical properties
  tensileStrength: { min: number; max: number; unit: 'KSI' | 'MPA' };
  yieldStrength: { min: number; max: number; unit: 'KSI' | 'MPA' };
  hardness?: { value: number; scale: 'ROCKWELL_B' | 'ROCKWELL_C' | 'BRINELL' };
  elongation?: number;             // Percent
  
  // Physical properties
  density: number;                 // lb/cu in
  thermalExpansion: number;        // µin/in/°F
  thermalConductivity: number;     // BTU/hr-ft-°F
  meltingPoint: number;            // °F
  
  // Certification
  certification: {
    mtrRequired: boolean;
    chemistryRequired: boolean;
    mechanicalsRequired: boolean;
    impactTestRequired: boolean;
  };
  
  // Weldability
  weldability: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'NOT_WELDABLE';
  weldingMethods: string[];        // MIG, TIG, SMAW, etc.
  
  // Scrap
  scrapGrade: string;              // #1 Steel, 304 SS, etc.
  scrapValue: number;              // $/lb
}

interface PlasticProperties {
  type: 'PLASTIC';
  
  // Resin identification
  resinType: string;               // HDPE, UHMW, Acrylic, etc.
  tradeName?: string;              // Plexiglas, Lexan, Delrin, etc.
  recycleCode?: number;            // 1-7
  
  // Grades/options
  grade: string;                   // General purpose, FDA, UV-stabilized
  color: string;
  isTransparent: boolean;
  
  // Mechanical properties
  tensileStrength: { value: number; unit: 'PSI' };
  flexuralStrength: { value: number; unit: 'PSI' };
  impactStrength: { value: number; type: 'IZOD' | 'CHARPY'; unit: 'FT-LB/IN' };
  hardness: { value: number; scale: 'SHORE_D' | 'ROCKWELL_R' };
  
  // Physical properties
  density: number;                 // lb/cu in
  thermalExpansion: number;        // µin/in/°F
  thermalConductivity: number;     // BTU/hr-ft-°F
  meltingPoint?: number;           // °F (if applicable)
  heatDeflection: number;          // °F at 264 PSI
  
  // Special properties
  isUvStabilized: boolean;
  isFdaApproved: boolean;
  isFlameRetardant: boolean;
  flammabilityRating?: string;     // UL94 HB, V-0, etc.
  
  // Chemical resistance
  chemicalResistance: {
    acids: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    bases: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    solvents: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  };
  
  // Processing notes
  machiningNotes: string[];        // Special considerations
  moistureAbsorption: number;      // Percent
  requiresAnnealing: boolean;
  
  // Scrap
  recyclable: boolean;
  scrapValue: number;              // Usually ~$0
}
```

### 5.2 Extended Work Order Model

```typescript
interface WorkOrder {
  workOrderId: string;
  jobId: string;
  
  // Material info (affects processing)
  material: {
    productId: string;
    materialFamily: 'METAL' | 'PLASTIC';
    materialType: string;          // Specific type (CARBON_STEEL, HDPE, etc.)
    
    // Material-specific considerations
    processingConsiderations: ProcessingConsideration[];
  };
  
  // Operations
  operations: Operation[];
  
  // Material-specific fields
  metalSpecific?: {
    heatNumber: string;
    mtrDocumentId: string;
    preHeatRequired: boolean;
    postHeatTreatment?: string;
  };
  
  plasticSpecific?: {
    lotNumber: string;
    ambientTempAtStart?: number;
    annealingRequired: boolean;
    protectiveFilmRetained: boolean;
  };
}

interface ProcessingConsideration {
  code: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  action?: string;
}

// Processing considerations by material type
const processingConsiderations = {
  'HDPE': [
    { code: 'PLA-001', description: 'High thermal expansion - measure at consistent temperature', severity: 'WARNING' },
    { code: 'PLA-002', description: 'No coolant - use air blast only', severity: 'INFO' },
    { code: 'PLA-003', description: 'Peck drilling required for holes > 0.5" deep', severity: 'INFO' }
  ],
  'ACRYLIC': [
    { code: 'PLA-010', description: 'Fire hazard - ensure fire extinguisher accessible', severity: 'WARNING' },
    { code: 'PLA-011', description: 'Fume extraction required for laser cutting', severity: 'CRITICAL' },
    { code: 'PLA-012', description: 'Retain protective film until final packaging', severity: 'INFO' },
    { code: 'PLA-013', description: 'Support material during drilling to prevent chipping', severity: 'WARNING' }
  ],
  'POLYCARBONATE': [
    { code: 'PLA-020', description: 'DO NOT laser cut - toxic phosgene gas released', severity: 'CRITICAL', action: 'BLOCK_OPERATION' },
    { code: 'PLA-021', description: 'Stress relieving may be required after machining', severity: 'INFO' },
    { code: 'PLA-022', description: 'Check solvent compatibility before bonding', severity: 'WARNING' }
  ],
  'STAINLESS': [
    { code: 'MTL-001', description: 'Dedicated tooling required - avoid cross-contamination with carbon steel', severity: 'WARNING' },
    { code: 'MTL-002', description: 'Proper coolant essential - galling risk', severity: 'WARNING' },
    { code: 'MTL-003', description: 'Passivation may be required after processing', severity: 'INFO' }
  ],
  'ALUMINUM': [
    { code: 'MTL-010', description: 'High cutting speeds - watch for chip welding', severity: 'INFO' },
    { code: 'MTL-011', description: 'Avoid carbide-tipped band saw blades', severity: 'WARNING' }
  ]
};
```

### 5.3 Extended QC Inspection Model

```typescript
interface QCInspection {
  inspectionId: string;
  workOrderId: string;
  operationId: string;
  
  // Inspection type
  inspectionType: 'INCOMING' | 'IN_PROCESS' | 'FINAL';
  
  // Material-specific inspection plan
  inspectionPlan: {
    materialFamily: 'METAL' | 'PLASTIC';
    checkpoints: InspectionCheckpoint[];
  };
  
  // Results
  results: InspectionResult[];
  
  // Disposition
  disposition: 'ACCEPT' | 'REJECT' | 'CONDITIONAL' | 'MRB';
}

interface InspectionCheckpoint {
  checkpointId: string;
  sequence: number;
  
  // What to check
  checkType: CheckType;
  description: string;
  
  // Specification
  specification: {
    nominal?: number;
    tolerance?: { plus: number; minus: number };
    min?: number;
    max?: number;
    attribute?: string;            // For pass/fail checks
  };
  
  // Material-specific notes
  materialNotes?: string;
  
  // Frequency
  frequency: 'EACH_PIECE' | 'FIRST_PIECE' | 'SAMPLING' | 'PER_LOT';
  sampleSize?: number;
  
  // Equipment required
  equipmentRequired: string[];
}

type CheckType = 
  // Common
  | 'DIMENSION_LINEAR'
  | 'DIMENSION_DIAMETER'
  | 'DIMENSION_ANGLE'
  | 'SURFACE_FINISH'
  | 'VISUAL'
  | 'FLATNESS'
  | 'SQUARENESS'
  
  // Metal-specific
  | 'HARDNESS_ROCKWELL'
  | 'HARDNESS_BRINELL'
  | 'MTR_VERIFICATION'
  | 'WELD_VISUAL'
  | 'WELD_NDT'
  | 'EDGE_CONDITION'
  | 'DEBURR_CHECK'
  
  // Plastic-specific
  | 'HARDNESS_SHORE'
  | 'COLOR_MATCH'
  | 'STRESS_MARKS'
  | 'CRAZING'
  | 'HEAT_DAMAGE'
  | 'EDGE_MELT'
  | 'CLARITY';

// Material-specific inspection templates
const metalInspectionTemplate: InspectionCheckpoint[] = [
  {
    checkpointId: 'MTL-INC-001',
    sequence: 1,
    checkType: 'MTR_VERIFICATION',
    description: 'Verify MTR matches material specification',
    specification: { attribute: 'MATCH' },
    frequency: 'PER_LOT',
    equipmentRequired: []
  },
  {
    checkpointId: 'MTL-INC-002',
    sequence: 2,
    checkType: 'DIMENSION_LINEAR',
    description: 'Verify thickness',
    specification: { tolerance: { plus: 0.015, minus: 0.015 } },
    frequency: 'SAMPLING',
    sampleSize: 3,
    equipmentRequired: ['Micrometer']
  },
  {
    checkpointId: 'MTL-INC-003',
    sequence: 3,
    checkType: 'VISUAL',
    description: 'Check for surface defects, mill scale, rust',
    specification: { attribute: 'ACCEPTABLE' },
    frequency: 'EACH_PIECE',
    equipmentRequired: []
  }
];

const plasticInspectionTemplate: InspectionCheckpoint[] = [
  {
    checkpointId: 'PLA-INC-001',
    sequence: 1,
    checkType: 'VISUAL',
    description: 'Check for color consistency, inclusions, UV damage',
    specification: { attribute: 'ACCEPTABLE' },
    frequency: 'EACH_PIECE',
    equipmentRequired: []
  },
  {
    checkpointId: 'PLA-INC-002',
    sequence: 2,
    checkType: 'DIMENSION_LINEAR',
    description: 'Verify thickness (measure at consistent temp)',
    specification: { tolerance: { plus: 0.030, minus: 0.030 } },
    materialNotes: 'Allow material to acclimate to shop temp before measuring',
    frequency: 'SAMPLING',
    sampleSize: 3,
    equipmentRequired: ['Micrometer', 'Thermometer']
  },
  {
    checkpointId: 'PLA-INC-003',
    sequence: 3,
    checkType: 'FLATNESS',
    description: 'Check for warping (common issue)',
    specification: { max: 0.030 },  // Per foot
    frequency: 'EACH_PIECE',
    equipmentRequired: ['Straight edge', 'Feeler gauge']
  },
  {
    checkpointId: 'PLA-INC-004',
    sequence: 4,
    checkType: 'CLARITY',
    description: 'Check optical clarity (for transparent materials)',
    specification: { attribute: 'CLEAR_NO_HAZE' },
    frequency: 'EACH_PIECE',
    equipmentRequired: []
  }
];
```

### 5.4 Extended BOM Model

```typescript
interface BOMLine {
  lineId: string;
  bomId: string;
  sequence: number;
  
  // Item identification
  lineType: 'MATERIAL' | 'CONSUMABLE' | 'HARDWARE' | 'PACKAGING' | 'LABOR';
  productId?: string;
  description: string;
  
  // Quantity
  quantity: number;
  uom: string;
  quantityType: 'FIXED' | 'VARIABLE' | 'CALCULATED';
  
  // Calculation (for variable/calculated)
  calculation?: {
    basis: 'PER_PIECE' | 'PER_OPERATION' | 'PER_WEIGHT' | 'PER_AREA' | 'PER_LENGTH';
    formula?: string;
    factor?: number;
  };
  
  // Material family variations
  materialVariations?: {
    metalAlternative?: BOMLineVariation;
    plasticAlternative?: BOMLineVariation;
  };
  
  // Cost
  unitCost: number;
  extendedCost: number;
  
  // Scrap/waste
  scrapAllowance?: {
    percent: number;
    recoveryValue?: number;        // For metals
  };
}

interface BOMLineVariation {
  productId: string;
  quantity: number;
  uom: string;
  unitCost: number;
  notes?: string;
}

// Example: BOM that handles both metals and plastics
const exampleBOM: BOMLine[] = [
  {
    lineId: 'BOM-001-01',
    bomId: 'BOM-001',
    sequence: 1,
    lineType: 'MATERIAL',
    description: 'Base material',
    quantity: 2.5,
    uom: 'LB',
    quantityType: 'CALCULATED',
    calculation: {
      basis: 'PER_PIECE',
      formula: 'netWeight * (1 + scrapFactor)'
    },
    materialVariations: {
      metalAlternative: {
        productId: 'STL-A36-PL-025',
        quantity: 2.5,
        uom: 'LB',
        unitCost: 0.85,
        notes: 'A36 plate 0.25" thick'
      },
      plasticAlternative: {
        productId: 'PLA-HDPE-SH-050',
        quantity: 1.8,
        uom: 'LB',
        unitCost: 2.25,
        notes: 'HDPE sheet 0.50" thick (lighter material)'
      }
    },
    unitCost: 0,  // Set by variation
    extendedCost: 0,
    scrapAllowance: {
      percent: 15,
      recoveryValue: 0.10  // Only for metal
    }
  },
  
  {
    lineId: 'BOM-001-02',
    bomId: 'BOM-001',
    sequence: 2,
    lineType: 'CONSUMABLE',
    description: 'Coolant',
    quantity: 0.05,
    uom: 'GAL',
    quantityType: 'FIXED',
    materialVariations: {
      metalAlternative: {
        productId: 'SUP-COOL-WS',
        quantity: 0.05,
        uom: 'GAL',
        unitCost: 8.50,
        notes: 'Water-soluble coolant'
      },
      plasticAlternative: {
        productId: null,  // No coolant for plastic
        quantity: 0,
        uom: 'GAL',
        unitCost: 0,
        notes: 'No coolant - air blast only'
      }
    },
    unitCost: 0,
    extendedCost: 0
  },
  
  {
    lineId: 'BOM-001-03',
    bomId: 'BOM-001',
    sequence: 3,
    lineType: 'HARDWARE',
    description: 'Threaded fastener',
    quantity: 4,
    uom: 'EA',
    quantityType: 'FIXED',
    materialVariations: {
      metalAlternative: {
        productId: 'HW-BOLT-38-16-1',
        quantity: 4,
        uom: 'EA',
        unitCost: 0.25,
        notes: 'Standard bolt - direct thread into metal'
      },
      plasticAlternative: {
        productId: 'HW-INSERT-38-HS',
        quantity: 4,
        uom: 'EA',
        unitCost: 1.50,
        notes: 'Heat-set threaded insert required for plastic'
      }
    },
    unitCost: 0,
    extendedCost: 0
  }
];
```

### 5.5 Time Estimation Model Extensions

```typescript
interface TimeEstimate {
  operationId: string;
  workOrderId: string;
  
  // Material context
  materialFamily: 'METAL' | 'PLASTIC';
  materialType: string;
  
  // Time components
  setupTime: TimeComponent;
  runTime: TimeComponent;
  handlingTime: TimeComponent;
  inspectionTime: TimeComponent;
  
  // Material-specific adjustments
  materialAdjustments: MaterialTimeAdjustment[];
  
  // Totals
  totalEstimatedMinutes: number;
  confidence: number;              // 0-1
}

interface TimeComponent {
  baseMinutes: number;
  adjustedMinutes: number;
  
  // Calculation method
  calculationMethod: 'FIXED' | 'PER_PIECE' | 'PER_OPERATION' | 'FORMULA';
  formula?: string;
  
  // Factors applied
  factors: TimeFactor[];
}

interface MaterialTimeAdjustment {
  code: string;
  description: string;
  adjustmentType: 'MULTIPLIER' | 'ADDITIVE';
  value: number;
  reason: string;
}

// Material-specific time adjustments
const materialTimeAdjustments = {
  // Plastics generally need more time for:
  'PLASTIC_GENERAL': [
    {
      code: 'PLA-TIME-001',
      description: 'Thermal stabilization',
      adjustmentType: 'ADDITIVE',
      value: 5,                    // Add 5 minutes
      reason: 'Allow material to reach shop temperature before precision work'
    },
    {
      code: 'PLA-TIME-002',
      description: 'Careful handling',
      adjustmentType: 'MULTIPLIER',
      value: 1.2,                  // 20% more handling time
      reason: 'Plastics scratch/damage more easily'
    },
    {
      code: 'PLA-TIME-003',
      description: 'More frequent inspection',
      adjustmentType: 'MULTIPLIER',
      value: 1.5,                  // 50% more inspection time
      reason: 'Visual inspection for heat damage, stress marks'
    }
  ],
  
  'ACRYLIC_SPECIFIC': [
    {
      code: 'ACR-TIME-001',
      description: 'Fire watch during laser',
      adjustmentType: 'ADDITIVE',
      value: 3,
      reason: 'Monitor for flame during laser cutting'
    },
    {
      code: 'ACR-TIME-002',
      description: 'Edge finishing',
      adjustmentType: 'ADDITIVE',
      value: 10,
      reason: 'Flame polishing or sanding of cut edges'
    }
  ],
  
  'BENDING_PLASTIC': [
    {
      code: 'PLA-BEND-001',
      description: 'Heating time',
      adjustmentType: 'ADDITIVE',
      value: 15,                   // Average heating cycle
      reason: 'Strip heater warm-up and material heating'
    },
    {
      code: 'PLA-BEND-002',
      description: 'Cooling/holding time',
      adjustmentType: 'ADDITIVE',
      value: 5,
      reason: 'Hold bend until material cools and sets'
    },
    {
      code: 'PLA-BEND-003',
      description: 'Extra trial bends',
      adjustmentType: 'MULTIPLIER',
      value: 1.5,
      reason: 'Less predictable springback, more trials needed'
    }
  ],
  
  // Metals adjustments
  'STAINLESS_SPECIFIC': [
    {
      code: 'SS-TIME-001',
      description: 'Tooling changeover',
      adjustmentType: 'ADDITIVE',
      value: 10,
      reason: 'Dedicated SS tooling to prevent contamination'
    },
    {
      code: 'SS-TIME-002',
      description: 'Reduced cutting speeds',
      adjustmentType: 'MULTIPLIER',
      value: 1.3,
      reason: 'Slower speeds than carbon steel'
    }
  ]
};

// Time estimation calculator
class TimeEstimator {
  
  estimateOperationTime(
    operation: Operation,
    materialType: string,
    quantity: number
  ): TimeEstimate {
    
    // Get base template
    const template = getOperationTemplate(operation.type, materialType);
    const params = getOperationParameters(template, materialType);
    
    // Calculate base times
    const setupTime = this.calculateSetupTime(template, materialType);
    const runTime = this.calculateRunTime(template, operation, quantity, materialType);
    const handlingTime = this.calculateHandlingTime(operation, quantity, materialType);
    const inspectionTime = this.calculateInspectionTime(template, quantity, materialType);
    
    // Apply material adjustments
    const adjustments = this.getMaterialAdjustments(materialType, operation.type);
    
    // Calculate totals
    const totalMinutes = 
      setupTime.adjustedMinutes +
      runTime.adjustedMinutes +
      handlingTime.adjustedMinutes +
      inspectionTime.adjustedMinutes;
    
    // Confidence based on material
    const confidence = isPlasticMaterial(materialType) ? 0.75 : 0.85;
    
    return {
      operationId: operation.operationId,
      workOrderId: operation.workOrderId,
      materialFamily: isPlasticMaterial(materialType) ? 'PLASTIC' : 'METAL',
      materialType,
      setupTime,
      runTime,
      handlingTime,
      inspectionTime,
      materialAdjustments: adjustments,
      totalEstimatedMinutes: totalMinutes,
      confidence
    };
  }
}
```

---

## 6. SUMMARY

### Key Differences Summary

| Aspect | Metals | Plastics | System Impact |
|--------|--------|----------|---------------|
| **Tolerances** | Tighter (±0.005") | Looser (±0.010") | Different inspection criteria |
| **Machining** | Aggressive, flood coolant | Conservative, no coolant | Parameter tables by material |
| **Thermal** | Stable | Sensitive | Ambient temp tracking for plastics |
| **Certification** | MTR required | COC typical | Different traceability fields |
| **Scrap Value** | 20-50% recovery | ~0% recovery | Cost calculation differences |
| **Packaging** | Corrosion protection | Scratch/UV protection | Material-specific packaging BOM |
| **Time Est.** | ±15% variability | ±25% variability | Larger contingency for plastics |
| **QC** | NDT, hardness tests | Visual, stress marks | Different inspection checklists |
| **Joining** | Welding | Adhesive/solvent | Different consumables in BOM |
| **Forming** | Cold bending | Hot bending | Heating time in estimates |

### Implementation Priorities

1. **Extend Product Model** — Add `materialProperties` union type for metal vs plastic attributes
2. **Operation Templates** — Material-specific parameter overrides for each operation type
3. **BOM Variations** — Support material-specific alternatives on each BOM line
4. **Time Estimation** — Material adjustment factors with higher contingency for plastics
5. **QC Checklists** — Separate inspection templates for metal vs plastic operations
6. **Processing Considerations** — Auto-display warnings based on material type

---

**End of Plastics vs Metals Processing Specification**
