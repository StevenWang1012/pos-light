
import React, { useState } from 'react';
import MerchantApp from './MerchantApp';
import CustomerApp from './CustomerApp';

const App: React.FC = () => {
  // Simple view switcher for demo purposes
  // In real life, scanning the QR code would direct to the Customer app with a URL param
  const [view, setView] = useState<'merchant' | 'customer'>('merchant');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50 bg-black text-white p-2 flex justify-center space-x-4 text-xs opacity-50 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setView('merchant')} 
          className={`px-3 py-1 rounded ${view === 'merchant' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          切換至店家端 (POS)
        </button>
        <button 
          onClick={() => setView('customer')} 
          className={`px-3 py-1 rounded ${view === 'customer' ? 'bg-green-600' : 'bg-gray-700'}`}
        >
          切換至客人端 (點餐)
        </button>
      </div>

      <div className="pt-10 h-full">
        {view === 'merchant' ? <MerchantApp /> : <CustomerApp />}
      </div>
    </div>
  );
};

export default App;
