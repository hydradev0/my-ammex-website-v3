export const itemsData = [
  {
    itemCode: 'DR001',
    itemName: 'Drill',
    quantity: 30,
    unit: 'pcs',
    price: 342.50,
    floorPrice: 300.00,
    ceilingPrice: 380.00,
    category: 'Drill',
    vendor: 'Vendor D',
    description: 'Industrial drill bits for metal work',
    minLevel: 10, // current minimum stock level
    maxLevel: 500,
    unitsSold: 27 // monthly sales
  },
  {
    itemCode: 'DR002',
    itemName: 'Drill',
    quantity: 30,
    unit: 'pcs',
    price: 342.50,
    floorPrice: 300.00,
    ceilingPrice: 380.00,
    category: 'Drill',
    vendor: 'Vendor D',
    description: 'Industrial drill bits for metal work',
    minLevel: 10, // current minimum stock level
    maxLevel: 500,
    unitsSold: 27 // monthly sales
  },
  {
    itemCode: 'MK001',
    itemName: 'Marker',
    quantity: 45,
    unit: 'pcs',
    price: 244.75,
    floorPrice: 220.00,
    ceilingPrice: 270.00,
    category: 'Marker',
    vendor: 'Vendor C',
    description: 'Permanent markers for labeling',
    minLevel: 8, // current minimum stock level
    maxLevel: 5000,
    unitsSold: 5 // monthly sales
  },
  {
    itemCode: 'HA002',
    itemName: 'Wrenches',
    quantity: 12,
    unit: 'pcs',
    price: 150.00,
    floorPrice: 135.00,
    ceilingPrice: 165.00,
    category: 'Tools',
    vendor: 'Vendor B',
    description: 'Set of wrenches',
    minLevel: 10, // current minimum stock level
    maxLevel: 200,
    unitsSold: 35 // monthly sales
  },
  {
    itemCode: 'RM001',
    itemName: 'Steel',
    quantity: 8,
    unit: 'kg',
    price: 122.50,
    floorPrice: 100.00,
    ceilingPrice: 150.00,
    category: 'Raw Materials',
    vendor: 'Vendor A',
    description: 'High-quality steel sheet for manufacturing',
    minLevel: 10, // current minimum stock level
    maxLevel: 2000,
    unitsSold: 12 // monthly sales
  },
  {
    itemCode: 'GR001',
    itemName: 'Grinder',
    quantity: 25,
    unit: 'pcs',
    price: 200.00,
    floorPrice: 180.00,
    ceilingPrice: 220.00,
    category: 'Tools',
    vendor: 'Vendor E',
    description: 'Electric grinder for metal work',
    minLevel: 5, // current minimum stock level
    maxLevel: 100,
    unitsSold: 15 // monthly sales
  },
  {
    itemCode: 'HA003',
    itemName: 'Hammer',
    quantity: 4,
    unit: 'pcs',
    price: 120.00,
    floorPrice: 100.00,
    ceilingPrice: 140.00,
    category: 'Tools',
    vendor: 'Vendor F',
    description: '16oz claw hammer',
    minLevel: 5, // current minimum stock level
    maxLevel: 100,
    unitsSold: 8 // monthly sales
  },
  {
    itemCode: 'HA004',
    itemName: 'Hammer',
    quantity: 4,
    unit: 'pcs',
    price: 120.00,
    floorPrice: 100.00,
    ceilingPrice: 140.00,
    category: 'Tools',
    vendor: 'Vendor F',
    description: '16oz claw hammer',
    minLevel: 5, // current minimum stock level
    maxLevel: 100,
    unitsSold: 8 // monthly sales
  },
  {
    itemCode: 'HA005',
    itemName: 'Hammer',
    quantity: 4,
    unit: 'pcs',
    price: 120.00,
    floorPrice: 100.00,
    ceilingPrice: 140.00,
    category: 'Tools',
    vendor: 'Vendor F',
    description: '16oz claw hammer',
    minLevel: 5, // current minimum stock level
    maxLevel: 100,
    unitsSold: 8 // monthly sales
  },
  {
    itemCode: 'HA006',
    itemName: 'Hammer',
    quantity: 4,
    unit: 'pcs',
    price: 120.00,
    floorPrice: 100.00,
    ceilingPrice: 140.00,
    category: 'Tools',
    vendor: 'Vendor F',
    description: '16oz claw hammer',
    minLevel: 5, // current minimum stock level
    maxLevel: 100,
    unitsSold: 8 // monthly sales
  },
  {
    itemCode: 'HA007',
    itemName: 'Hammer',
    quantity: 4,
    unit: 'pcs',
    price: 120.00,
    floorPrice: 100.00,
    ceilingPrice: 140.00,
    category: 'Tools',
    vendor: 'Vendor F',
    description: '16oz claw hammer',
    minLevel: 5, // current minimum stock level
    maxLevel: 100,
    unitsSold: 8 // monthly sales
  }
]; 

