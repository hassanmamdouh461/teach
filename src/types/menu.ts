export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
}

export const CATEGORIES = ['All', 'Kitchen', 'Bar'];

// Coffee Shop Menu Data - 8 Items
export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // ☕ Hot Coffee (3 items)
  {
    id: '1',
    name: 'Espresso',
    description: 'Rich, concentrated shot of premium Italian arabica beans.',
    price: 3.50,
    category: 'Bar',
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8RXNwcmVzc298ZW58MHx8MHx8fDA%3D',
    available: true,
  },
  {
    id: '2',
    name: 'Spanish Latte',
    description: 'Espresso with condensed milk and steamed milk.',
    price: 6.00,
    category: 'Bar',
    image: 'https://plus.unsplash.com/premium_photo-1674327105076-36c4419864cf?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fFNwYW5pc2glMjBMYXR0ZXxlbnwwfHwwfHx8MA%3D%3D',
    available: true,
  },
  {
    id: '3',
    name: 'Cappuccino',
    description: 'Classic Italian coffee with steamed milk foam.',
    price: 5.00,
    category: 'Bar',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80',
    available: true,
  },

  // 🧊 Iced Coffee (2 items)
  {
    id: '4',
    name: 'Iced Latte',
    description: 'Chilled espresso with cold milk over ice.',
    price: 5.50,
    category: 'Bar',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8SWNlZCUyMExhdHRlfGVufDB8fDB8fHww',
    available: true,
  },
  {
    id: '5',
    name: 'Iced Caramel Macchiato',
    description: 'Vanilla latte with caramel drizzle over ice.',
    price: 6.50,
    category: 'Bar',
    image: 'https://images.unsplash.com/photo-1662047102608-a6f2e492411f?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8SWNlZCUyMENhcmFtZWwlMjBNYWNjaGlhdG98ZW58MHx8MHx8fDA%3D',
    available: true,
  },

  // 🥤 Frappe (1 item)
  {
    id: '6',
    name: 'Mocha Frappe',
    description: 'Frozen mocha bliss topped with whipped cream.',
    price: 7.00,
    category: 'Bar',
    image: 'https://plus.unsplash.com/premium_photo-1663853293754-aec2a19c0a17?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8TW9jaGElMjBGcmFwcGV8ZW58MHx8MHx8fDA%3D',
    available: true,
  },

  // 🍨 Milkshakes (2 items)
  {
    id: '7',
    name: 'Oreo Milkshake',
    description: 'Cookies and cream frozen delight.',
    price: 6.50,
    category: 'Bar',
    image: 'https://images.unsplash.com/photo-1653852883277-c4b4b9e020e5?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8T3JlbyUyME1pbGtzaGFrZXxlbnwwfHwwfHx8MA%3D%3D',
    available: true,
  },
  {
    id: '8',
    name: 'Strawberry Milkshake',
    description: 'Fresh strawberries blended with vanilla ice cream.',
    price: 6.00,
    category: 'Bar',
    image: 'https://images.unsplash.com/photo-1686638745403-d21193f16b2f?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8U3RyYXdiZXJyeSUyME1pbGtzaGFrZXxlbnwwfHwwfHx8MA%3D%3D',
    available: true,
  },
];
