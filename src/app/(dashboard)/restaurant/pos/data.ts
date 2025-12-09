export type Feature = {
    id: string;
    name: string; // e.g., "Spicy", "No Onion"
}

export type MenuItem = {
    id: string;
    name: string;
    price: number;
    category: string;
    image?: string;
    isVegetarian?: boolean;
    spicyLevel?: number; // 0-3
};

export const MENU_CATEGORIES = [
    'All',
    'Rice & Curry',
    'Kottu',
    'Fried Rice',
    'Short Eats',
    'Beverages'
];

export const MOCK_MENU: MenuItem[] = [
    {
        id: '1',
        name: 'Chicken Kottu (L)',
        price: 1200,
        category: 'Kottu',
        spicyLevel: 2,
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=300&h=200'
    },
    {
        id: '2',
        name: 'Cheese Kottu (L)',
        price: 1500,
        category: 'Kottu',
        spicyLevel: 1,
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=300&h=200'
    },
    {
        id: '3',
        name: 'Mixed Fried Rice',
        price: 1350,
        category: 'Fried Rice',
        spicyLevel: 1,
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb74b?auto=format&fit=crop&w=300&h=200'
    },
    {
        id: '4',
        name: 'Fish Rolls (3pcs)',
        price: 450,
        category: 'Short Eats',
        image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=300&h=200'
    },
    {
        id: '5',
        name: 'EGB (Glass Bottle)',
        price: 150,
        category: 'Beverages',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&h=200'
    },
    {
        id: '6',
        name: 'Black Pork Curry',
        price: 950,
        category: 'Rice & Curry',
        spicyLevel: 3,
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=300&h=200'
    }
];
