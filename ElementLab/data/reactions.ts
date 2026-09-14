export type Reaction = {
  reactants: [string, string]; // element symbols, order doesn't matter
  equation: string;
  productName: string;
  description: string;
};

export const REACTIONS: Reaction[] = [
  {
    reactants: ["H", "O"],
    equation: "2H\u2082 + O\u2082 \u2192 2H\u2082O",
    productName: "Water",
    description:
      "Hydrogen burns in oxygen to form water. This is a highly exothermic combustion reaction, releasing a large amount of energy as heat and light.",
  },
  {
    reactants: ["Na", "Cl"],
    equation: "2Na + Cl\u2082 \u2192 2NaCl",
    productName: "Sodium Chloride (Table Salt)",
    description:
      "Sodium metal reacts vigorously with chlorine gas, transferring an electron from sodium to chlorine to form an ionic compound: ordinary table salt.",
  },
  {
    reactants: ["Fe", "O"],
    equation: "4Fe + 3O\u2082 \u2192 2Fe\u2082O\u2083",
    productName: "Iron(III) Oxide (Rust)",
    description:
      "Iron reacts slowly with oxygen in the presence of moisture to form iron oxide, commonly known as rust.",
  },
  {
    reactants: ["C", "O"],
    equation: "C + O\u2082 \u2192 CO\u2082",
    productName: "Carbon Dioxide",
    description:
      "Carbon combines with oxygen during combustion to produce carbon dioxide gas, the same process that occurs when fuels burn.",
  },
  {
    reactants: ["H", "N"],
    equation: "N\u2082 + 3H\u2082 \u2192 2NH\u2083",
    productName: "Ammonia",
    description:
      "Nitrogen and hydrogen combine under high pressure and temperature (the Haber process) to produce ammonia, widely used in fertilizers.",
  },
  {
    reactants: ["Mg", "O"],
    equation: "2Mg + O\u2082 \u2192 2MgO",
    productName: "Magnesium Oxide",
    description:
      "Magnesium burns brightly in oxygen, releasing intense white light and forming magnesium oxide, a white solid.",
  },
  {
    reactants: ["Ca", "O"],
    equation: "2Ca + O\u2082 \u2192 2CaO",
    productName: "Calcium Oxide (Quicklime)",
    description:
      "Calcium reacts with oxygen to form calcium oxide, commonly known as quicklime, used in cement and construction.",
  },
  {
    reactants: ["K", "Cl"],
    equation: "2K + Cl\u2082 \u2192 2KCl",
    productName: "Potassium Chloride",
    description:
      "Potassium reacts vigorously, even explosively, with chlorine gas to form potassium chloride, an ionic salt used in fertilizers.",
  },
  {
    reactants: ["Zn", "S"],
    equation: "Zn + S \u2192 ZnS",
    productName: "Zinc Sulfide",
    description:
      "Zinc and sulfur combine directly to form zinc sulfide, a compound used in phosphors and pigments.",
  },
  {
    reactants: ["Cu", "O"],
    equation: "2Cu + O\u2082 \u2192 2CuO",
    productName: "Copper(II) Oxide",
    description:
      "Copper reacts with oxygen when heated, forming a black layer of copper(II) oxide on its surface.",
  },
  {
    reactants: ["Al", "O"],
    equation: "4Al + 3O\u2082 \u2192 2Al\u2082O\u2083",
    productName: "Aluminum Oxide",
    description:
      "Aluminum reacts with oxygen to form a thin, protective layer of aluminum oxide, which is why aluminum resists further corrosion.",
  },
  {
    reactants: ["H", "Cl"],
    equation: "H\u2082 + Cl\u2082 \u2192 2HCl",
    productName: "Hydrogen Chloride",
    description:
      "Hydrogen and chlorine gases combine to form hydrogen chloride gas, which dissolves in water to make hydrochloric acid.",
  },
  {
    reactants: ["Na", "O"],
    equation: "4Na + O\u2082 \u2192 2Na\u2082O",
    productName: "Sodium Oxide",
    description:
      "Sodium reacts with oxygen in air, tarnishing quickly, to form sodium oxide.",
  },
  {
    reactants: ["S", "O"],
    equation: "S + O\u2082 \u2192 SO\u2082",
    productName: "Sulfur Dioxide",
    description:
      "Sulfur burns in oxygen with a blue flame to produce sulfur dioxide, a gas associated with the smell of burnt matches.",
  },
  {
    reactants: ["Ag", "S"],
    equation: "2Ag + S \u2192 Ag\u2082S",
    productName: "Silver Sulfide",
    description:
      "Silver slowly reacts with trace sulfur compounds in air to form silver sulfide, the dark tarnish seen on silver jewelry.",
  },
];

function reactionKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

const reactionMap = new Map(
  REACTIONS.map((r) => [reactionKey(r.reactants[0], r.reactants[1]), r]),
);

// 4.2 - validate whether the selected combination has a supported reaction
export function findReaction(
  symbolA: string,
  symbolB: string,
): Reaction | undefined {
  return reactionMap.get(reactionKey(symbolA, symbolB));
}