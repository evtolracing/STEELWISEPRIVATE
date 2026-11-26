/**
 * Producing mills and plastics makers for the working inventory's heats and lots. Each is an organization of type
 * MILL. `heat` builds that producer's heat or lot number from a sequence, in the style its certificates use.
 * `makes` lists the grade codes it is picked for.
 */
const pad = (n, w) => String(n).padStart(w, '0');

export const mills = [
  { code: 'NUCOR-TUSCALOOSA', name: 'Nucor Steel Tuscaloosa', city: 'Tuscaloosa', state: 'AL', heat: (n) => `T${pad(41000 + n, 6)}`, makes: ['A36', 'A572-50', 'A516-70'] },
  { code: 'SSAB-MOBILE', name: 'SSAB Americas, Mobile', city: 'Axis', state: 'AL', heat: (n) => `M${pad(72300 + n, 6)}`, makes: ['A36', 'A572-50', 'A514-T1', 'AR400', 'AR500'] },
  { code: 'CLIFFS-BURNS-HARBOR', name: 'Cleveland-Cliffs Burns Harbor', city: 'Burns Harbor', state: 'IN', heat: (n) => `B4${pad(n, 5)}`, makes: ['A36', 'A516-70', 'A1011-CS'] },
  { code: 'NUCOR-BERKLEY', name: 'Nucor Steel Berkeley', city: 'Huger', state: 'SC', heat: (n) => `NB${pad(5520 + n, 6)}`, makes: ['A1011-CS', 'A1008-CS', 'A653-G90', 'A653-A40'] },
  { code: 'SDI-BUTLER', name: 'Steel Dynamics Butler', city: 'Butler', state: 'IN', heat: (n) => `${pad(2610 + n, 4)}A${pad(n % 97, 2)}`, makes: ['A1011-CS', 'A1008-CS', 'A653-G90'] },
  { code: 'CLIFFS-DEARBORN', name: 'Cleveland-Cliffs Dearborn Works', city: 'Dearborn', state: 'MI', heat: (n) => `D${pad(331000 + n, 6)}`, makes: ['A1008-CS', 'A653-G90', 'A653-A40'] },
  { code: 'NUCOR-MARION', name: 'Nucor Steel Marion', city: 'Marion', state: 'OH', heat: (n) => `MA${pad(18200 + n, 6)}`, makes: ['1018', '1045', 'A36'] },
  { code: 'REPUBLIC-CANTON', name: 'Republic Steel Canton', city: 'Canton', state: 'OH', heat: (n) => `RC${pad(9100 + n, 5)}`, makes: ['1018', '1045', '1144', '12L14'] },
  { code: 'METALLUS-CANTON', name: 'Metallus Canton (formerly TimkenSteel)', city: 'Canton', state: 'OH', heat: (n) => `${pad(2400000 + n * 13, 7)}`, makes: ['4140', '4140-HT', '4340', '8620'] },
  { code: 'NUCOR-YAMATO', name: 'Nucor-Yamato Steel', city: 'Blytheville', state: 'AR', heat: (n) => `NY${pad(60500 + n, 6)}`, makes: ['A992', 'A36', 'A529-50'] },
  { code: 'GERDAU-PETERSBURG', name: 'Gerdau Petersburg', city: 'Petersburg', state: 'VA', heat: (n) => `GP${pad(7700 + n, 6)}`, makes: ['A992', 'A36', 'A529-50'] },
  { code: 'ATLAS-TUBE', name: 'Atlas Tube Chicago', city: 'Chicago', state: 'IL', heat: (n) => `AT${pad(118000 + n, 7)}`, makes: ['A500-B', 'A500-C', 'A53-B'] },
  { code: 'NUCOR-TUBULAR', name: 'Nucor Tubular Products Marseilles', city: 'Marseilles', state: 'IL', heat: (n) => `NT${pad(44100 + n, 6)}`, makes: ['A500-B', 'A500-C', 'A53-B'] },
  { code: 'PLYMOUTH-TUBE', name: 'Plymouth Tube Company', city: 'Warrenville', state: 'IL', heat: (n) => `PT${pad(3300 + n, 5)}`, makes: ['A513-DOM'] },
  { code: 'NAS-GHENT', name: 'North American Stainless', city: 'Ghent', state: 'KY', heat: (n) => `${pad(825000 + n, 6)}`, makes: ['304', '304L', '316', '316L', '430', '201'] },
  { code: 'OUTOKUMPU-CALVERT', name: 'Outokumpu Stainless USA, Calvert', city: 'Calvert', state: 'AL', heat: (n) => `OC${pad(51200 + n, 6)}`, makes: ['304', '304L', '316', '316L', '430'] },
  { code: 'VALBRUNA-FT-WAYNE', name: 'Valbruna Stainless, Fort Wayne', city: 'Fort Wayne', state: 'IN', heat: (n) => `V${pad(29400 + n, 6)}`, makes: ['303', '304', '316', '410', '416', '17-4PH'] },
  { code: 'CARPENTER-READING', name: 'Carpenter Technology, Reading', city: 'Reading', state: 'PA', heat: (n) => `CR${pad(81000 + n, 6)}`, makes: ['17-4PH', '416', '303', 'A2', 'D2', 'O1', 'S7'] },
  { code: 'KAISER-TRENTWOOD', name: 'Kaiser Aluminum Trentwood', city: 'Spokane Valley', state: 'WA', heat: (n) => `KT${pad(660400 + n, 7)}`, makes: ['6061-T651', '7075-T651', '5052-H32', '3003-H14', '2024-T351'] },
  { code: 'ARCONIC-DAVENPORT', name: 'Arconic Davenport Works', city: 'Riverdale', state: 'IA', heat: (n) => `AD${pad(30200 + n, 6)}`, makes: ['6061-T651', '7075-T651', '5052-H32', '3003-H14', '3003-H22', '6061-T6'] },
  { code: 'KAISER-JACKSON', name: 'Kaiser Aluminum Jackson', city: 'Jackson', state: 'TN', heat: (n) => `KJ${pad(91000 + n, 6)}`, makes: ['6061-T6511', '6063-T52', '6061-T6', '2024-T351', '7075-T651'] },
  { code: 'VULCAN-GMS', name: 'Vulcan GMS Cast Plate', city: 'Foley', state: 'AL', heat: (n) => `VG${pad(7100 + n, 5)}`, makes: ['AL-CAST-TP'] },
  { code: 'FINKL-STEEL', name: 'A. Finkl & Sons', city: 'Chicago', state: 'IL', heat: (n) => `F${pad(412000 + n, 6)}`, makes: ['H13', 'P20', 'S7', '4140-HT'] },
  { code: 'MUELLER-PORT-HURON', name: 'Mueller Brass, Port Huron', city: 'Port Huron', state: 'MI', heat: (n) => `MB${pad(220500 + n, 7)}`, makes: ['C360', 'C464', 'C110'] },
  { code: 'WIELAND-CHASE', name: 'Wieland Chase, Montpelier', city: 'Montpelier', state: 'OH', heat: (n) => `WC${pad(78100 + n, 6)}`, makes: ['C360', 'C260', 'C464'] },
  { code: 'CONCAST', name: 'Concast Metal Products', city: 'Mercer', state: 'PA', heat: (n) => `CC${pad(5500 + n, 5)}`, makes: ['C932', 'C954'] },
  // Plastics makers: a heat here is the maker's production lot.
  { code: 'ROCHLING-DALLAS', name: 'Röchling Industrial, Dallas', city: 'Dallas', state: 'NC', heat: (n) => `L${pad(2611000 + n, 7)}`, makes: ['HDPE', 'UHMW', 'PP'] },
  { code: 'PLASKOLITE', name: 'Plaskolite', city: 'Columbus', state: 'OH', heat: (n) => `PK${pad(44700 + n, 6)}`, makes: ['ACRYLIC', 'PC'] },
  { code: 'VYCOM', name: 'Vycom Plastics', city: 'Moosic', state: 'PA', heat: (n) => `VY${pad(12900 + n, 6)}`, makes: ['PVC-1', 'PP'] },
  { code: 'SPARTECH', name: 'Spartech', city: 'Clayton', state: 'MO', heat: (n) => `SP${pad(8800 + n, 6)}`, makes: ['ABS', 'HDPE'] },
  { code: 'ENSINGER-WASHINGTON', name: 'Ensinger, Washington', city: 'Washington', state: 'PA', heat: (n) => `EW${pad(33100 + n, 6)}`, makes: ['ACETAL', 'NYLON-66', 'PTFE', 'PEEK'] },
  { code: 'MCAM-READING', name: 'Mitsubishi Chemical Advanced Materials, Reading', city: 'Reading', state: 'PA', heat: (n) => `MC${pad(19800 + n, 6)}`, makes: ['ACETAL', 'NYLON-66', 'PEEK', 'UHMW'] },
];

export const millsFor = (gradeCode) => mills.filter((m) => m.makes.includes(gradeCode));
