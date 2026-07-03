export const CHECKLIST_ITEMS = [
  // 1. Pneumatic Part
  { id: "1.1", category: "1. Pneumatic Part", label: "FRL", criteria: "Ensure FRL is not leaking, air pressure within 0.4~0.6MPa", method: "Visual, listen & touch", image: "/checklist-images/1_1.jpg" },
  { id: "1.2", category: "1. Pneumatic Part", label: "Cylinder", criteria: "Ensure cylinder is functioning properly and not leaking", method: "Visual, listen & touch", image: "/checklist-images/1_2.jpg" },
  { id: "1.3", category: "1. Pneumatic Part", label: "Tubing", criteria: "Ensure tubing is functioning properly and not leaking", method: "Visual, listen & touch", image: "/checklist-images/1_3.jpg" },
  { id: "1.4", category: "1. Pneumatic Part", label: "Fitting", criteria: "Ensure fitting is functioning properly and not leaking", method: "Visual, listen & touch", image: "/checklist-images/1_4.jpg" },
  // 2. Machining Part
  { id: "2.1", category: "2. Machining Part", label: "Guide Pin", criteria: "Ensure guide pin is not loose and clean from spatter", method: "Visual & touch", image: "/checklist-images/2_1.jpg" },
  { id: "2.2", category: "2. Machining Part", label: "Guide Block", criteria: "Ensure guide block is not loose and clean from spatter", method: "Visual & touch", image: "/checklist-images/2_2.jpg" },
  { id: "2.3", category: "2. Machining Part", label: "Clamp", criteria: "Ensure clamp is not loose and tight on part, clean from spatter", method: "Visual & touch", image: "/checklist-images/2_3.jpg" },
  { id: "2.4", category: "2. Machining Part", label: "Ejector", criteria: "Ensure ejector/lifter is functioning properly", method: "Visual & touch", image: "/checklist-images/2_4.jpg" },
  // 3. Jig Component
  { id: "3.1", category: "3. Jig Component", label: "Bolt", criteria: "Ensure bolt on jig is not loose (check I-Mark), clean from spatter", method: "Visual & touch", image: "/checklist-images/3_1.jpg" },
  // 4. Control Point
  { id: "4.1", category: "4. Control Point", label: "Pokayoke Pin", criteria: "Ensure pokayoke is functioning properly", method: "Visual & touch", image: "/checklist-images/4_1.jpg" },
  { id: "4.2", category: "4. Control Point", label: "Guide Pin A", criteria: "Ensure guide pin size is within standard", method: "Measure (vernier caliper)", image: "/checklist-images/4_2.jpg" },
  { id: "4.3", category: "4. Control Point", label: "Guide Pin B", criteria: "Ensure guide pin size is within standard", method: "Measure (vernier caliper)", image: "/checklist-images/4_3.jpg", measurements: { A: { label: "RH (Ø9.8±)", nominal: 9.8, tolerance: 0.3 }, B: { label: "LH (Ø15.8±)", nominal: 15.8, tolerance: 0.3 } } },
  { id: "4.4", category: "4. Control Point", label: "Guide Pin C", criteria: "Ensure guide pin size is within standard", method: "Measure (vernier caliper)", image: "/checklist-images/4_4.jpg", measurements: { A: { label: "RH (Ø9.8±)", nominal: 9.8, tolerance: 0.3 }, B: { label: "LH (Ø15.8±)", nominal: 15.8, tolerance: 0.3 } } },
  { id: "4.5", category: "4. Control Point", label: "Guide Pin D", criteria: "Ensure guide pin size is within standard", method: "Measure (vernier caliper)", image: "/checklist-images/4_5.jpg", measurements: { A: { label: "RH (Ø6.8±)", nominal: 6.8, tolerance: 0.3 }, B: { label: "LH (Ø6.8±)", nominal: 6.8, tolerance: 0.3 } } },
];

export const CATEGORIES = [...new Set(CHECKLIST_ITEMS.map(i => i.category))];