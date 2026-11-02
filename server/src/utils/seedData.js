import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import MenuAnalytics from '../models/MenuAnalytics.js';
import { generateTableQRCode } from './qrGenerator.js';

dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Starting database seeding...');
    await connectDB();

    // Clear existing collections
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Category.deleteMany({});
    await MenuItem.deleteMany({});
    await Table.deleteMany({});
    await Order.deleteMany({});
    await MenuAnalytics.deleteMany({});

    console.log('[Seed] Cleared existing database records.');

    // 1. Create Demo Owner
    const owner = await User.create({
      name: 'Chef Arjun Verma',
      email: 'owner@menuqr.com',
      password: 'password123',
      role: 'owner',
    });

    console.log(`[Seed] Created demo user: ${owner.email} (Password: password123)`);

    // 2. Create Demo Restaurant
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const restaurant = await Restaurant.create({
      name: 'The Royal Biryani & Bistro',
      slug: 'royal-biryani',
      owner: owner._id,
      description: 'Award-winning artisanal dum biryanis, slow-cooked claypot curries, and smokey tandoori delicacies crafted with heritage spices.',
      cuisine: ['Royal Indian', 'Mughlai', 'Dum Biryani', 'Tandoor'],
      address: {
        street: '450 Grand Avenue',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'USA',
      },
      phone: '+1 (415) 890-2341',
      email: 'hello@royalbiryani.com',
      currency: { symbol: '$', code: 'USD', position: 'before' },
      openingHours: 'Mon - Sun: 11:30 AM - 10:30 PM',
      isOpen: true,
      tableOrderingEnabled: true,
      taxPercentage: 8.5,
      serviceChargePercentage: 2,
      announcement: '🌟 Try our weekend Special: Nizami Dum Goat Biryani slow-cooked for 6 hours!',
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
      coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop&q=80',
    });

    // Link restaurant to user
    owner.restaurant = restaurant._id;
    await owner.save({ validateBeforeSave: false });

    // 3. Create Categories
    const categoriesData = [
      {
        name: "Chef's Signature Specials",
        description: "House favourites and chef-crafted signature plates.",
        displayOrder: 1,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Dum Biryanis & Rice",
        description: "Fragrant rice bowls, dum biryani and flavour-packed pulao.",
        displayOrder: 2,
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Tandoor & Starters",
        description: "Grilled kebabs, crispy starters and shareable appetisers.",
        displayOrder: 3,
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Rich Curries & Breads",
        description: "Comforting curries, paneer dishes and fresh Indian breads.",
        displayOrder: 4,
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Desserts & Refreshers",
        description: "Classic Indian desserts and sweet treats.",
        displayOrder: 5,
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Burgers & Sliders",
        description: "Juicy burgers, loaded sliders and crispy buns.",
        displayOrder: 6,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Pizza",
        description: "Stone-baked favourites, cheesy classics and loaded pizzas.",
        displayOrder: 7,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Sandwiches & Subs",
        description: "Toasted sandwiches, subs and café-style melts.",
        displayOrder: 8,
        image: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Wraps & Rolls",
        description: "Grilled wraps, kathi rolls and flavour-packed rolls.",
        displayOrder: 9,
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Fries & Sides",
        description: "Crispy fries, cheesy sides and crunchy snacks.",
        displayOrder: 10,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Momos & Dumplings",
        description: "Steamed, fried and tossed momos with dipping sauces.",
        displayOrder: 11,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Pasta",
        description: "Creamy, cheesy and tomato-based pasta bowls.",
        displayOrder: 12,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Chinese & Asian",
        description: "Wok-tossed noodles, rice and Indo-Chinese favourites.",
        displayOrder: 13,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Street Food & Chaat",
        description: "Indian street-food classics, chaat and savoury bites.",
        displayOrder: 14,
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Shakes & Smoothies",
        description: "Thick shakes, fruit smoothies and chilled blends.",
        displayOrder: 15,
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80',
      },
      {
        name: "Coffee & Matcha",
        description: "Espresso classics, iced coffee and creamy matcha drinks.",
        displayOrder: 16,
        image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&auto=format&fit=crop&q=80',
      }
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const created = await Category.create({
        restaurant: restaurant._id,
        ...cat,
      });
      categoryMap[cat.name] = created._id;
    }

    console.log(`[Seed] Created ${categoriesData.length} categories.`);

    // 4. Create Menu Items
    const menuItemsData = [
      // Chef's Specials
      {
        name: 'Royal Nizami Mutton Dum Biryani',
        description: 'Tender baby goat cuts marinated for 24 hours, layered with aged basmati rice, Persian saffron, and rose water.',
        price: 24.95,
        category: categoryMap["Chef's Signature Specials"],
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isBestseller: true,
        isPopular: true,
        isSpicy: true,
        spiceLevel: 2,
        isNewItem: false,
        preparationTime: '20-25 min',
      },
      {
        name: 'Smoked Butter Chicken (Murgh Makhani)',
        description: 'Charcoal-grilled chicken tikka in a silky, slow-simmered tomato, fenugreek, and creamy butter gravy.',
        price: 21.5,
        category: categoryMap["Chef's Signature Specials"],
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isBestseller: true,
        isPopular: true,
        isSpicy: false,
        spiceLevel: 1,
        isNewItem: false,
        preparationTime: '15-20 min',
      },
      {
        name: 'Truffle Malai Kofta',
        description: 'Cottage cheese and golden raisin dumplings bathed in an opulent cashew-almond sauce with white truffle oil drizzle.',
        price: 19.95,
        category: categoryMap["Chef's Signature Specials"],
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isBestseller: false,
        isPopular: true,
        isSpicy: false,
        spiceLevel: 0,
        isNewItem: true,
        preparationTime: '15-20 min',
      },

      // Dum Biryanis
      {
        name: 'Hyderabadi Chicken Dum Biryani',
        description: 'Classic bone-in spiced chicken pieces layered with fragrant long-grain basmati, brown onions, and fresh mint. Served with Mirchi Ka Salan and Raita.',
        price: 18.95,
        category: categoryMap['Dum Biryanis & Rice'],
        image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isBestseller: true,
        isPopular: true,
        isSpicy: true,
        spiceLevel: 2,
        isNewItem: false,
        preparationTime: '15-20 min',
      },
      {
        name: 'Shahi Subz Paneer Biryani',
        description: 'Farm-fresh vegetables and paneer cubes infused with saffron, star anise, and mint, sealed in clay pot.',
        price: 16.5,
        category: categoryMap['Dum Biryanis & Rice'],
        image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isBestseller: false,
        isPopular: true,
        isSpicy: false,
        spiceLevel: 1,
        isNewItem: false,
        preparationTime: '15 min',
      },
      {
        name: 'Tiger Prawn Dum Biryani',
        description: 'Jumbo succulent wild prawns tossed in coastal spices and layered with aromatic saffron rice.',
        price: 26.0,
        category: categoryMap['Dum Biryanis & Rice'],
        image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isBestseller: false,
        isPopular: false,
        isSpicy: true,
        spiceLevel: 2,
        isNewItem: true,
        preparationTime: '20 min',
      },

      // Tandoor & Starters
      {
        name: 'Bhatti Da Murgh Tikka',
        description: 'Boneless chicken chunks marinated in mustard oil, Kashmiri chili, and yoghurt, charred over charcoal coals.',
        price: 16.95,
        category: categoryMap['Tandoor & Starters'],
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isBestseller: true,
        isPopular: true,
        isSpicy: true,
        spiceLevel: 2,
        isNewItem: false,
        preparationTime: '15-18 min',
      },
      {
        name: 'Crispy Dahi Ke Kebab',
        description: 'Melt-in-mouth patties crafted from hung yoghurt, roasted spices, and fresh coriander with tangy mint chutney.',
        price: 13.95,
        category: categoryMap['Tandoor & Starters'],
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isBestseller: false,
        isPopular: true,
        isSpicy: false,
        spiceLevel: 0,
        isNewItem: false,
        preparationTime: '12 min',
      },
      {
        name: 'Galouti Kebab Sliders',
        description: 'Finely minced spiced lamb patties that melt on the tongue, served over mini sheermal breads.',
        price: 17.5,
        category: categoryMap['Tandoor & Starters'],
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isBestseller: false,
        isPopular: false,
        isSpicy: true,
        spiceLevel: 2,
        isNewItem: true,
        preparationTime: '15 min',
      },
      {
        name: 'Tandoori Malai Broccoli',
        description: 'Broccoli florets steeped in Philadelphia cream cheese, cardamom, and green chilies, flame-roasted.',
        price: 14.5,
        category: categoryMap['Tandoor & Starters'],
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isBestseller: false,
        isPopular: false,
        isSpicy: false,
        spiceLevel: 1,
        isNewItem: false,
        preparationTime: '12 min',
      },

      // Rich Curries & Breads
      {
        name: 'Dal Makhani Bukhara',
        description: 'Black lentils slow-cooked overnight for 24 hours on tandoor embers with churned butter and San Marzano tomatoes.',
        price: 15.95,
        category: categoryMap['Rich Curries & Breads'],
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isBestseller: true,
        isPopular: true,
        isSpicy: false,
        spiceLevel: 0,
        isNewItem: false,
        preparationTime: '10 min',
      },
      {
        name: 'Kashmiri Rogan Josh',
        description: 'Braised lamb shank infused with alkanet root (Ratan Jot), dried ginger, and fennel from the valley of Kashmir.',
        price: 22.95,
        category: categoryMap['Rich Curries & Breads'],
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isBestseller: false,
        isPopular: true,
        isSpicy: true,
        spiceLevel: 2,
        isNewItem: false,
        preparationTime: '15 min',
      },
      {
        name: 'Paneer Tikka Masala',
        description: 'Tandoor-charred paneer tikka tossed in an aromatic bell pepper and tomato reduction.',
        price: 17.95,
        category: categoryMap['Rich Curries & Breads'],
        image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isBestseller: false,
        isPopular: true,
        isSpicy: false,
        spiceLevel: 1,
        isNewItem: false,
        preparationTime: '12 min',
      },
      {
        name: 'Artisanal Garlic Truffle Naan',
        description: 'Leavened clay-oven flatbread topped with crushed roasted garlic, parsley, and white truffle glaze.',
        price: 5.5,
        category: categoryMap['Rich Curries & Breads'],
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isBestseller: true,
        isPopular: true,
        isSpicy: false,
        spiceLevel: 0,
        isNewItem: false,
        preparationTime: '5 min',
      },

      // Desserts & Beverages
      {
        name: 'Saffron Pistachio Kulfi Falooda',
        description: 'Dense traditional Indian clotted milk ice cream topped with sweet vermicelli, rose syrup, and crushed Iranian pistachios.',
        price: 8.95,
        category: categoryMap['Desserts & Refreshers'],
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isBestseller: true,
        isPopular: true,
        isSpicy: false,
        spiceLevel: 0,
        isNewItem: false,
        preparationTime: '5 min',
      },
      {
        name: 'Rose Mango Lassi',
        description: 'Whipped Alphonso mango yogurt smoothie spiked with Damascus rose essence and cardamom.',
        price: 6.5,
        category: categoryMap['Desserts & Refreshers'],
        image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isBestseller: true,
        isPopular: true,
        isSpicy: false,
        spiceLevel: 0,
        isNewItem: false,
        preparationTime: '5 min',
      },
      {
        name: 'Warm Gulab Jamun with Madagascan Vanilla Ice Cream',
        description: 'Caramelized reduced milk spheres steeped in warm green cardamom syrup alongside chilled vanilla bean ice cream.',
        price: 8.5,
        category: categoryMap['Desserts & Refreshers'],
        image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isBestseller: false,
        isPopular: true,
        isSpicy: false,
        spiceLevel: 0,
        isNewItem: false,
        preparationTime: '5 min',
      },
    ];

    // Fill every category to exactly 10 menu items (150 total).
    // Existing signature dishes are retained; only missing items are added.
    const categoryMenuNames = {
  "Chef's Signature Specials": [
    "Royal Nizami Mutton Dum Biryani",
    "Smoked Butter Chicken (Murgh Makhani)",
    "Truffle Malai Kofta",
    "Chef's Special Paneer Tikka",
    "Peri Peri Chicken Platter",
    "Tandoori Mushroom Delight",
    "Creamy Afghani Chicken",
    "Lahori Chicken Tikka",
    "Signature Veg Kebab Platter",
    "Special Masala Chaap"
  ],
  "Dum Biryanis & Rice": [
    "Hyderabadi Chicken Dum Biryani",
    "Shahi Subz Paneer Biryani",
    "Tiger Prawn Dum Biryani",
    "Lucknowi Mutton Biryani",
    "Egg Dum Biryani",
    "Veg Dum Biryani",
    "Chicken Tikka Biryani",
    "Jeera Rice",
    "Peas Pulao",
    "Steamed Basmati Rice"
  ],
  "Tandoor & Starters": [
    "Bhatti Da Murgh Tikka",
    "Crispy Dahi Ke Kebab",
    "Galouti Kebab Sliders",
    "Tandoori Malai Broccoli",
    "Paneer Tikka",
    "Chicken Seekh Kebab",
    "Hara Bhara Kebab",
    "Afghani Chicken Tikka",
    "Tandoori Soya Chaap",
    "Crispy Corn"
  ],
  "Rich Curries & Breads": [
    "Dal Makhani Bukhara",
    "Kashmiri Rogan Josh",
    "Paneer Tikka Masala",
    "Artisanal Garlic Truffle Naan",
    "Butter Naan",
    "Tandoori Roti",
    "Shahi Paneer",
    "Kadhai Chicken",
    "Chole Masala",
    "Laccha Paratha"
  ],
  "Desserts & Refreshers": [
    "Saffron Pistachio Kulfi Falooda",
    "Rose Mango Lassi",
    "Warm Gulab Jamun with Madagascan Vanilla Ice Cream",
    "Classic Rasmalai",
    "Gajar Ka Halwa",
    "Chocolate Brownie",
    "New York Cheesecake",
    "Matka Kulfi",
    "Rasmalai Tres Leches",
    "Hot Chocolate Fudge"
  ],
  "Burgers & Sliders": [
    "Classic Veg Burger",
    "Crispy Chicken Burger",
    "Double Cheese Burger",
    "Paneer Tikka Burger",
    "BBQ Chicken Burger",
    "Mushroom Swiss Burger",
    "Peri Peri Veg Burger",
    "Zinger Chicken Burger",
    "Aloo Tikki Burger",
    "Smoky BBQ Slider"
  ],
  "Pizza": [
    "Margherita Pizza",
    "Farmhouse Pizza",
    "Pepperoni Pizza",
    "四 Cheese Pizza",
    "Paneer Tikka Pizza",
    "BBQ Chicken Pizza",
    "Mexican Green Wave Pizza",
    "Peri Peri Chicken Pizza",
    "Corn & Cheese Pizza",
    "Loaded Supreme Pizza"
  ],
  "Sandwiches & Subs": [
    "Classic Veg Sandwich",
    "Grilled Cheese Sandwich",
    "Club Sandwich",
    "Paneer Tikka Sandwich",
    "Chicken Mayo Sandwich",
    "Corn & Spinach Melt",
    "BBQ Chicken Sub",
    "Tandoori Paneer Sub",
    "Peri Peri Chicken Sandwich",
    "Mushroom Cheese Toastie"
  ],
  "Wraps & Rolls": [
    "Paneer Kathi Roll",
    "Chicken Tikka Roll",
    "Veggie Hummus Wrap",
    "Egg Frankie Roll",
    "Malai Chicken Roll",
    "Falafel Wrap",
    "Soya Chaap Roll",
    "Peri Peri Chicken Wrap",
    "Aloo Tikki Wrap",
    "Cheese Corn Roll"
  ],
  "Fries & Sides": [
    "Classic Salted Fries",
    "Peri Peri Fries",
    "Cheesy Loaded Fries",
    "Masala Fries",
    "Garlic Bread",
    "Cheese Garlic Bread",
    "Onion Rings",
    "Potato Wedges",
    "Jalapeno Cheese Poppers",
    "Chicken Nuggets"
  ],
  "Momos & Dumplings": [
    "Veg Steamed Momos",
    "Veg Fried Momos",
    "Paneer Momos",
    "Chicken Steamed Momos",
    "Chicken Fried Momos",
    "Kurkure Momos",
    "Tandoori Veg Momos",
    "Tandoori Chicken Momos",
    "Chilli Garlic Momos",
    "Afghani Momos"
  ],
  "Pasta": [
    "Penne Alfredo Pasta",
    "Penne Arrabbiata",
    "White Sauce Pasta",
    "Red Sauce Pasta",
    "Pink Sauce Pasta",
    "Mac and Cheese",
    "Pesto Cream Pasta",
    "Chicken Alfredo Pasta",
    "Spicy Peri Peri Pasta",
    "Baked Cheese Pasta"
  ],
  "Chinese & Asian": [
    "Veg Hakka Noodles",
    "Chicken Hakka Noodles",
    "Veg Manchurian",
    "Chilli Paneer",
    "Chilli Chicken",
    "Schezwan Fried Rice",
    "Veg Spring Rolls",
    "Honey Chilli Potato",
    "Thai Basil Chicken",
    "Crispy Corn Salt & Pepper"
  ],
  "Street Food & Chaat": [
    "Papdi Chaat",
    "Aloo Tikki Chaat",
    "Dahi Bhalla",
    "Pani Puri",
    "Sev Puri",
    "Pav Bhaji",
    "Samosa Chaat",
    "Delhi Aloo Chaat",
    "Chole Bhature",
    "Dahi Puri"
  ],
  "Shakes & Smoothies": [
    "Classic Chocolate Shake",
    "Oreo Milkshake",
    "Strawberry Shake",
    "Mango Smoothie",
    "Banana Peanut Butter Shake",
    "KitKat Shake",
    "Blueberry Smoothie",
    "Vanilla Bean Shake",
    "Cold Coffee Frappe",
    "Caramel Crunch Shake"
  ],
  "Coffee & Matcha": [
    "Classic Cappuccino",
    "Café Latte",
    "Americano",
    "Espresso",
    "Mocha",
    "Iced Spanish Latte",
    "Iced Americano",
    "Classic Matcha Latte",
    "Iced Strawberry Matcha",
    "Vanilla Matcha Frappe"
  ]
};
    const categoryImages = {
      "Chef's Signature Specials": "photo-1544025162-d76694265947",
      "Dum Biryanis & Rice": "photo-1563379091339-03b21ab4a4f8",
      "Tandoor & Starters": "photo-1599488615731-7e5c2823ff28",
      "Rich Curries & Breads": "photo-1585937421612-70a008356fbe",
      "Desserts & Refreshers": "photo-1551024709-8f23befc6f87",
      "Burgers & Sliders": "photo-1568901346375-23c9450c58cd",
      "Pizza": "photo-1579751626657-72bc17010498",
      "Sandwiches & Subs": "photo-1553909489-cd47e0ef937f",
      "Wraps & Rolls": "photo-1626700051175-6818013e1d4f",
      "Fries & Sides": "photo-1573080496219-bb080dd4f877",
      "Momos & Dumplings": "photo-156324示",
      "Pasta": "photo- pasta",
      "Chinese & Asian": "photo- wok",
      "Street Food & Chaat": "photo-1601050690597-df0568f70950",
      "Shakes & Smoothies": "photo-1572490122747-3968b75cc699",
      "Coffee & Matcha": "photo-1515823064-d6e0c04616a7"
    };
    const meatPattern = /chicken|mutton|lamb|prawn|shrimp|fish|pepperoni|beef|nugget|egg|non.?veg/i;
    for (const [categoryName, itemNames] of Object.entries(categoryMenuNames)) {
      const existingNames = new Set(
        menuItemsData
          .filter((item) => item.category?.toString() === categoryMap[categoryName]?.toString())
          .map((item) => item.name)
      );
      itemNames.forEach((name, index) => {
        if (existingNames.has(name)) return;
        const isVeg = !meatPattern.test(name);
        menuItemsData.push({
          name,
          description: `${name} prepared fresh with quality ingredients, house seasoning and a delicious signature finish.`,
          price: Number((5.5 + ((index * 2.35 + categoriesData.findIndex((cat) => cat.name === categoryName) * 1.7) % 15)).toFixed(2)),
          category: categoryMap[categoryName],
          image: `https://images.unsplash.com/${categoryImages[categoryName]}?w=600&auto=format&fit=crop&q=80`,
          isVeg,
          isBestseller: index === 0,
          isPopular: index < 3,
          isSpicy: /peri peri|chilli|spicy|schezwan|masala/i.test(name),
          spiceLevel: /peri peri|chilli|spicy|schezwan/i.test(name) ? 2 : 0,
          isNewItem: index === 9,
          preparationTime: categoryName.includes('Drinks') || categoryName.includes('Coffee') || categoryName.includes('Shakes') ? '5 min' : '10-20 min',
        });
      });
    }

    if (categoriesData.length !== 15 || menuItemsData.length !== 150) {
      throw new Error(`Expected 15 categories and 150 menu items, got ${categoriesData.length} and ${menuItemsData.length}`);
    }

    const createdMenuItems = [];
    for (const item of menuItemsData) {
      const created = await MenuItem.create({
        restaurant: restaurant._id,
        ...item,
      });
      createdMenuItems.push(created);
    }

    console.log(`[Seed] Created ${createdMenuItems.length} rich menu items.`);

    // 5. Create Tables & QR Codes
    const tablesList = [
      { tableNumber: 'T-01', capacity: 2 },
      { tableNumber: 'T-02', capacity: 4 },
      { tableNumber: 'T-03', capacity: 4 },
      { tableNumber: 'T-04', capacity: 6 },
      { tableNumber: 'T-05', capacity: 8 },
      { tableNumber: 'Patio-01', capacity: 4 },
    ];

    const createdTables = [];
    for (const t of tablesList) {
      const qrInfo = await generateTableQRCode(clientBaseUrl, restaurant.slug, t.tableNumber);
      const table = await Table.create({
        restaurant: restaurant._id,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        status: 'available',
        qrCodeDataUrl: qrInfo.qrCodeDataUrl,
        qrCodeSvg: qrInfo.qrCodeSvg,
      });
      createdTables.push(table);
    }

    console.log(`[Seed] Created ${createdTables.length} tables with dynamic QR codes.`);

    // 6. Create Realistic Sample Orders for Analytics & Kitchen Display
    const biryani = createdMenuItems.find((i) => i.name.includes('Royal Nizami'));
    const butterChicken = createdMenuItems.find((i) => i.name.includes('Butter Chicken'));
    const dalMakhani = createdMenuItems.find((i) => i.name.includes('Dal Makhani'));
    const naan = createdMenuItems.find((i) => i.name.includes('Naan'));
    const lassi = createdMenuItems.find((i) => i.name.includes('Lassi'));

    const sampleOrders = [
      {
        orderNumber: '#ORD-9102',
        table: { id: createdTables[0]._id, tableNumber: 'T-01' },
        customer: { name: 'Sarah Jenkins', phone: '+1 (415) 302-1199' },
        items: [
          { menuItem: biryani._id, name: biryani.name, price: biryani.price, quantity: 2, isVeg: biryani.isVeg },
          { menuItem: lassi._id, name: lassi.name, price: lassi.price, quantity: 2, isVeg: lassi.isVeg },
        ],
        subtotal: 62.9,
        tax: 5.35,
        serviceCharge: 1.26,
        totalAmount: 69.51,
        status: 'pending',
        specialNotes: 'Extra raita please, make it medium spicy.',
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      },
      {
        orderNumber: '#ORD-9101',
        table: { id: createdTables[1]._id, tableNumber: 'T-02' },
        customer: { name: 'David Lee', phone: '+1 (415) 555-8891' },
        items: [
          { menuItem: butterChicken._id, name: butterChicken.name, price: butterChicken.price, quantity: 1, isVeg: false },
          { menuItem: naan._id, name: naan.name, price: naan.price, quantity: 2, isVeg: true },
        ],
        subtotal: 32.5,
        tax: 2.76,
        serviceCharge: 0.65,
        totalAmount: 35.91,
        status: 'accepted',
        specialNotes: 'Crispy naan please!',
        createdAt: new Date(Date.now() - 14 * 60 * 1000), // 14 min ago
      },
      {
        orderNumber: '#ORD-9100',
        table: { id: createdTables[2]._id, tableNumber: 'T-03' },
        customer: { name: 'Elena Rostova', phone: '+1 (415) 778-9922' },
        items: [
          { menuItem: dalMakhani._id, name: dalMakhani.name, price: dalMakhani.price, quantity: 1, isVeg: true },
          { menuItem: naan._id, name: naan.name, price: naan.price, quantity: 3, isVeg: true },
        ],
        subtotal: 32.45,
        tax: 2.76,
        serviceCharge: 0.65,
        totalAmount: 35.86,
        status: 'preparing',
        specialNotes: '',
        createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 min ago
      },
      {
        orderNumber: '#ORD-9099',
        table: { id: createdTables[3]._id, tableNumber: 'T-04' },
        customer: { name: 'Michael Chang', phone: '+1 (415) 612-4411' },
        items: [
          { menuItem: biryani._id, name: biryani.name, price: biryani.price, quantity: 3, isVeg: false },
        ],
        subtotal: 74.85,
        tax: 6.36,
        serviceCharge: 1.5,
        totalAmount: 82.71,
        status: 'ready',
        specialNotes: 'All set for serving',
        createdAt: new Date(Date.now() - 40 * 60 * 1000), // 40 min ago
      },
      {
        orderNumber: '#ORD-9088',
        table: { id: createdTables[0]._id, tableNumber: 'T-01' },
        customer: { name: 'Robert Vance', phone: '' },
        items: [
          { menuItem: butterChicken._id, name: butterChicken.name, price: butterChicken.price, quantity: 2, isVeg: false },
          { menuItem: dalMakhani._id, name: dalMakhani.name, price: dalMakhani.price, quantity: 1, isVeg: true },
          { menuItem: naan._id, name: naan.name, price: naan.price, quantity: 4, isVeg: true },
        ],
        subtotal: 80.95,
        tax: 6.88,
        serviceCharge: 1.62,
        totalAmount: 89.45,
        status: 'completed',
        createdAt: new Date(Date.now() - 3 * 3600 * 1000), // 3 hours ago
      },
      // Previous days orders for weekly analytics chart
      {
        orderNumber: '#ORD-9040',
        table: { id: null, tableNumber: 'T-02' },
        customer: { name: 'Jessica Alba', phone: '' },
        items: [{ menuItem: biryani._id, name: biryani.name, price: biryani.price, quantity: 2, isVeg: false }],
        subtotal: 49.9,
        tax: 4.24,
        serviceCharge: 1.0,
        totalAmount: 55.14,
        status: 'completed',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000), // 1 day ago
      },
      {
        orderNumber: '#ORD-9022',
        table: { id: null, tableNumber: 'T-05' },
        customer: { name: 'Marcus Sterling', phone: '' },
        items: [{ menuItem: butterChicken._id, name: butterChicken.name, price: butterChicken.price, quantity: 4, isVeg: false }],
        subtotal: 86.0,
        tax: 7.31,
        serviceCharge: 1.72,
        totalAmount: 95.03,
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000), // 2 days ago
      },
      {
        orderNumber: '#ORD-8991',
        table: { id: null, tableNumber: 'T-03' },
        customer: { name: 'Sophia Taylor', phone: '' },
        items: [{ menuItem: biryani._id, name: biryani.name, price: biryani.price, quantity: 3, isVeg: false }],
        subtotal: 74.85,
        tax: 6.36,
        serviceCharge: 1.5,
        totalAmount: 82.71,
        status: 'completed',
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000), // 3 days ago
      },
      {
        orderNumber: '#ORD-8950',
        table: { id: null, tableNumber: 'Patio-01' },
        customer: { name: 'Liam Neeson', phone: '' },
        items: [{ menuItem: dalMakhani._id, name: dalMakhani.name, price: dalMakhani.price, quantity: 2, isVeg: true }],
        subtotal: 31.9,
        tax: 2.71,
        serviceCharge: 0.64,
        totalAmount: 35.25,
        status: 'completed',
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000), // 4 days ago
      },
    ];

    for (const ord of sampleOrders) {
      await Order.create({
        restaurant: restaurant._id,
        ...ord,
      });
    }

    console.log(`[Seed] Created ${sampleOrders.length} sample orders.`);

    // 7. Seed Menu Visit Analytics
    const analyticsEntries = [];
    for (let i = 0; i < 48; i++) {
      const hoursAgo = Math.floor(Math.random() * 120);
      analyticsEntries.push({
        restaurant: restaurant._id,
        type: 'view',
        tableNumber: `T-0${Math.floor(Math.random() * 5) + 1}`,
        timestamp: new Date(Date.now() - hoursAgo * 3600 * 1000),
      });
    }
    await MenuAnalytics.insertMany(analyticsEntries);

    console.log(`[Seed] Created ${analyticsEntries.length} analytics menu visit events.`);
    console.log('[Seed] Database successfully seeded with rich demo data!');

    return {
      ownerEmail: 'owner@menuqr.com',
      ownerPassword: 'password123',
      restaurantSlug: 'royal-biryani',
    };
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    throw error;
  }
};

// If run directly via `node src/utils/seedData.js`
if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
  seedDatabase()
    .then(() => {
      console.log('[Seed] Finished. Exiting.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
