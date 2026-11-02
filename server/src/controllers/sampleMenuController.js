import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

// Sample catalogue only: restaurant owners can edit names and prices after importing.
const SAMPLE_MENU = [
  { category: 'Starters & Appetizers', base: 99, items: ['Paneer Tikka','Chicken Tikka','Crispy Corn','Veg Spring Rolls','Chilli Paneer','Chicken Lollipop','Hara Bhara Kebab','Fish Fingers','Cheese Balls','Peri Peri Mushroom'] },
  { category: 'Main Course', base: 169, items: ['Paneer Butter Masala','Dal Makhani','Shahi Paneer','Butter Chicken','Chicken Curry','Kadhai Paneer','Veg Kolhapuri','Mutton Rogan Josh','Chole Masala','Egg Curry'] },
  { category: 'Beverages', base: 49, items: ['Fresh Lime Soda','Classic Lemonade','Mint Mojito','Masala Chaas','Iced Tea','Cold Coffee','Blue Lagoon','Watermelon Cooler','Virgin Mary','Coconut Water'] },
  { category: 'Desserts', base: 89, items: ['Gulab Jamun','Rasmalai','Brownie','Chocolate Lava Cake','Cheesecake','Gajar Halwa','Moong Dal Halwa','Tiramisu','Apple Pie','Red Velvet Pastry'] },
  { category: 'Burgers & Sliders', base: 99, items: ['Classic Veg Burger','Aloo Tikki Burger','Crispy Chicken Burger','Paneer Burger','Double Cheese Burger','BBQ Chicken Burger','Mushroom Swiss Burger','Peri Peri Veg Burger','Zinger Burger','Mini Cheese Sliders'] },
  { category: 'Pizza', base: 179, items: ['Margherita Pizza','Farmhouse Pizza','Paneer Tikka Pizza','Double Cheese Pizza','Corn & Cheese Pizza','Pepperoni Pizza','Chicken Tikka Pizza','BBQ Chicken Pizza','Veggie Supreme Pizza','Peri Peri Paneer Pizza'] },
  { category: 'Sandwiches & Subs', base: 89, items: ['Veg Club Sandwich','Grilled Cheese Sandwich','Paneer Tikka Sandwich','Corn Mayo Sandwich','Chicken Club Sandwich','Tandoori Chicken Sub','Aloo Masala Sandwich','Mushroom Melt Sandwich','Egg Mayo Sandwich','Peri Peri Paneer Sub'] },
  { category: 'Wraps & Rolls', base: 99, items: ['Paneer Kathi Roll','Chicken Kathi Roll','Veggie Wrap','Egg Roll','Peri Peri Chicken Wrap','Falafel Wrap','Aloo Tikki Roll','Seekh Kebab Roll','Tandoori Paneer Wrap','Cheese Corn Roll'] },
  { category: 'Fries & Sides', base: 69, items: ['Classic French Fries','Peri Peri Fries','Cheese Fries','Loaded Nachos','Potato Wedges','Onion Rings','Garlic Bread','Cheese Garlic Bread','Chicken Popcorn','Masala Fries'] },
  { category: 'Momos & Dumplings', base: 79, items: ['Veg Steamed Momos','Veg Fried Momos','Paneer Momos','Kurkure Momos','Chicken Steamed Momos','Chicken Fried Momos','Tandoori Momos','Afghani Momos','Chilli Garlic Momos','Cheese Corn Momos'] },
  { category: 'Pasta', base: 149, items: ['White Sauce Pasta','Red Sauce Pasta','Pink Sauce Pasta','Arrabbiata Pasta','Alfredo Pasta','Pesto Pasta','Chicken Alfredo Pasta','Mac and Cheese','Baked Veg Pasta','Peri Peri Pasta'] },
  { category: 'Chinese & Asian', base: 119, items: ['Veg Hakka Noodles','Chicken Hakka Noodles','Veg Fried Rice','Chicken Fried Rice','Chilli Garlic Noodles','Schezwan Rice','Chilli Paneer Gravy','Chicken Manchurian','Veg Manchurian','Honey Chilli Potato'] },
  { category: 'Street Food & Chaat', base: 49, items: ['Pani Puri','Dahi Puri','Aloo Tikki Chaat','Papdi Chaat','Samosa Chaat','Pav Bhaji','Vada Pav','Dahi Bhalla','Sev Puri','Raj Kachori'] },
  { category: 'Shakes & Smoothies', base: 99, items: ['Oreo Shake','Chocolate Shake','Vanilla Shake','Strawberry Shake','Mango Shake','KitKat Shake','Banana Smoothie','Mixed Berry Smoothie','Mango Smoothie','Peanut Butter Shake'] },
  { category: 'Coffee & Matcha', base: 99, items: ['Espresso','Americano','Cappuccino','Cafe Latte','Mocha','Iced Latte','Classic Matcha Latte','Iced Matcha Latte','Strawberry Matcha','Vanilla Matcha'] },
  { category: 'Ice Cream & Waffles', base: 89, items: ['Vanilla Ice Cream','Chocolate Ice Cream','Strawberry Ice Cream','Brownie with Ice Cream','Classic Waffle','Chocolate Waffle','Nutella Waffle','Belgian Chocolate Waffle','Oreo Waffle','Fruit Sundae'] },
];

