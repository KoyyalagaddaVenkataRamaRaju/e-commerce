import heroImage from '../assets/hero.png'

export const categories = ['Cement', 'Iron & Steel', 'Timber', 'Windows', 'Tools']

export const featuredProducts = [
  {
    id: 'cement-43-grade',
    slug: 'heritage-43-grade-cement',
    name: 'Heritage 43 Grade Cement',
    category: 'Cement',
    price: 415,
    unit: '50 kg bag',
    badge: 'Fast moving',
    stock: 420,
    image: heroImage,
    description:
      'Reliable blended cement for slabs, brickwork, plastering, columns, and general enterprise supply orders.',
  },
  {
    id: 'tmt-fe-550',
    slug: 'foundry-fe-550-tmt-bars',
    name: 'Foundry FE 550 TMT Bars',
    category: 'Iron & Steel',
    price: 64200,
    unit: 'metric ton',
    badge: 'Bulk rate',
    stock: 36,
    image: heroImage,
    description:
      'High tensile steel rods for residential and commercial construction with dispatch-ready bundle lots.',
  },
  {
    id: 'seasoned-teak',
    slug: 'seasoned-teak-wood-planks',
    name: 'Seasoned Teak Wood Planks',
    category: 'Timber',
    price: 2850,
    unit: 'cubic ft',
    badge: 'Premium',
    stock: 84,
    image: heroImage,
    description:
      'Vintage-finish teak planks for doors, frames, shelves, counters, and long-life carpentry work.',
  },
  {
    id: 'steel-window-frame',
    slug: 'classic-steel-window-frame',
    name: 'Classic Steel Window Frame',
    category: 'Windows',
    price: 5200,
    unit: 'piece',
    badge: 'Made to order',
    stock: 22,
    image: heroImage,
    description:
      'Powder-coated frames with sturdy hinges, clean edges, and old workshop character for modern builds.',
  },
]

export const adminStats = [
  { label: 'Monthly revenue', value: '₹18.4L', change: '+12%' },
  { label: 'Open orders', value: '146', change: '28 urgent' },
  { label: 'Low stock SKUs', value: '11', change: 'restock soon' },
  { label: 'Trade customers', value: '824', change: '+31 new' },
]
