// Grocery store category definitions with keywords for matching
export const GROCERY_CATEGORIES = {
  produce: {
    name: 'Produce',
    icon: '🥬',
    keywords: [
      'lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot',
      'celery', 'potato', 'broccoli', 'spinach', 'kale', 'cucumber',
      'zucchini', 'squash', 'mushroom', 'avocado', 'lemon', 'lime',
      'orange', 'apple', 'banana', 'berry', 'grape', 'melon',
      'basil', 'cilantro', 'parsley', 'mint', 'thyme', 'rosemary',
      'ginger', 'jalapeno', 'jalapeño', 'cabbage', 'corn', 'asparagus',
      'green bean', 'pea', 'artichoke', 'eggplant', 'beet', 'radish',
      'scallion', 'shallot', 'leek', 'chive', 'dill', 'sage',
      'arugula', 'romaine', 'chard', 'collard', 'fennel', 'turnip',
      'sweet potato', 'yam', 'pumpkin', 'butternut', 'acorn squash',
      'bell pepper', 'hot pepper', 'serrano', 'habanero', 'poblano',
      'mango', 'papaya', 'pineapple', 'coconut', 'kiwi', 'peach',
      'plum', 'nectarine', 'apricot', 'cherry', 'strawberry', 'blueberry',
      'raspberry', 'blackberry', 'cranberry', 'watermelon', 'cantaloupe',
      'honeydew', 'fig', 'date', 'pomegranate', 'persimmon', 'pear'
    ]
  },
  dairy: {
    name: 'Dairy & Eggs',
    icon: '🥛',
    keywords: [
      'milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg',
      'sour cream', 'cottage cheese', 'mozzarella', 'cheddar',
      'parmesan', 'ricotta', 'half and half', 'whipping cream',
      'cream cheese', 'feta', 'goat cheese', 'brie', 'swiss',
      'provolone', 'gouda', 'blue cheese', 'gorgonzola', 'mascarpone',
      'heavy cream', 'buttermilk', 'condensed milk', 'evaporated milk',
      'greek yogurt', 'kefir', 'ghee', 'margarine'
    ]
  },
  meat: {
    name: 'Meat & Seafood',
    icon: '🥩',
    keywords: [
      'chicken', 'beef', 'pork', 'steak', 'ground beef', 'bacon',
      'sausage', 'ham', 'turkey', 'lamb', 'fish', 'salmon', 'shrimp',
      'crab', 'lobster', 'tuna', 'tilapia', 'cod', 'meatball',
      'prosciutto', 'pancetta', 'chorizo', 'pepperoni', 'salami',
      'duck', 'veal', 'bison', 'venison', 'rabbit', 'goat',
      'scallop', 'mussel', 'clam', 'oyster', 'squid', 'calamari',
      'octopus', 'anchovy', 'sardine', 'halibut', 'trout', 'bass',
      'snapper', 'mahi', 'swordfish', 'catfish', 'crayfish', 'crawfish',
      'ground turkey', 'ground pork', 'ground chicken', 'ribeye',
      'sirloin', 'tenderloin', 'brisket', 'ribs', 'roast', 'chop'
    ]
  },
  bakery: {
    name: 'Bakery & Bread',
    icon: '🍞',
    keywords: [
      'bread', 'bun', 'roll', 'bagel', 'tortilla', 'pita',
      'croissant', 'muffin', 'baguette', 'ciabatta', 'naan',
      'flatbread', 'focaccia', 'brioche', 'sourdough', 'rye bread',
      'wheat bread', 'white bread', 'english muffin', 'crouton',
      'breadstick', 'pretzel', 'dinner roll', 'hoagie', 'sub roll'
    ]
  },
  pantry: {
    name: 'Pantry',
    icon: '🥫',
    keywords: [
      'flour', 'sugar', 'oil', 'vinegar', 'pasta', 'rice', 'beans',
      'lentils', 'canned', 'broth', 'stock', 'sauce', 'tomato paste',
      'honey', 'syrup', 'peanut butter', 'jam', 'jelly', 'cereal',
      'oats', 'oatmeal', 'nuts', 'almond', 'walnut', 'pecan', 'cashew',
      'baking powder', 'baking soda', 'vanilla', 'cocoa', 'chocolate',
      'breadcrumbs', 'panko', 'cornstarch', 'cornmeal', 'polenta',
      'quinoa', 'couscous', 'barley', 'farro', 'bulgur', 'orzo',
      'spaghetti', 'penne', 'linguine', 'fettuccine', 'macaroni',
      'noodle', 'ramen', 'udon', 'soba', 'rice noodle', 'lasagna',
      'olive oil', 'vegetable oil', 'canola oil', 'coconut oil',
      'sesame oil', 'avocado oil', 'cooking spray', 'shortening',
      'brown sugar', 'powdered sugar', 'molasses', 'agave', 'stevia',
      'ketchup', 'mustard', 'mayonnaise', 'mayo', 'relish', 'pickle',
      'soy sauce', 'worcestershire', 'hot sauce', 'sriracha', 'salsa',
      'marinara', 'alfredo', 'pesto', 'teriyaki', 'bbq sauce',
      'tomato sauce', 'diced tomato', 'crushed tomato', 'sun dried tomato',
      'chickpea', 'black bean', 'kidney bean', 'pinto bean', 'navy bean',
      'white bean', 'cannellini', 'refried bean', 'hummus', 'tahini'
    ]
  },
  spices: {
    name: 'Spices & Seasonings',
    icon: '🧂',
    keywords: [
      'salt', 'pepper', 'cumin', 'paprika', 'oregano', 'cinnamon',
      'nutmeg', 'cayenne', 'chili powder', 'curry', 'turmeric',
      'coriander', 'bay leaf', 'cloves', 'allspice', 'seasoning',
      'spice', 'cardamom', 'saffron', 'garam masala', 'five spice',
      'italian seasoning', 'herbs de provence', 'old bay', 'cajun',
      'taco seasoning', 'ranch seasoning', 'garlic powder', 'onion powder',
      'smoked paprika', 'chipotle', 'ancho', 'red pepper flakes',
      'crushed red pepper', 'white pepper', 'black pepper', 'sea salt',
      'kosher salt', 'table salt', 'msg', 'bouillon', 'extract'
    ]
  },
  frozen: {
    name: 'Frozen',
    icon: '🧊',
    keywords: [
      'frozen', 'ice cream', 'popsicle', 'frozen vegetable',
      'frozen fruit', 'frozen pizza', 'frozen dinner', 'sorbet',
      'gelato', 'frozen yogurt', 'ice', 'frozen pea', 'frozen corn',
      'frozen berry', 'frozen spinach', 'frozen broccoli'
    ]
  },
  beverages: {
    name: 'Beverages',
    icon: '🥤',
    keywords: [
      'juice', 'soda', 'water', 'coffee', 'tea', 'wine', 'beer',
      'liquor', 'sparkling', 'lemonade', 'iced tea', 'kombucha',
      'smoothie', 'shake', 'espresso', 'latte', 'cappuccino',
      'vodka', 'rum', 'whiskey', 'bourbon', 'gin', 'tequila',
      'brandy', 'cognac', 'vermouth', 'sake', 'mirin', 'sherry',
      'port', 'champagne', 'prosecco', 'cider', 'ale', 'lager'
    ]
  },
  other: {
    name: 'Other',
    icon: '📦',
    keywords: []
  }
}

// Categorize an ingredient by name
export function categorizeIngredient(ingredientName) {
  if (!ingredientName) return 'other'

  const lowerName = ingredientName.toLowerCase()

  for (const [categoryId, category] of Object.entries(GROCERY_CATEGORIES)) {
    if (categoryId === 'other') continue

    for (const keyword of category.keywords) {
      if (lowerName.includes(keyword)) {
        return categoryId
      }
    }
  }

  return 'other'
}

// Get category display info
export function getCategoryInfo(categoryId) {
  return GROCERY_CATEGORIES[categoryId] || GROCERY_CATEGORIES.other
}

// Get ordered list of category IDs (for consistent display order)
export function getCategoryOrder() {
  return ['produce', 'dairy', 'meat', 'bakery', 'pantry', 'spices', 'frozen', 'beverages', 'other']
}
