import React from 'react';

const CollabHub = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8 max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Collab Hub</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Welcome to the Collab Hub! Here you can manage your collaborations, view analytics, and create new partnership proposals.
        </p>
        {/* Placeholder content – you can replace this with the actual hub UI later */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="py-2 px-4 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            My Collaborations
          </button>
          <button className="py-2 px-4 bg-accent-600 text-white rounded hover:bg-accent-700 transition">
            New Collaboration Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollabHub;
