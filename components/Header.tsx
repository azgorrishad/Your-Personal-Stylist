import React from 'react';
import { Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
         <Sparkles className="w-8 h-8 text-indigo-600 mr-3" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Your Personal Stylist
        </h1>
      </div>
    </header>
  );
};