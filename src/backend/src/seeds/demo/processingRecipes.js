/** Demo processing recipes (time and price standards per operation) and routing templates. */
export const demoRecipes = [
  {
    "id": "recipe-001",
    "code": "SAW-STD",
    "name": "Standard Saw Cut",
    "description": "Bandsaw cut to length — single straight cut",
    "operationType": "CUT",
    "division": "METALS",
    "workCenter": "SAW",
    "setupMinutes": 8,
    "runMinutesPerUnit": 5,
    "minRunMinutes": 3,
    "applicableMaterials": [
      "A36",
      "A572-50",
      "A588",
      "AR400",
      "AR500"
    ],
    "applicableForms": [
      "BAR",
      "PLATE",
      "BEAM",
      "TUBE"
    ],
    "thicknessMin": 0,
    "thicknessMax": 12,
    "toleranceClass": "STANDARD",
    "pricePerUnit": 12,
    "priceUnit": "CUT",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": "Default saw cut recipe. Covers most bar/plate work."
  },
  {
    "id": "recipe-002",
    "code": "SHEAR-STD",
    "name": "Standard Shear Cut",
    "description": "Hydraulic shear — rectangular blanks up to 1\" thick",
    "operationType": "CUT",
    "division": "METALS",
    "workCenter": "SHEAR",
    "setupMinutes": 5,
    "runMinutesPerUnit": 3,
    "minRunMinutes": 2,
    "applicableMaterials": [
      "A36",
      "A572-50",
      "A588"
    ],
    "applicableForms": [
      "PLATE",
      "SHEET"
    ],
    "thicknessMin": 0,
    "thicknessMax": 1,
    "toleranceClass": "STANDARD",
    "pricePerUnit": 8.5,
    "priceUnit": "CUT",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": "Max 1\" thickness for shear. Thicker goes to saw or plasma."
  },
  {
    "id": "recipe-003",
    "code": "PLASMA-STD",
    "name": "Plasma Profile Cut",
    "description": "CNC plasma — contour/shape cutting on plate",
    "operationType": "CUT",
    "division": "METALS",
    "workCenter": "PLASMA",
    "setupMinutes": 15,
    "runMinutesPerUnit": 8,
    "minRunMinutes": 5,
    "applicableMaterials": [
      "A36",
      "A572-50",
      "A514",
      "AR400",
      "AR500",
      "T-1"
    ],
    "applicableForms": [
      "PLATE"
    ],
    "thicknessMin": 0.125,
    "thicknessMax": 6,
    "toleranceClass": "STANDARD",
    "pricePerUnit": 0.45,
    "priceUnit": "IN",
    "status": "ACTIVE",
    "version": 2,
    "createdBy": "admin",
    "notes": "Per-inch pricing. Pierce count adds ~30s each."
  },
  {
    "id": "recipe-004",
    "code": "BRAKE-STD",
    "name": "Press Brake Bend",
    "description": "Standard V-die bending on press brake",
    "operationType": "FORM",
    "division": "METALS",
    "workCenter": "BRAKE",
    "setupMinutes": 12,
    "runMinutesPerUnit": 6,
    "minRunMinutes": 4,
    "applicableMaterials": [
      "A36",
      "A572-50",
      "A588",
      "304-SS",
      "316-SS"
    ],
    "applicableForms": [
      "PLATE",
      "SHEET"
    ],
    "thicknessMin": 0.0625,
    "thicknessMax": 2,
    "toleranceClass": "STANDARD",
    "pricePerUnit": 18,
    "priceUnit": "BEND",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": "Thicker material requires tonnage check before accepting."
  },
  {
    "id": "recipe-005",
    "code": "ROLL-STD",
    "name": "Plate Rolling",
    "description": "Three-roll bending for cylinders and cones",
    "operationType": "FORM",
    "division": "METALS",
    "workCenter": "ROLL",
    "setupMinutes": 20,
    "runMinutesPerUnit": 15,
    "minRunMinutes": 10,
    "applicableMaterials": [
      "A36",
      "A572-50",
      "A514"
    ],
    "applicableForms": [
      "PLATE"
    ],
    "thicknessMin": 0.125,
    "thicknessMax": 3,
    "toleranceClass": "CLOSE",
    "pricePerUnit": 35,
    "priceUnit": "EA",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": "Diameter and material determine passes required."
  },
  {
    "id": "recipe-006",
    "code": "DRILL-STD",
    "name": "Drill Holes",
    "description": "Radial or mag drill — bolt holes, mounting patterns",
    "operationType": "MACHINE",
    "division": "METALS",
    "workCenter": "DRILL",
    "setupMinutes": 10,
    "runMinutesPerUnit": 4,
    "minRunMinutes": 2,
    "applicableMaterials": [
      "A36",
      "A572-50",
      "A588",
      "AR400",
      "304-SS",
      "316-SS"
    ],
    "applicableForms": [
      "PLATE",
      "BAR",
      "BEAM",
      "ANGLE"
    ],
    "thicknessMin": 0,
    "thicknessMax": 6,
    "toleranceClass": "STANDARD",
    "pricePerUnit": 4.5,
    "priceUnit": "HOLE",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": "Add 2 min per hole for AR/stainless grades."
  },
  {
    "id": "recipe-007",
    "code": "GRIND-STD",
    "name": "Surface Grind",
    "description": "Flat grind to specified surface finish",
    "operationType": "FINISH",
    "division": "METALS",
    "workCenter": "GRINDER",
    "setupMinutes": 15,
    "runMinutesPerUnit": 20,
    "minRunMinutes": 10,
    "applicableMaterials": [
      "A36",
      "A572-50",
      "A514",
      "T-1",
      "304-SS",
      "316-SS"
    ],
    "applicableForms": [
      "PLATE",
      "BAR"
    ],
    "thicknessMin": 0.25,
    "thicknessMax": 8,
    "toleranceClass": "CLOSE",
    "pricePerUnit": 55,
    "priceUnit": "SQFT",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": "Price is per sq ft of ground area."
  },
  {
    "id": "recipe-008",
    "code": "DEBURR-STD",
    "name": "Deburr / Edge Finish",
    "description": "Remove burrs and sharp edges after cutting or machining",
    "operationType": "FINISH",
    "division": "METALS",
    "workCenter": "DEBURR",
    "setupMinutes": 3,
    "runMinutesPerUnit": 5,
    "minRunMinutes": 3,
    "applicableMaterials": [
      "A36",
      "A572-50",
      "A588",
      "AR400",
      "AR500",
      "304-SS",
      "316-SS"
    ],
    "applicableForms": [
      "PLATE",
      "BAR",
      "SHEET",
      "BEAM",
      "ANGLE"
    ],
    "thicknessMin": 0,
    "thicknessMax": 99,
    "toleranceClass": "STANDARD",
    "pricePerUnit": 6,
    "priceUnit": "EA",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": ""
  },
  {
    "id": "recipe-009",
    "code": "PLAS-SAW-STD",
    "name": "Plastic Saw Cut",
    "description": "Precision saw cut for plastic sheet, rod, tube",
    "operationType": "CUT",
    "division": "PLASTICS",
    "workCenter": "PLAS-SAW",
    "setupMinutes": 5,
    "runMinutesPerUnit": 4,
    "minRunMinutes": 2,
    "applicableMaterials": [
      "HDPE",
      "UHMW",
      "ACETAL",
      "NYLON-6",
      "POLYCARBONATE"
    ],
    "applicableForms": [
      "SHEET",
      "ROD",
      "TUBE",
      "BAR"
    ],
    "thicknessMin": 0,
    "thicknessMax": 12,
    "toleranceClass": "STANDARD",
    "pricePerUnit": 8,
    "priceUnit": "CUT",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": "Slower blade speed for plastics to avoid melting."
  },
  {
    "id": "recipe-010",
    "code": "PLAS-CNC-STD",
    "name": "Plastic CNC Route",
    "description": "CNC router for contour cutting and pocketing on plastic",
    "operationType": "MACHINE",
    "division": "PLASTICS",
    "workCenter": "CNC-ROUTER",
    "setupMinutes": 12,
    "runMinutesPerUnit": 10,
    "minRunMinutes": 5,
    "applicableMaterials": [
      "HDPE",
      "UHMW",
      "ACETAL",
      "NYLON-6",
      "POLYCARBONATE"
    ],
    "applicableForms": [
      "SHEET",
      "PLATE"
    ],
    "thicknessMin": 0.125,
    "thicknessMax": 4,
    "toleranceClass": "STANDARD",
    "pricePerUnit": 1.2,
    "priceUnit": "MIN",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": "Time-based pricing. Program setup not included."
  },
  {
    "id": "recipe-011",
    "code": "STRESS-REL",
    "name": "Stress Relief",
    "description": "Furnace stress-relief heat treatment",
    "operationType": "HEAT_TREAT",
    "division": "METALS",
    "workCenter": "FURNACE",
    "setupMinutes": 30,
    "runMinutesPerUnit": 0,
    "minRunMinutes": 120,
    "applicableMaterials": [
      "A36",
      "A572-50",
      "A514",
      "T-1"
    ],
    "applicableForms": [
      "PLATE",
      "FABRICATION"
    ],
    "thicknessMin": 0,
    "thicknessMax": 99,
    "toleranceClass": "STANDARD",
    "pricePerUnit": 185,
    "priceUnit": "EA",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": "Batch operation. 120 min minimum soak time regardless of unit count."
  },
  {
    "id": "recipe-012",
    "code": "VIS-INSPECT",
    "name": "Visual Inspection + MTR Verify",
    "description": "Dimensional check, visual inspection, MTR match",
    "operationType": "INSPECT",
    "division": "METALS",
    "workCenter": "QA-BENCH",
    "setupMinutes": 2,
    "runMinutesPerUnit": 5,
    "minRunMinutes": 5,
    "applicableMaterials": [],
    "applicableForms": [],
    "thicknessMin": 0,
    "thicknessMax": 99,
    "toleranceClass": "STANDARD",
    "pricePerUnit": 0,
    "priceUnit": "EA",
    "status": "ACTIVE",
    "version": 1,
    "createdBy": "admin",
    "notes": "No charge — included in processing. Required for certified orders."
  }
];

