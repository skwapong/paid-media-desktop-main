import { useState } from 'react';

interface Asset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  category: string;
  dimensions?: string;
}

// Mock apparel product images
const mockAssets: Asset[] = [
  { id: '1', name: 'Blue Denim Jacket', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', type: 'image', category: 'Outerwear', dimensions: '1200x1200' },
  { id: '2', name: 'White T-Shirt', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', type: 'image', category: 'Tops', dimensions: '1200x1200' },
  { id: '3', name: 'Black Hoodie', url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop', type: 'image', category: 'Outerwear', dimensions: '1200x1200' },
  { id: '4', name: 'Striped Sweater', url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop', type: 'image', category: 'Tops', dimensions: '1200x1200' },
  { id: '5', name: 'Blue Jeans', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', type: 'image', category: 'Bottoms', dimensions: '1200x1200' },
  { id: '6', name: 'Leather Boots', url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop', type: 'image', category: 'Footwear', dimensions: '1200x1200' },
  { id: '7', name: 'Summer Dress', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop', type: 'image', category: 'Dresses', dimensions: '1200x1200' },
  { id: '8', name: 'Canvas Sneakers', url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=400&fit=crop', type: 'image', category: 'Footwear', dimensions: '1200x1200' },
  { id: '9', name: 'Wool Coat', url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop', type: 'image', category: 'Outerwear', dimensions: '1200x1200' },
  { id: '10', name: 'Plaid Shirt', url: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400&h=400&fit=crop', type: 'image', category: 'Tops', dimensions: '1200x1200' },
  { id: '11', name: 'Khaki Pants', url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop', type: 'image', category: 'Bottoms', dimensions: '1200x1200' },
  { id: '12', name: 'Crossbody Bag', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', type: 'image', category: 'Accessories', dimensions: '1200x1200' },
];

const categories = ['All', 'Outerwear', 'Tops', 'Bottoms', 'Dresses', 'Footwear', 'Accessories'];

export default function AssetsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  const filteredAssets = selectedCategory === 'All'
    ? mockAssets
    : mockAssets.filter(asset => asset.category === selectedCategory);

  const toggleAssetSelection = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  return (
    <div className="h-full p-4">
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-full overflow-auto">
        {/* Header */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">Assets</h1>
            <p className="text-sm text-gray-500 mt-1">Images from your company's Digital Asset Management</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedAssets.size > 0 && (
              <span className="text-sm text-gray-500">{selectedAssets.size} selected</span>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Asset grid */}
        <div className="p-6">
          <div className="grid grid-cols-6 gap-4">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => toggleAssetSelection(asset.id)}
                className={`group cursor-pointer relative`}
              >
                {/* Image container */}
                <div className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  selectedAssets.has(asset.id)
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Hover overlay */}
                  <div className={`absolute inset-0 bg-black transition-opacity rounded-xl ${
                    selectedAssets.has(asset.id) ? 'bg-opacity-20' : 'bg-opacity-0 group-hover:bg-opacity-10'
                  }`} />

                  {/* Selection checkbox */}
                  <div className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedAssets.has(asset.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white border-gray-300 opacity-0 group-hover:opacity-100'
                  }`}>
                    {selectedAssets.has(asset.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Asset info */}
                <div className="mt-2">
                  <p className="text-sm text-gray-700 truncate">{asset.name}</p>
                  <p className="text-xs text-gray-400">{asset.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
