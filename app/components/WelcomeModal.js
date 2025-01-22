export default function WelcomeModal({ onStart }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Simons</h1>
        <p className="text-gray-600 mb-6">
          Test your memory with this daily pattern game. Watch the sequence of colors and sounds, then repeat it back!
        </p>
        <button
          onClick={onStart}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
