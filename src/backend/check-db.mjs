import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BOM recipes to Supabase...');
  
  // Create sample BOM recipes
  const recipes = [
    {
      name: '6061 Aluminum Plate Standard Processing',
      code: 'REC-AL6061-PLATE-STD',
      materialCode: 'AL-6061-100',
      commodity: 'ALUMINUM',
      form: 'PLATE',
      grade: '6061-T6',
      thicknessMin: 0.5,
      thicknessMax: 2.0,
      division: 'METALS',
      version: 1,
      status: 'ACTIVE',
      operations: {
        create: [
          { sequence: 1, name: 'SAW CUT', workCenterType: 'SAW', estimatedMachineMinutes: 15, estimatedLaborMinutes: 10, setupMinutes: 5, parameters: { tolerance: '±0.030"', blade_type: 'CARBIDE_ALUMINUM' } },
          { sequence: 2, name: 'DEBURR', workCenterType: 'FINISHING', estimatedMachineMinutes: 8, estimatedLaborMinutes: 12, setupMinutes: 2, parameters: { edge_finish: 'DEBURR_ALL_EDGES' } },
          { sequence: 3, name: 'PACK', workCenterType: 'PACKOUT', estimatedMachineMinutes: 0, estimatedLaborMinutes: 5, setupMinutes: 1, parameters: { protection: 'KRAFT_PAPER_WRAP' } },
        ]
      }
    },
    {
      name: 'A36 Steel Sheet Basic Processing',
      code: 'REC-A36-SHEET-BASIC',
      materialCode: 'HR-0125-48',
      commodity: 'STEEL',
      form: 'SHEET',
      grade: 'A36',
      thicknessMin: 0.0625,
      thicknessMax: 0.250,
      division: 'METALS',
      version: 1,
      status: 'ACTIVE',
      operations: {
        create: [
          { sequence: 1, name: 'SHEAR CUT', workCenterType: 'SHEAR', estimatedMachineMinutes: 5, estimatedLaborMinutes: 8, setupMinutes: 3, parameters: { tolerance: '±0.0625"' } },
          { sequence: 2, name: 'PACK', workCenterType: 'PACKOUT', estimatedMachineMinutes: 0, estimatedLaborMinutes: 4, setupMinutes: 1, parameters: { protection: 'VCI_PAPER' } },
        ]
      }
    },
    {
      name: 'Stainless 304 Sheet Premium Processing',
      code: 'REC-SS304-SHEET-PREMIUM',
      materialCode: 'SS-304-0048-48',
      commodity: 'STAINLESS',
      form: 'SHEET',
      grade: '304',
      thicknessMin: 0.035,
      thicknessMax: 0.125,
      division: 'METALS',
      version: 1,
      status: 'ACTIVE',
      operations: {
        create: [
          { sequence: 1, name: 'SHEAR CUT', workCenterType: 'SHEAR', estimatedMachineMinutes: 8, estimatedLaborMinutes: 10, setupMinutes: 5, parameters: { tolerance: '±0.030"' } },
          { sequence: 2, name: 'DEBURR', workCenterType: 'FINISHING', estimatedMachineMinutes: 10, estimatedLaborMinutes: 15, setupMinutes: 2, parameters: { edge_finish: 'SMOOTH_ALL_EDGES' } },
          { sequence: 3, name: 'PROTECTIVE FILM', workCenterType: 'FINISHING', estimatedMachineMinutes: 0, estimatedLaborMinutes: 8, setupMinutes: 1, parameters: { film_type: 'BLUE_PROTECTIVE_FILM' } },
          { sequence: 4, name: 'PACK', workCenterType: 'PACKOUT', estimatedMachineMinutes: 0, estimatedLaborMinutes: 5, setupMinutes: 1, parameters: { protection: 'INTERLEAVED_PAPER' } },
        ]
      }
    },
    {
      name: 'Acrylic Sheet Standard Processing',
      code: 'REC-ACRYLIC-SHEET-STD',
      materialCode: 'ACRY-CLR-0250',
      commodity: 'PLASTICS',
      form: 'SHEET',
      grade: 'ACRYLIC',
      thicknessMin: 0.125,
      thicknessMax: 0.500,
      division: 'PLASTICS',
      version: 1,
      status: 'ACTIVE',
      operations: {
        create: [
          { sequence: 1, name: 'ROUTER CUT', workCenterType: 'ROUTER', estimatedMachineMinutes: 20, estimatedLaborMinutes: 15, setupMinutes: 10, parameters: { bit_type: 'SPIRAL_UPCUT' } },
          { sequence: 2, name: 'EDGE POLISH', workCenterType: 'FINISHING', estimatedMachineMinutes: 12, estimatedLaborMinutes: 18, setupMinutes: 3, parameters: { finish: 'FLAME_POLISH' } },
          { sequence: 3, name: 'PACK', workCenterType: 'PACKOUT', estimatedMachineMinutes: 0, estimatedLaborMinutes: 6, setupMinutes: 1, parameters: { protection: 'MASKING_FILM_BOTH_SIDES' } },
        ]
      }
    },
  ];
  
  for (const recipe of recipes) {
    try {
      const created = await prisma.bomRecipe.create({
        data: recipe,
        include: { operations: true }
      });
      console.log(`✅ Created: ${created.name} (${created.operations.length} operations)`);
    } catch (e) {
      if (e.code === 'P2002') {
        console.log(`⏭️  Skipped (already exists): ${recipe.name}`);
      } else {
        console.error(`❌ Error creating ${recipe.name}:`, e.message);
      }
    }
  }
  
  // Verify
  const count = await prisma.bomRecipe.count();
  console.log(`\n✅ Total BOM recipes in database: ${count}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  prisma.$disconnect();
});