export const demoRoutingTemplates = [
  {
    "id": "rt-001",
    "name": "Plate – Cut to Size",
    "division": "METALS",
    "steps": [
      {
        "seq": 1,
        "recipeId": "recipe-002"
      },
      {
        "seq": 2,
        "recipeId": "recipe-008"
      }
    ]
  },
  {
    "id": "rt-002",
    "name": "Plate – Cut + Bend",
    "division": "METALS",
    "steps": [
      {
        "seq": 1,
        "recipeId": "recipe-002"
      },
      {
        "seq": 2,
        "recipeId": "recipe-004"
      },
      {
        "seq": 3,
        "recipeId": "recipe-008"
      }
    ]
  },
  {
    "id": "rt-003",
    "name": "Plate – Plasma Profile + Drill",
    "division": "METALS",
    "steps": [
      {
        "seq": 1,
        "recipeId": "recipe-003"
      },
      {
        "seq": 2,
        "recipeId": "recipe-006"
      },
      {
        "seq": 3,
        "recipeId": "recipe-008"
      },
      {
        "seq": 4,
        "recipeId": "recipe-012"
      }
    ]
  },
  {
    "id": "rt-004",
    "name": "Plate – Full Treatment",
    "division": "METALS",
    "steps": [
      {
        "seq": 1,
        "recipeId": "recipe-003"
      },
      {
        "seq": 2,
        "recipeId": "recipe-006"
      },
      {
        "seq": 3,
        "recipeId": "recipe-007"
      },
      {
        "seq": 4,
        "recipeId": "recipe-011"
      },
      {
        "seq": 5,
        "recipeId": "recipe-012"
      }
    ]
  },
  {
    "id": "rt-005",
    "name": "Plastic – Cut to Length",
    "division": "PLASTICS",
    "steps": [
      {
        "seq": 1,
        "recipeId": "recipe-009"
      }
    ]
  },
  {
    "id": "rt-006",
    "name": "Plastic – CNC Profile",
    "division": "PLASTICS",
    "steps": [
      {
        "seq": 1,
        "recipeId": "recipe-010"
      }
    ]
  }
];
