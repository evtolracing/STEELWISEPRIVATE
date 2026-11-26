/**
 * Density of the materials the store and the working inventory weigh, in lb per cubic inch, by material family
 * (the store listing's family, or the product's category on older products). A few grades differ enough from
 * their family to carry their own value.
 */
export const DENSITY = {
  'Carbon Steel': 0.2836, 'Alloy Steel': 0.2836, 'HSLA Steel': 0.2836, 'Tool Steel': 0.283, 'Stainless Steel': 0.289,
  Aluminum: 0.0975, Brass: 0.307, Copper: 0.323, Bronze: 0.32, 'Brass & Copper': 0.307,
  Polyethylene: 0.0343, 'Ultra-High MW': 0.0336, Acrylic: 0.043, Polycarbonate: 0.0433, PVC: 0.0502, ABS: 0.0376,
  Acetal: 0.0513, Nylon: 0.0412, PTFE: 0.0784, PEEK: 0.0473, Polypropylene: 0.0325,
};
export const STEEL_DENSITY = 0.2836;
const GRADE_DENSITY = { '7075-T651': 0.101, '2024-T351': 0.1, C954: 0.269, C464: 0.304 };

/** Density for a family and grade; steel when neither is known. */
export const densityFor = (family, gradeCode) => GRADE_DENSITY[gradeCode] || DENSITY[family] || STEEL_DENSITY;
