export default function MenuBar({ score, bestScore, onRestart, isFreePlayMode }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/10 backdrop-blur-md border-t border-white/20">
      <div className="max-w-4xl mx-auto h-full flex items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          {!isFreePlayMode && (
            <>
              <div className="flex flex-col">
                <span className="text-sm text-white/60">Score</span>
                <span className="text-2xl font-bold text-white">{score}</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="flex flex-col">
                <span className="text-sm text-white/60">Best Today</span>
                <span className="text-2xl font-bold text-white">{bestScore}</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
            </>
          )}
          <div className="hidden md:flex flex-col">
            <span className="text-sm text-white/60">{isFreePlayMode ? "Free Play Mode" : "Daily Pattern"}</span>
            <span className="text-lg font-medium text-white/80">{today}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {onRestart && (
            <button
              onClick={onRestart}
              className="
                px-6 py-2
                bg-white/10 hover:bg-white/20
                rounded-lg
                text-white font-medium
                transition-all duration-200
                border border-white/20
                transform hover:scale-105 active:scale-95
                flex items-center space-x-2
              "
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>Restart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
