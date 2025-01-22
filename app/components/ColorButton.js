const colorClasses = {
  red: {
    base: 'bg-red-500 hover:bg-red-400',
    lit: 'bg-red-300',
    shadow: 'shadow-red-700/50'
  },
  blue: {
    base: 'bg-blue-500 hover:bg-blue-400',
    lit: 'bg-blue-300',
    shadow: 'shadow-blue-700/50'
  },
  green: {
    base: 'bg-green-500 hover:bg-green-400',
    lit: 'bg-green-300',
    shadow: 'shadow-green-700/50'
  },
  yellow: {
    base: 'bg-yellow-500 hover:bg-yellow-400',
    lit: 'bg-yellow-300',
    shadow: 'shadow-yellow-700/50'
  }
};

export default function ColorButton({ color, isLit, onClick }) {
  const { base, lit, shadow } = colorClasses[color];
  
  return (
    <button
      onClick={onClick}
      className={`
        w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48
        rounded-2xl
        transition-all duration-100 ease-in-out
        transform hover:scale-105 active:scale-95
        ${isLit ? lit : base}
        shadow-lg ${shadow} hover:shadow-xl
        border-4 border-white/20
        backdrop-blur-sm
        relative
        overflow-hidden
      `}
    >
      <div className={`
        absolute inset-0
        ${isLit ? 'animate-pulse-fast' : ''}
        bg-white/20
        rounded-xl
      `} />
      <div className={`
        absolute inset-0
        bg-gradient-to-br from-white/20 to-transparent
        rounded-xl
      `} />
    </button>
  );
}
