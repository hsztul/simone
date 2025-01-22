export default function SuccessModal({ onRestart }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">🎉 Congratulations! 🎉</h2>
        <p className="text-gray-600 mb-6">
          You've completed today's pattern! Your memory is truly impressive.
        </p>
        <button
          onClick={onRestart}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