// Function to generate large datasets for testing pagination
export const generateLargeItemsData = (count = 100) => {
  const categories = ['Tools', 'Raw Materials', 'Electronics', 'Safety Equipment', 'Fasteners', 'Lubricants', 'Measuring Tools', 'Welding Supplies'];
  const vendors = ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E', 'Vendor F', 'Vendor G', 'Vendor H'];
  const units = ['pcs', 'kg', 'm', 'L', 'boxes', 'sets', 'rolls', 'pairs'];
  
  const baseItems = [
    { name: 'Drill Bit', basePrice: 50, baseQuantity: 100 },
    { name: 'Screwdriver', basePrice: 25, baseQuantity: 200 },
    { name: 'Wrench Set', basePrice: 150, baseQuantity: 50 },
    { name: 'Steel Sheet', basePrice: 100, baseQuantity: 80 },
    { name: 'Safety Glasses', basePrice: 15, baseQuantity: 300 },
    { name: 'Measuring Tape', basePrice: 30, baseQuantity: 150 },
    { name: 'Wire Cutters', basePrice: 45, baseQuantity: 120 },
    { name: 'Paint Brush', basePrice: 8, baseQuantity: 500 },
    { name: 'Sanding Paper', basePrice: 12, baseQuantity: 400 },
    { name: 'Cable Ties', basePrice: 5, baseQuantity: 1000 },
    { name: 'Lubricating Oil', basePrice: 35, baseQuantity: 60 },
    { name: 'Welding Rods', basePrice: 80, baseQuantity: 40 },
    { name: 'Pipe Fittings', basePrice: 20, baseQuantity: 250 },
    { name: 'Electrical Wire', basePrice: 40, baseQuantity: 100 },
    { name: 'Concrete Mix', basePrice: 25, baseQuantity: 200 },
    { name: 'Insulation Tape', basePrice: 10, baseQuantity: 300 },
    { name: 'Screw Set', basePrice: 18, baseQuantity: 400 },
    { name: 'Nail Assortment', basePrice: 12, baseQuantity: 350 },
    { name: 'Adhesive Glue', basePrice: 22, baseQuantity: 180 },
    { name: 'Cleaning Solvent', basePrice: 28, baseQuantity: 120 }
  ];

  const generatedItems = [];

  for (let i = 0; i < count; i++) {
    const baseItem = baseItems[i % baseItems.length];
    const category = categories[i % categories.length];
    const vendor = vendors[i % vendors.length];
    const unit = units[i % units.length];
    
    // Add variation to make items unique
    const variation = Math.floor(i / baseItems.length) + 1;
    const itemName = variation > 1 ? `${baseItem.name} ${variation}` : baseItem.name;
    
    // Generate realistic variations
    const priceVariation = 0.8 + (Math.random() * 0.4); // ±20% variation
    const quantityVariation = 0.5 + (Math.random() * 1.0); // ±50% variation
    const salesVariation = 0.3 + (Math.random() * 1.4); // ±70% variation
    
    const price = Math.round(baseItem.basePrice * priceVariation * 100) / 100;
    const quantity = Math.floor(baseItem.baseQuantity * quantityVariation);
    const unitsSold = Math.floor(baseItem.baseQuantity * salesVariation * 0.1); // 10% of base quantity as monthly sales
    
    const minLevel = Math.max(5, Math.floor(quantity * 0.2)); // 20% of current quantity as min level
    const maxLevel = Math.floor(quantity * 2); // 2x current quantity as max level
    
    generatedItems.push({
      itemCode: `${category.substring(0, 2).toUpperCase()}${String(i + 1).padStart(3, '0')}`,
      itemName,
      quantity,
      unit,
      price,
      floorPrice: Math.round(price * 0.85 * 100) / 100,
      ceilingPrice: Math.round(price * 1.15 * 100) / 100,
      category,
      vendor,
      description: `${itemName} for ${category.toLowerCase()} applications`,
      minLevel,
      maxLevel,
      unitsSold
    });
  }

  return generatedItems;
};

// Export a large dataset for testing (uncomment to use)
// export const largeItemsData = generateLargeItemsData(150); 