// Sample data for Phase 1. This will move to Supabase in a later phase.

export type Category = 'Cakes' | 'Cupcakes' | 'Pastries' | 'Cookies' | 'Breads'

export interface Product {
  id: string
  name: string
  description: string
  category: Category
  price: number
  unit: string
  image: string
  featured?: boolean
}

export const img = (id: string, width = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`

export const categories: { name: Category; tagline: string; image: string }[] = [
  { name: 'Cakes', tagline: 'Celebration & everyday', image: img('1578985545062-69928b1d9587', 500) },
  { name: 'Cupcakes', tagline: 'Little bites of joy', image: img('1486427944299-d1955d23e34d', 500) },
  { name: 'Pastries', tagline: 'Flaky & buttery', image: img('1555507036-ab1f4038808a', 500) },
  { name: 'Cookies', tagline: 'Baked golden daily', image: img('1499636136210-6f4ee915583e', 500) },
  { name: 'Breads', tagline: 'Slow-fermented loaves', image: img('1509440159596-0249088772ff', 500) },
]

export const products: Product[] = [
  {
    id: 'belgian-truffle-cake',
    name: 'Belgian Chocolate Truffle Cake',
    description: 'Rich chocolate sponge layered with silky Belgian ganache.',
    category: 'Cakes',
    price: 1299,
    unit: '1 kg',
    image: img('1578985545062-69928b1d9587'),
    featured: true,
  },
  {
    id: 'strawberry-cream-cake',
    name: 'Strawberry Cream Cake',
    description: 'Vanilla sponge, fresh strawberries and light whipped cream.',
    category: 'Cakes',
    price: 1149,
    unit: '1 kg',
    image: img('1565958011703-44f9829ba187'),
    featured: true,
  },
  {
    id: 'pink-velvet-cake',
    name: 'Pink Velvet Celebration Cake',
    description: 'Funfetti layers with pink buttercream drip and sprinkles.',
    category: 'Cakes',
    price: 1499,
    unit: '1 kg',
    image: img('1621303837174-89787a7d4729'),
    featured: true,
  },
  {
    id: 'strawberry-cupcakes',
    name: 'Strawberry Swirl Cupcakes',
    description: 'Soft vanilla cupcakes topped with strawberry frosting.',
    category: 'Cupcakes',
    price: 449,
    unit: 'Box of 6',
    image: img('1563729784474-d77dbb933a9e'),
  },
  {
    id: 'hazelnut-cupcakes',
    name: 'Chocolate Hazelnut Cupcakes',
    description: 'Dark chocolate cupcakes with hazelnut praline frosting.',
    category: 'Cupcakes',
    price: 499,
    unit: 'Box of 6',
    image: img('1550617931-e17a7b70dce2'),
  },
  {
    id: 'butter-croissants',
    name: 'Classic Butter Croissants',
    description: 'Hand-laminated, golden and flaky with pure butter.',
    category: 'Pastries',
    price: 299,
    unit: 'Pack of 4',
    image: img('1555507036-ab1f4038808a'),
  },
  {
    id: 'tiramisu-pastry',
    name: 'Tiramisu Pastry',
    description: 'Coffee-soaked sponge with mascarpone cream and cocoa.',
    category: 'Pastries',
    price: 189,
    unit: '1 slice',
    image: img('1571115177098-24ec42ed204d'),
  },
  {
    id: 'choco-chip-cookies',
    name: 'Choco Chip Cookies',
    description: 'Chewy centres, crisp edges and plenty of chocolate chunks.',
    category: 'Cookies',
    price: 249,
    unit: 'Pack of 10',
    image: img('1558961363-fa8fdf82db35'),
  },
  {
    id: 'sourdough-loaf',
    name: 'Artisan Sourdough Loaf',
    description: '24-hour fermented sourdough with a crackly crust.',
    category: 'Breads',
    price: 229,
    unit: '500 g',
    image: img('1509440159596-0249088772ff'),
  },
  {
    id: 'multigrain-loaf',
    name: 'Multigrain Sandwich Loaf',
    description: 'Wholesome sliced loaf with oats, seeds and whole wheat.',
    category: 'Breads',
    price: 149,
    unit: '400 g',
    image: img('1549931319-a545dcf3bc73'),
  },
]

export const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

// Placeholder business details — replace with the real ones before launch.
export const bakeryInfo = {
  phone: '+91 98765 43210',
  phoneHref: 'tel:+919876543210',
  email: 'hello@sweetcrumbs.example',
  address: '12 Rose Garden Road, Koramangala, Bengaluru 560034',
  hours: [
    { days: 'Monday – Friday', time: '8:00 AM – 9:00 PM' },
    { days: 'Saturday – Sunday', time: '9:00 AM – 10:00 PM' },
  ],
}

export const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Menu', href: '#menu' },
  { label: 'Custom Cakes', href: '#custom' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]