const NON_VEG_WORDS = /chicken|mutton|fish|prawn|egg|pepperoni|seekh kebab/i;

// @route POST /api/categories/import-sample-menu
// Authenticated and scoped to the restaurant resolved by requireRestaurant.
// Inserts missing records only; never deletes or overwrites existing categories/items.
export const importSampleMenu = async (req, res, next) => {
  try {
    const restaurantId = req.restaurant._id;
    // The owner approved INR sample pricing for this India-based demo menu.
    req.restaurant.currency = { symbol: '₹', code: 'INR', position: 'before' };
    await req.restaurant.save();
    let categoriesCreated = 0;
    let itemsCreated = 0;

    for (let categoryIndex = 0; categoryIndex < SAMPLE_MENU.length; categoryIndex += 1) {
      const group = SAMPLE_MENU[categoryIndex];
      let category = await Category.findOne({
        restaurant: restaurantId,
        name: { $regex: new RegExp('^' + group.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
      });

      if (!category) {
        try {
          category = await Category.create({
            restaurant: restaurantId,
            name: group.category,
            description: 'Sample category — customise it to match your menu.',
            displayOrder: categoryIndex + 1,
            isActive: true,
          });
          categoriesCreated += 1;
        } catch (error) {
          // A concurrent import may have created the same category.
          if (error.code !== 11000) throw error;
          category = await Category.findOne({ restaurant: restaurantId, name: group.category });
          if (!category) throw error;
        }
      }

      for (let itemIndex = 0; itemIndex < group.items.length; itemIndex += 1) {
        const name = group.items[itemIndex];
        const existing = await MenuItem.findOne({
          restaurant: restaurantId,
          category: category._id,
          name: { $regex: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
        }).select('_id');

        if (existing) continue;

        try {
          await MenuItem.create({
            restaurant: restaurantId,
            category: category._id,
            name,
            description: 'Sample item — update the description, image and price before publishing.',
            price: group.base + (itemIndex * 10),
            isVeg: !NON_VEG_WORDS.test(name),
            isPopular: false,
            isBestseller: false,
            isSpicy: /chilli|peri peri|schezwan|masala/i.test(name),
            spiceLevel: /chilli|peri peri|schezwan/i.test(name) ? 2 : 0,
            isNewItem: false,
            isAvailable: true,
            preparationTime: '15-20 min',
            displayOrder: itemIndex + 1,
          });
          itemsCreated += 1;
        } catch (error) {
          // Ignore a duplicate-key race only; surface all other validation/database errors.
          if (error.code !== 11000) throw error;
        }
      }
    }

    const [categoryCount, itemCount] = await Promise.all([
      Category.countDocuments({ restaurant: restaurantId }),
      MenuItem.countDocuments({ restaurant: restaurantId }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Sample menu import completed. Review all sample prices and dishes before publishing.',
      categoriesCreated,
      itemsCreated,
      totalCategories: categoryCount,
      totalItems: itemCount,
    });
  } catch (error) {
    next(error);
  }
};
