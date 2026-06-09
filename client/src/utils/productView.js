export function productToView(product) {
  const id = product._id || product.id
  const discountPercent = Number(product.discountPercent || 0)
  const price = Number(product.price || 0)
  const calculatedMrp = discountPercent > 0 && discountPercent < 100
    ? Math.round(price / (1 - discountPercent / 100))
    : 0
  const mrp = Number(product.mrp || 0) > price ? Number(product.mrp) : calculatedMrp
  const badges = [
    product.stock <= 0 ? 'Out of stock' : '',
    discountPercent > 0 ? `${discountPercent}% OFF` : '',
    product.isNew ? 'New' : '',
    product.isFeatured ? 'Featured' : '',
  ].filter(Boolean)

  return {
    ...product,
    id,
    badges: product.badges?.length ? product.badges : badges,
    brand: product.brand || product.company || '',
    company: product.company || product.brand || '',
    discountPercent,
    image:
      product.image ||
      product.images?.[0] ||
      'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80',
    mrp,
    price,
    tags: product.tags || [],
  }
}
