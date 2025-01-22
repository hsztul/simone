export default function GameOverModal({ score, onRestart }) {
  // Array of witty messages based on score
  const messages = [
    "Oops! Even Einstein had off days...",
    "Memory loading... Error 404: Pattern not found!",
    "Close! But close only counts in horseshoes and hand grenades.",
    "Plot twist: The squares were actually testing you!",
    "Your memory is like RAM - temporary but precious.",
    "Think of this as a practice round... for the practice round.",
    "The squares are impressed by your confidence!",
    "You're really keeping these squares on their toes!",
    "Almost had it! The squares were getting nervous.",
    "So close to greatness, we could taste it!"
  ];

  // Get a message based on the score
  const getMessage = () => {
    return messages[Math.min(score, messages.length - 1)];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
        <p className="text-gray-600 mb-4 italic">{getMessage()}</p>
        <p className="text-lg mb-6">
          You remembered <span className="font-bold text-blue-600">{score}</span> {score === 1 ? 'pattern' : 'patterns'}!
        </p>
        <button
          onClick={onRestart}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
