import React from 'react';

export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      
      {/* 1. Background Color and Padding Test */}
      <h1 className="text-4xl font-extrabold text-white mb-6">
        Tailwind CSS Test Page
      </h1>

      {/* 2. Flexbox, Width, and Border Radius Test */}
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl space-y-4">
        
        {/* 3. Text Color and Size Test */}
        <p className="text-xl text-indigo-600 font-semibold">
          If you see this text in a **large, indigo-colored font** inside a **rounded, white box**, Tailwind is likely working!
        </p>

        {/* 4. Utility Class Test (Padding/Margin, Hover Effect) */}
        <button 
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
          onClick={() => alert('Tailwind interactivity confirmed!')}
        >
          Test Button (Green Background, Scale on Hover)
        </button>
      </div>

      {/* 5. Custom Utility Test (If your original problem was flex-1/2) */}
      <div className="mt-8 flex w-full max-w-md border-2 border-red-500">
          <div className="flex-1 bg-yellow-300 p-2 text-center">Flex-1</div>
          <div className="flex-1 bg-blue-300 p-2 text-center">Flex-1</div>
      </div>
      <p className="text-sm text-gray-500 mt-2">
          (Note: If the two boxes above are NOT equal width, your `flex-1/2` custom utility is not configured, but basic Tailwind is still working.)
      </p>
    </div>
  );
}