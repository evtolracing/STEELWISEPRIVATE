/**
 * Grades for the working inventory (owner, 2026-11-26: "a real looking inventory ... heats coils plates etc all
 * the basic steel stuff stainless etc. also ... plastics").
 *
 * Limits are the common published values of each standard: chemistry in weight percent, strength in psi,
 * elongation in percent, hardness in Brinell. `min`/`max` give the chemistry window a heat is generated inside;
 * an element with only a maximum is generated between 30% and 90% of it. Plastics carry their property data in
 * the same fields (tensile and elongation from the maker's data sheet) and no chemistry.
 */
const c = (max, min = {}) => ({ chemistryMax: max, chemistryMin: min });

export const grades = [
  // Carbon and HSLA plate
  { code: 'A36', name: 'ASTM A36 Carbon Structural', family: 'CARBON', specStandard: 'ASTM A36/A36M', ...c({ C: 0.26, Mn: 1.2, P: 0.04, S: 0.05, Si: 0.4, Cu: 0.2 }, { Mn: 0.6 }), tensileMin: 58000, tensileMax: 80000, yieldMin: 36000, elongationMin: 20 },
  { code: 'A572-50', name: 'ASTM A572 Grade 50 HSLA', family: 'HSLA', specStandard: 'ASTM A572/A572M Gr 50', ...c({ C: 0.23, Mn: 1.35, P: 0.03, S: 0.03, Si: 0.4, Cb: 0.05, V: 0.15 }, { Mn: 0.8 }), tensileMin: 65000, yieldMin: 50000, elongationMin: 18 },
  { code: 'A516-70', name: 'ASTM A516 Grade 70 Pressure Vessel', family: 'CARBON', specStandard: 'ASTM A516/A516M Gr 70', ...c({ C: 0.27, Mn: 1.2, P: 0.025, S: 0.025, Si: 0.4 }, { Mn: 0.85, Si: 0.15 }), tensileMin: 70000, tensileMax: 90000, yieldMin: 38000, elongationMin: 17 },
  { code: 'A514-T1', name: 'ASTM A514 Quenched and Tempered (T-1 type)', family: 'ALLOY', specStandard: 'ASTM A514/A514M Gr B', ...c({ C: 0.21, Mn: 1.0, P: 0.035, S: 0.035, Si: 0.35, Cr: 0.65, Mo: 0.25, B: 0.005 }, { C: 0.12, Mn: 0.7, Cr: 0.4, Mo: 0.15 }), tensileMin: 110000, tensileMax: 130000, yieldMin: 100000, elongationMin: 18 },
  { code: 'AR400', name: 'AR400 Abrasion Resistant', family: 'ALLOY', specStandard: 'AR400 (400 HBW nominal)', ...c({ C: 0.3, Mn: 1.6, P: 0.025, S: 0.01, Si: 0.7, Cr: 1.0, Mo: 0.5, B: 0.005 }, { C: 0.12 }), tensileMin: 180000, yieldMin: 145000, elongationMin: 10, hardnessMin: 360, hardnessMax: 444 },
  { code: 'AR500', name: 'AR500 Abrasion Resistant', family: 'ALLOY', specStandard: 'AR500 (500 HBW nominal)', ...c({ C: 0.35, Mn: 1.6, P: 0.025, S: 0.01, Si: 0.7, Cr: 1.2, Mo: 0.6, B: 0.005 }, { C: 0.2 }), tensileMin: 230000, yieldMin: 190000, elongationMin: 8, hardnessMin: 460, hardnessMax: 544 },
  // Carbon sheet and coil
  { code: 'A1011-CS', name: 'Hot Rolled Pickled & Oiled, Commercial Steel Type B', family: 'CARBON', specStandard: 'ASTM A1011 CS Type B', ...c({ C: 0.15, Mn: 0.6, P: 0.03, S: 0.035, Cu: 0.2 }, { C: 0.02 }), tensileMin: 45000, yieldMin: 30000, elongationMin: 25 },
  { code: 'A1008-CS', name: 'Cold Rolled Commercial Steel Type B (1008/1010)', family: 'CARBON', specStandard: 'ASTM A1008 CS Type B', ...c({ C: 0.15, Mn: 0.6, P: 0.03, S: 0.035, Cu: 0.2 }, { C: 0.02 }), tensileMin: 42000, yieldMin: 20000, elongationMin: 30 },
  { code: 'A653-G90', name: 'Galvanized Commercial Steel G90', family: 'CARBON', specStandard: 'ASTM A653 CS Type B G90', ...c({ C: 0.15, Mn: 0.6, P: 0.03, S: 0.035, Cu: 0.25 }, { C: 0.02 }), tensileMin: 42000, yieldMin: 30000, elongationMin: 20 },
  { code: 'A653-A40', name: 'Galvannealed Commercial Steel A40', family: 'CARBON', specStandard: 'ASTM A653 CS Type B A40', ...c({ C: 0.15, Mn: 0.6, P: 0.03, S: 0.035, Cu: 0.25 }, { C: 0.02 }), tensileMin: 42000, yieldMin: 30000, elongationMin: 20 },
  // Carbon and alloy bar
  { code: '1018', name: 'AISI 1018 Cold Finished', family: 'CARBON', specStandard: 'ASTM A108', ...c({ C: 0.2, Mn: 0.9, P: 0.04, S: 0.05 }, { C: 0.15, Mn: 0.6 }), tensileMin: 63800, yieldMin: 53700, elongationMin: 15, hardnessMin: 126 },
  { code: '1045', name: 'AISI 1045 Medium Carbon', family: 'CARBON', specStandard: 'ASTM A108 / A29', ...c({ C: 0.5, Mn: 0.9, P: 0.04, S: 0.05 }, { C: 0.43, Mn: 0.6 }), tensileMin: 82000, yieldMin: 45000, elongationMin: 16, hardnessMin: 163 },
  { code: '1144', name: 'AISI 1144 Stress Proof type', family: 'CARBON', specStandard: 'ASTM A311 Class B', ...c({ C: 0.48, Mn: 1.65, P: 0.04, S: 0.33 }, { C: 0.4, Mn: 1.35, S: 0.24 }), tensileMin: 115000, yieldMin: 100000, elongationMin: 8 },
  { code: '12L14', name: 'AISI 12L14 Leaded Free Machining', family: 'CARBON', specStandard: 'ASTM A108', ...c({ C: 0.15, Mn: 1.15, P: 0.09, S: 0.35, Pb: 0.35 }, { Mn: 0.85, P: 0.04, S: 0.26, Pb: 0.15 }), tensileMin: 78000, yieldMin: 60000, elongationMin: 10 },
  { code: '4140', name: 'AISI 4140 Annealed', family: 'ALLOY', specStandard: 'ASTM A322 / A331', ...c({ C: 0.43, Mn: 1.0, P: 0.035, S: 0.04, Si: 0.35, Cr: 1.1, Mo: 0.25 }, { C: 0.38, Mn: 0.75, Si: 0.15, Cr: 0.8, Mo: 0.15 }), tensileMin: 95000, yieldMin: 60000, elongationMin: 20, hardnessMax: 235 },
  { code: '4140-HT', name: 'AISI 4140 Heat Treated (28-32 HRC)', family: 'ALLOY', specStandard: 'ASTM A193 B7 / A434', ...c({ C: 0.43, Mn: 1.0, P: 0.035, S: 0.04, Si: 0.35, Cr: 1.1, Mo: 0.25 }, { C: 0.38, Mn: 0.75, Si: 0.15, Cr: 0.8, Mo: 0.15 }), tensileMin: 135000, yieldMin: 115000, elongationMin: 16, hardnessMin: 269, hardnessMax: 321 },
  { code: '4340', name: 'AISI 4340 Annealed', family: 'ALLOY', specStandard: 'ASTM A322 / AMS 6415', ...c({ C: 0.43, Mn: 0.8, P: 0.035, S: 0.04, Si: 0.35, Ni: 2.0, Cr: 0.9, Mo: 0.3 }, { C: 0.38, Mn: 0.6, Si: 0.15, Ni: 1.65, Cr: 0.7, Mo: 0.2 }), tensileMin: 108000, yieldMin: 68000, elongationMin: 22, hardnessMax: 248 },
  { code: '8620', name: 'AISI 8620 Carburizing', family: 'ALLOY', specStandard: 'ASTM A322', ...c({ C: 0.23, Mn: 0.9, P: 0.035, S: 0.04, Si: 0.35, Ni: 0.7, Cr: 0.6, Mo: 0.25 }, { C: 0.18, Mn: 0.7, Si: 0.15, Ni: 0.4, Cr: 0.4, Mo: 0.15 }), tensileMin: 77000, yieldMin: 55000, elongationMin: 25 },
  // Structural
  { code: 'A992', name: 'ASTM A992 Wide Flange', family: 'HSLA', specStandard: 'ASTM A992/A992M', ...c({ C: 0.23, Mn: 1.6, P: 0.035, S: 0.045, Si: 0.4, V: 0.15, Cb: 0.05, Cu: 0.6 }, { Mn: 0.5 }), tensileMin: 65000, yieldMin: 50000, yieldMax: 65000, elongationMin: 18 },
  { code: 'A529-50', name: 'ASTM A529 Grade 50 Channel and Angle', family: 'HSLA', specStandard: 'ASTM A529/A529M Gr 50', ...c({ C: 0.27, Mn: 1.35, P: 0.04, S: 0.05, Si: 0.4, Cu: 0.2 }), tensileMin: 70000, tensileMax: 100000, yieldMin: 50000, elongationMin: 18 },
  // Tube and pipe
  { code: 'A500-B', name: 'ASTM A500 Grade B Structural Tubing', family: 'CARBON', specStandard: 'ASTM A500 Gr B', ...c({ C: 0.26, Mn: 1.35, P: 0.035, S: 0.035, Cu: 0.2 }), tensileMin: 58000, yieldMin: 46000, elongationMin: 23 },
  { code: 'A500-C', name: 'ASTM A500 Grade C Structural Tubing', family: 'CARBON', specStandard: 'ASTM A500 Gr C', ...c({ C: 0.23, Mn: 1.35, P: 0.035, S: 0.035, Cu: 0.2 }), tensileMin: 62000, yieldMin: 50000, elongationMin: 21 },
  { code: 'A513-DOM', name: 'DOM Mechanical Tubing 1020/1026', family: 'CARBON', specStandard: 'ASTM A513 Type 5', ...c({ C: 0.28, Mn: 0.9, P: 0.035, S: 0.035 }, { C: 0.18, Mn: 0.6 }), tensileMin: 80000, yieldMin: 70000, elongationMin: 15 },
  { code: 'A53-B', name: 'ASTM A53 Grade B Pipe, ERW', family: 'CARBON', specStandard: 'ASTM A53/A53M Gr B Type E', ...c({ C: 0.3, Mn: 1.2, P: 0.05, S: 0.045, Cu: 0.4, Ni: 0.4, Cr: 0.4, Mo: 0.15 }), tensileMin: 60000, yieldMin: 35000, elongationMin: 21 },
  // Stainless
  { code: '304', name: '304 Stainless', family: 'STAINLESS', specStandard: 'ASTM A240 / A276', ...c({ C: 0.07, Mn: 2.0, P: 0.045, S: 0.03, Si: 0.75, Cr: 19.5, Ni: 10.5, N: 0.1 }, { Cr: 17.5, Ni: 8.0 }), tensileMin: 75000, yieldMin: 30000, elongationMin: 40, hardnessMax: 201 },
  { code: '304L', name: '304L Stainless', family: 'STAINLESS', specStandard: 'ASTM A240 / A276', ...c({ C: 0.03, Mn: 2.0, P: 0.045, S: 0.03, Si: 0.75, Cr: 19.5, Ni: 12.0, N: 0.1 }, { Cr: 17.5, Ni: 8.0 }), tensileMin: 70000, yieldMin: 25000, elongationMin: 40, hardnessMax: 201 },
  { code: '316', name: '316 Stainless', family: 'STAINLESS', specStandard: 'ASTM A240 / A276', ...c({ C: 0.08, Mn: 2.0, P: 0.045, S: 0.03, Si: 0.75, Cr: 18.0, Ni: 14.0, Mo: 3.0, N: 0.1 }, { Cr: 16.0, Ni: 10.0, Mo: 2.0 }), tensileMin: 75000, yieldMin: 30000, elongationMin: 40, hardnessMax: 217 },
  { code: '316L', name: '316L Stainless', family: 'STAINLESS', specStandard: 'ASTM A240 / A276', ...c({ C: 0.03, Mn: 2.0, P: 0.045, S: 0.03, Si: 0.75, Cr: 18.0, Ni: 14.0, Mo: 3.0, N: 0.1 }, { Cr: 16.0, Ni: 10.0, Mo: 2.0 }), tensileMin: 70000, yieldMin: 25000, elongationMin: 40, hardnessMax: 217 },
  { code: '430', name: '430 Stainless (ferritic)', family: 'STAINLESS', specStandard: 'ASTM A240', ...c({ C: 0.12, Mn: 1.0, P: 0.04, S: 0.03, Si: 1.0, Cr: 18.0, Ni: 0.75 }, { Cr: 16.0 }), tensileMin: 65000, yieldMin: 30000, elongationMin: 22, hardnessMax: 183 },
  { code: '201', name: '201 Stainless', family: 'STAINLESS', specStandard: 'ASTM A240', ...c({ C: 0.15, Mn: 7.5, P: 0.06, S: 0.03, Si: 1.0, Cr: 18.0, Ni: 5.5, N: 0.25 }, { Mn: 5.5, Cr: 16.0, Ni: 3.5 }), tensileMin: 95000, yieldMin: 38000, elongationMin: 40 },
  { code: '303', name: '303 Stainless Free Machining', family: 'STAINLESS', specStandard: 'ASTM A582', ...c({ C: 0.15, Mn: 2.0, P: 0.2, S: 0.35, Si: 1.0, Cr: 19.0, Ni: 10.0 }, { S: 0.15, Cr: 17.0, Ni: 8.0 }), tensileMin: 75000, yieldMin: 30000, elongationMin: 35, hardnessMax: 262 },
  { code: '410', name: '410 Stainless (martensitic)', family: 'STAINLESS', specStandard: 'ASTM A276', ...c({ C: 0.15, Mn: 1.0, P: 0.04, S: 0.03, Si: 1.0, Cr: 13.5 }, { C: 0.08, Cr: 11.5 }), tensileMin: 70000, yieldMin: 40000, elongationMin: 20 },
  { code: '416', name: '416 Stainless Free Machining', family: 'STAINLESS', specStandard: 'ASTM A582', ...c({ C: 0.15, Mn: 1.25, P: 0.06, S: 0.35, Si: 1.0, Cr: 14.0 }, { S: 0.15, Cr: 12.0 }), tensileMin: 70000, yieldMin: 40000, elongationMin: 20 },
  { code: '17-4PH', name: '17-4 PH Stainless, Condition A', family: 'STAINLESS', specStandard: 'ASTM A564 Type 630', ...c({ C: 0.07, Mn: 1.0, P: 0.04, S: 0.03, Si: 1.0, Cr: 17.5, Ni: 5.0, Cu: 5.0, Cb: 0.45 }, { Cr: 15.0, Ni: 3.0, Cu: 3.0, Cb: 0.15 }), tensileMin: 145000, yieldMin: 115000, elongationMin: 10, hardnessMax: 363 },
  // Aluminum
  { code: '3003-H14', name: 'Aluminum 3003-H14', family: 'ALUMINUM', specStandard: 'ASTM B209', ...c({ Si: 0.6, Fe: 0.7, Cu: 0.2, Mn: 1.5, Zn: 0.1 }, { Cu: 0.05, Mn: 1.0 }), tensileMin: 20000, tensileMax: 26000, yieldMin: 17000, elongationMin: 1 },
  { code: '3003-H22', name: 'Aluminum 3003-H22 Tread Plate', family: 'ALUMINUM', specStandard: 'ASTM B632', ...c({ Si: 0.6, Fe: 0.7, Cu: 0.2, Mn: 1.5, Zn: 0.1 }, { Cu: 0.05, Mn: 1.0 }), tensileMin: 20000, yieldMin: 15000, elongationMin: 4 },
  { code: '5052-H32', name: 'Aluminum 5052-H32', family: 'ALUMINUM', specStandard: 'ASTM B209', ...c({ Si: 0.25, Fe: 0.4, Cu: 0.1, Mn: 0.1, Mg: 2.8, Cr: 0.35, Zn: 0.1 }, { Mg: 2.2, Cr: 0.15 }), tensileMin: 31000, tensileMax: 38000, yieldMin: 23000, elongationMin: 4 },
  { code: '6061-T6', name: 'Aluminum 6061-T6', family: 'ALUMINUM', specStandard: 'ASTM B209 / B221', ...c({ Si: 0.8, Fe: 0.7, Cu: 0.4, Mn: 0.15, Mg: 1.2, Cr: 0.35, Zn: 0.25, Ti: 0.15 }, { Si: 0.4, Cu: 0.15, Mg: 0.8, Cr: 0.04 }), tensileMin: 42000, yieldMin: 35000, elongationMin: 8 },
  { code: '6061-T651', name: 'Aluminum 6061-T651 Plate', family: 'ALUMINUM', specStandard: 'ASTM B209', ...c({ Si: 0.8, Fe: 0.7, Cu: 0.4, Mn: 0.15, Mg: 1.2, Cr: 0.35, Zn: 0.25, Ti: 0.15 }, { Si: 0.4, Cu: 0.15, Mg: 0.8, Cr: 0.04 }), tensileMin: 42000, yieldMin: 35000, elongationMin: 9 },
  { code: '6061-T6511', name: 'Aluminum 6061-T6511 Extruded', family: 'ALUMINUM', specStandard: 'ASTM B221', ...c({ Si: 0.8, Fe: 0.7, Cu: 0.4, Mn: 0.15, Mg: 1.2, Cr: 0.35, Zn: 0.25, Ti: 0.15 }, { Si: 0.4, Cu: 0.15, Mg: 0.8, Cr: 0.04 }), tensileMin: 38000, yieldMin: 35000, elongationMin: 8 },
  { code: '6063-T52', name: 'Aluminum 6063-T52 Architectural', family: 'ALUMINUM', specStandard: 'ASTM B221', ...c({ Si: 0.6, Fe: 0.35, Cu: 0.1, Mn: 0.1, Mg: 0.9, Cr: 0.1, Zn: 0.1, Ti: 0.1 }, { Si: 0.2, Mg: 0.45 }), tensileMin: 22000, tensileMax: 30000, yieldMin: 16000, elongationMin: 8 },
  { code: '7075-T651', name: 'Aluminum 7075-T651', family: 'ALUMINUM', specStandard: 'ASTM B209 / AMS 4045', ...c({ Si: 0.4, Fe: 0.5, Cu: 2.0, Mn: 0.3, Mg: 2.9, Cr: 0.28, Zn: 6.1, Ti: 0.2 }, { Cu: 1.2, Mg: 2.1, Cr: 0.18, Zn: 5.1 }), tensileMin: 78000, yieldMin: 68000, elongationMin: 7 },
  { code: '2024-T351', name: 'Aluminum 2024-T351', family: 'ALUMINUM', specStandard: 'ASTM B211 / AMS-QQ-A-225/6', ...c({ Si: 0.5, Fe: 0.5, Cu: 4.9, Mn: 0.9, Mg: 1.8, Cr: 0.1, Zn: 0.25, Ti: 0.15 }, { Cu: 3.8, Mn: 0.3, Mg: 1.2 }), tensileMin: 62000, yieldMin: 42000, elongationMin: 10 },
  { code: 'AL-CAST-TP', name: 'Cast Aluminum Tooling Plate (5083 type)', family: 'ALUMINUM', specStandard: 'Cast and stress relieved, +/-0.005" flatness', ...c({ Si: 0.4, Fe: 0.4, Cu: 0.1, Mn: 1.0, Mg: 4.9, Cr: 0.25, Zn: 0.25 }, { Mn: 0.4, Mg: 4.0, Cr: 0.05 }), tensileMin: 24000, yieldMin: 15000, elongationMin: 3 },
  // Tool steel
  { code: 'A2', name: 'A2 Air Hardening Tool Steel', family: 'TOOL', specStandard: 'ASTM A681 A2', ...c({ C: 1.05, Mn: 1.0, Si: 0.5, Cr: 5.5, Mo: 1.4, V: 0.5 }, { C: 0.95, Mn: 0.4, Cr: 4.75, Mo: 0.9, V: 0.15 }), hardnessMax: 248 },
  { code: 'D2', name: 'D2 High Carbon High Chrome Tool Steel', family: 'TOOL', specStandard: 'ASTM A681 D2', ...c({ C: 1.6, Mn: 0.6, Si: 0.6, Cr: 13.0, Mo: 1.2, V: 1.1 }, { C: 1.4, Cr: 11.0, Mo: 0.7, V: 0.5 }), hardnessMax: 255 },
  { code: 'O1', name: 'O1 Oil Hardening Tool Steel', family: 'TOOL', specStandard: 'ASTM A681 O1', ...c({ C: 1.0, Mn: 1.4, Si: 0.5, Cr: 0.7, W: 0.6, V: 0.3 }, { C: 0.85, Mn: 1.0, Cr: 0.4, W: 0.4 }), hardnessMax: 212 },
  { code: 'S7', name: 'S7 Shock Resisting Tool Steel', family: 'TOOL', specStandard: 'ASTM A681 S7', ...c({ C: 0.55, Mn: 0.8, Si: 1.0, Cr: 3.5, Mo: 1.8, V: 0.35 }, { C: 0.45, Mn: 0.2, Si: 0.2, Cr: 3.0, Mo: 1.3 }), hardnessMax: 223 },
  { code: 'H13', name: 'H13 Hot Work Tool Steel', family: 'TOOL', specStandard: 'ASTM A681 H13', ...c({ C: 0.45, Mn: 0.5, Si: 1.2, Cr: 5.5, Mo: 1.75, V: 1.2 }, { C: 0.32, Mn: 0.2, Si: 0.8, Cr: 4.75, Mo: 1.1, V: 0.8 }), hardnessMax: 235 },
  { code: 'P20', name: 'P20 Prehardened Mold Steel (28-32 HRC)', family: 'TOOL', specStandard: 'ASTM A681 P20', ...c({ C: 0.4, Mn: 1.0, Si: 0.8, Cr: 1.2, Mo: 0.55 }, { C: 0.28, Mn: 0.6, Si: 0.2, Cr: 0.9, Mo: 0.3 }), hardnessMin: 269, hardnessMax: 321 },
  // Brass, copper and bronze
  { code: 'C360', name: 'C360 Free Cutting Brass', family: 'NONFERROUS', specStandard: 'ASTM B16', ...c({ Cu: 63.0, Pb: 3.7, Fe: 0.35 }, { Cu: 60.0, Pb: 2.5 }), tensileMin: 48000, yieldMin: 20000, elongationMin: 15 },
  { code: 'C260', name: 'C260 Cartridge Brass, Half Hard', family: 'NONFERROUS', specStandard: 'ASTM B36', ...c({ Cu: 71.5, Pb: 0.07, Fe: 0.05 }, { Cu: 68.5 }), tensileMin: 57000, tensileMax: 67000, elongationMin: 10 },
  { code: 'C464', name: 'C464 Naval Brass', family: 'NONFERROUS', specStandard: 'ASTM B21', ...c({ Cu: 62.0, Sn: 1.0, Pb: 0.2, Fe: 0.1 }, { Cu: 59.0, Sn: 0.5 }), tensileMin: 60000, yieldMin: 27000, elongationMin: 20 },
  { code: 'C110', name: 'C110 Electrolytic Tough Pitch Copper, Half Hard', family: 'NONFERROUS', specStandard: 'ASTM B152 / B187', ...c({ O: 0.04 }, { Cu: 99.9 }), tensileMin: 37000, tensileMax: 46000, elongationMin: 12 },
  { code: 'C932', name: 'C932 Bearing Bronze (SAE 660)', family: 'NONFERROUS', specStandard: 'ASTM B505', ...c({ Cu: 85.0, Sn: 7.5, Pb: 8.0, Zn: 4.0, Fe: 0.2, Ni: 1.0 }, { Cu: 81.0, Sn: 6.3, Pb: 6.0, Zn: 2.0 }), tensileMin: 30000, yieldMin: 14000, elongationMin: 10 },
  { code: 'C954', name: 'C954 Aluminum Bronze', family: 'NONFERROUS', specStandard: 'ASTM B505', ...c({ Cu: 87.0, Al: 11.5, Fe: 5.0, Mn: 0.5, Ni: 1.5 }, { Cu: 83.0, Al: 10.0, Fe: 3.0 }), tensileMin: 85000, yieldMin: 32000, elongationMin: 12 },
  // Plastics (property values from typical maker data sheets)
  { code: 'HDPE', name: 'HDPE, Natural and Colors', family: 'PLASTIC', specStandard: 'ASTM D4976', tensileMin: 4000, elongationMin: 400 },
  { code: 'UHMW', name: 'UHMW Polyethylene, Virgin', family: 'PLASTIC', specStandard: 'ASTM D4020', tensileMin: 5800, elongationMin: 300 },
  { code: 'ACRYLIC', name: 'Cast Acrylic Sheet (PMMA)', family: 'PLASTIC', specStandard: 'ASTM D4802', tensileMin: 10000, elongationMin: 4 },
  { code: 'PC', name: 'Polycarbonate, Clear', family: 'PLASTIC', specStandard: 'ASTM D3935', tensileMin: 9000, elongationMin: 100 },
  { code: 'PVC-1', name: 'PVC Type I, Gray', family: 'PLASTIC', specStandard: 'ASTM D1784 Cell 12454', tensileMin: 7000, elongationMin: 30 },
  { code: 'ABS', name: 'ABS, Machine Grade', family: 'PLASTIC', specStandard: 'ASTM D4673', tensileMin: 5800, elongationMin: 20 },
  { code: 'ACETAL', name: 'Acetal Copolymer (POM-C)', family: 'PLASTIC', specStandard: 'ASTM D6100', tensileMin: 9500, elongationMin: 30 },
  { code: 'NYLON-66', name: 'Nylon 6/6, Extruded', family: 'PLASTIC', specStandard: 'ASTM D6779', tensileMin: 11000, elongationMin: 30 },
  { code: 'PTFE', name: 'PTFE, Virgin', family: 'PLASTIC', specStandard: 'ASTM D3294', tensileMin: 3500, elongationMin: 250 },
  { code: 'PEEK', name: 'PEEK, Unfilled', family: 'PLASTIC', specStandard: 'ASTM D8033', tensileMin: 14000, elongationMin: 20 },
  { code: 'PP', name: 'Polypropylene Homopolymer', family: 'PLASTIC', specStandard: 'ASTM D4101', tensileMin: 4800, elongationMin: 12 },
];

export const gradeByCode = Object.fromEntries(grades.map((g) => [g.code, g]));
