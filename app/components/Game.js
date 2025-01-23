import { useState, useEffect, useCallback, useRef } from 'react';
import ColorButton from './ColorButton';
import MenuBar from './MenuBar';
import WelcomeModal from './WelcomeModal';
import GameOverModal from './GameOverModal';
import SuccessModal from './SuccessModal';

const COLORS = ['red', 'blue', 'green', 'yellow'];
const PATTERN_LENGTH = 10;
const STEP_DURATION = 500; // Total time for each step
const SQUARE_DISPLAY_TIME = 300; // How long each square stays lit
const PAUSE_BETWEEN_SQUARES = 200; // Pause between squares

export default function Game() {
  const [pattern, setPattern] = useState([]);
  const [playerPattern, setPlayerPattern] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [litButton, setLitButton] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [isFreePlayMode, setIsFreePlayMode] = useState(false);
  const audioContext = useRef(null);
  const sequenceTimeouts = useRef([]);
  const [tempo, setTempo] = useState(120);
  const [beatVolume, setBeatVolume] = useState(0.3);
  const [beatComplexity, setBeatComplexity] = useState(0.5);
  const beatContext = useRef(null);
  const beatNodes = useRef([]);
  const beatInterval = useRef(null);
  const masterGain = useRef(null);
  const [isBeatPlaying, setIsBeatPlaying] = useState(false);

  // Load best score and check if game was already won today
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const savedBest = localStorage.getItem(`simons-best-score-${today}`);
    const wonToday = localStorage.getItem(`simons-won-${today}`);
    
    if (savedBest) {
      setBestScore(parseInt(savedBest, 10));
    }
    
    if (wonToday === 'true') {
      setIsFreePlayMode(true);
      setGameStarted(true);
    }
  }, []);

  // Update best score when current round changes
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    if (currentRound > bestScore) {
      setBestScore(currentRound);
      localStorage.setItem(`simons-best-score-${today}`, currentRound.toString());
    }
  }, [currentRound, bestScore]);

  // Generate daily pattern based on the date
  const generateDailyPattern = useCallback(() => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    let seed = 0;
    for (let i = 0; i < dateString.length; i++) {
      seed = ((seed << 5) - seed) + dateString.charCodeAt(i);
      seed = seed & seed; // Convert to 32-bit integer
    }
    
    const newPattern = [];
    let rng = Math.abs(seed);
    for (let i = 0; i < PATTERN_LENGTH; i++) {
      rng = (rng * 1664525 + 1013904223) % 4294967296;
      newPattern.push(COLORS[Math.abs(rng) % 4]);
    }
    return newPattern;
  }, []);

  // Initialize game
  useEffect(() => {
    const dailyPattern = generateDailyPattern();
    setPattern(dailyPattern);
  }, [generateDailyPattern]);

  // Cleanup function to cancel all ongoing sequences and audio
  const cleanup = useCallback(() => {
    // Clear all timeouts
    sequenceTimeouts.current.forEach(timeout => clearTimeout(timeout));
    sequenceTimeouts.current = [];
    
    // Close any existing audio context
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
    
    // Reset visual state
    setLitButton(null);
    setIsPlaying(false);
  }, []);

  // Stop background beat
  const stopBeat = useCallback(() => {
    if (beatInterval.current) {
      clearInterval(beatInterval.current);
      beatInterval.current = null;
    }
    
    beatNodes.current.forEach(node => {
      if (node.stop) {
        node.stop();
      }
      if (node.disconnect) {
        node.disconnect();
      }
    });
    
    beatNodes.current = [];
    
    if (beatContext.current) {
      beatContext.current.close();
      beatContext.current = null;
    }
    
    setIsBeatPlaying(false);
  }, []);

  // Create and play background beat
  const startBeat = useCallback(() => {
    if (!beatContext.current) {
      beatContext.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGain.current = beatContext.current.createGain();
      masterGain.current.connect(beatContext.current.destination);
      masterGain.current.gain.setValueAtTime(beatVolume, beatContext.current.currentTime);
    }

    const beatLength = 60 / tempo;
    
    // Create drum sounds
    const createDrumSound = (frequency, decay) => {
      const oscillator = beatContext.current.createOscillator();
      const gainNode = beatContext.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(masterGain.current);
      
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(1.0, beatContext.current.currentTime); // Set to full volume, master gain controls overall volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, beatContext.current.currentTime + decay);
      
      oscillator.start(beatContext.current.currentTime);
      oscillator.stop(beatContext.current.currentTime + decay);
      
      beatNodes.current.push(oscillator);
      beatNodes.current.push(gainNode);
    };

    // Create hi-hat sound
    const createHiHat = () => {
      const noise = beatContext.current.createBufferSource();
      const noiseLength = 0.1;
      const buffer = beatContext.current.createBuffer(1, beatContext.current.sampleRate * noiseLength, beatContext.current.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const gainNode = beatContext.current.createGain();
      const filter = beatContext.current.createBiquadFilter();
      
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      
      noise.buffer = buffer;
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(masterGain.current);
      
      gainNode.gain.setValueAtTime(0.3, beatContext.current.currentTime); // Set to 30% of master volume
      gainNode.gain.linearRampToValueAtTime(0.01, beatContext.current.currentTime + 0.05);
      
      noise.start(beatContext.current.currentTime);
      
      beatNodes.current.push(noise);
      beatNodes.current.push(gainNode);
      beatNodes.current.push(filter);
    };

    let beat = 0;
    const playBeat = () => {
      const complexity = Math.floor(beatComplexity * 4); // 0-3 levels of complexity
      
      // Kick drum on beats 1 and 3
      if (beat % 4 === 0 || (complexity > 1 && beat % 4 === 2)) {
        createDrumSound(60, 0.2);
      }
      
      // Snare on beats 2 and 4
      if (beat % 4 === 1 || beat % 4 === 3) {
        createDrumSound(200, 0.1);
      }
      
      // Hi-hat patterns based on complexity
      if (complexity === 0 && beat % 4 === 0) { // Quarter notes
        createHiHat();
      } else if (complexity === 1 && beat % 2 === 0) { // Eighth notes
        createHiHat();
      } else if (complexity === 2) { // Eighth notes + offbeats
        createHiHat();
      } else if (complexity === 3 && beat % 2 === 1) { // Sixteenth notes
        createHiHat();
        setTimeout(() => createHiHat(), (60 / tempo / 4) * 1000);
      }
      
      beat = (beat + 1) % 8;
    };

    // Start the beat loop
    beatInterval.current = setInterval(playBeat, beatLength * 1000 / 2);
    setIsBeatPlaying(true);
  }, [tempo, beatVolume, beatComplexity]);

  // Update master volume when beatVolume changes
  useEffect(() => {
    if (beatContext.current && masterGain.current && isBeatPlaying) {
      masterGain.current.gain.setValueAtTime(beatVolume, beatContext.current.currentTime);
    }
  }, [beatVolume, isBeatPlaying]);

  // Restart beat when tempo changes
  useEffect(() => {
    if (isBeatPlaying) {
      stopBeat();
      startBeat();
    }
  }, [tempo, beatComplexity, isBeatPlaying, stopBeat, startBeat]);

  // Start/stop beat when entering/leaving free play mode
  useEffect(() => {
    if (isFreePlayMode && gameStarted && !isBeatPlaying) {
      startBeat();
    } else if (!isFreePlayMode && isBeatPlaying) {
      stopBeat();
    }
    
    return () => {
      if (isBeatPlaying) {
        stopBeat();
      }
    };
  }, [isFreePlayMode, gameStarted, isBeatPlaying, startBeat, stopBeat]);

  // Play 8-bit style melody
  const playMelody = (notes) => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const masterGain = audioContext.current.createGain();
    masterGain.gain.setValueAtTime(0.3, audioContext.current.currentTime);
    masterGain.connect(audioContext.current.destination);

    notes.forEach(({ freq, duration, startTime, type = 'square' }) => {
      const oscillator = audioContext.current.createOscillator();
      const noteGain = audioContext.current.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, audioContext.current.currentTime + startTime);
      
      noteGain.gain.setValueAtTime(0, audioContext.current.currentTime + startTime);
      noteGain.gain.linearRampToValueAtTime(0.3, audioContext.current.currentTime + startTime + 0.05);
      noteGain.gain.setValueAtTime(0.3, audioContext.current.currentTime + startTime + duration - 0.05);
      noteGain.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + startTime + duration);
      
      oscillator.connect(noteGain);
      noteGain.connect(masterGain);
      
      oscillator.start(audioContext.current.currentTime + startTime);
      oscillator.stop(audioContext.current.currentTime + startTime + duration);
    });
  };

  // Play victory tune (Super Mario style)
  const playVictoryTune = () => {
    const notes = [
      { freq: 659.25, duration: 0.2, startTime: 0 },     // E5
      { freq: 659.25, duration: 0.2, startTime: 0.2 },   // E5
      { freq: 659.25, duration: 0.2, startTime: 0.4 },   // E5
      { freq: 523.25, duration: 0.2, startTime: 0.6 },   // C5
      { freq: 659.25, duration: 0.2, startTime: 0.8 },   // E5
      { freq: 783.99, duration: 0.4, startTime: 1.0 },   // G5
      { freq: 392.00, duration: 0.4, startTime: 1.4 },   // G4
    ];
    playMelody(notes);
  };

  // Play game over tune (8-bit style)
  const playGameOverTune = () => {
    const notes = [
      { freq: 493.88, duration: 0.2, startTime: 0 },     // B4
      { freq: 466.16, duration: 0.2, startTime: 0.2 },   // Bb4
      { freq: 440.00, duration: 0.2, startTime: 0.4 },   // A4
      { freq: 415.30, duration: 0.2, startTime: 0.6 },   // Ab4
      { freq: 392.00, duration: 0.4, startTime: 0.8 },   // G4
      { freq: 293.66, duration: 0.4, startTime: 1.2 },   // D4
    ];
    playMelody(notes);
  };

  // Play sound effect with rich chords
  const playSound = (color) => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Define chord frequencies for each color (more distinct chords)
    const chords = {
      red: [
        261.63,  // C4
        329.63,  // E4
        392.00,  // G4
        523.25   // C5
      ],
      blue: [
        293.66,  // D4
        440.00,  // A4
        587.33,  // D5
        880.00   // A5
      ],
      green: [
        196.00,  // G3
        392.00,  // G4
        493.88,  // B4
        587.33   // D5
      ],
      yellow: [
        349.23,  // F4
        440.00,  // A4
        523.25,  // C5
        698.46   // F5
      ]
    };

    const waveforms = ['sine', 'square', 'triangle', 'square'];
    const gains = [0.4, 0.2, 0.2, 0.1];

    // Create a master gain node
    const masterGain = audioContext.current.createGain();
    masterGain.gain.setValueAtTime(0, audioContext.current.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.3, audioContext.current.currentTime + 0.1);
    masterGain.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.4);
    masterGain.connect(audioContext.current.destination);

    // Create oscillators for each note in the chord
    chords[color].forEach((frequency, index) => {
      const oscillator = audioContext.current.createOscillator();
      const oscGain = audioContext.current.createGain();
      
      oscillator.type = waveforms[index];
      oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);
      
      oscGain.gain.setValueAtTime(gains[index], audioContext.current.currentTime);
      
      oscillator.connect(oscGain);
      oscGain.connect(masterGain);
      
      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.4);
    });
  };

  // Handle player input
  const handleButtonClick = (color) => {
    if (isFreePlayMode) {
      setLitButton(color);
      playSound(color);
      setTimeout(() => setLitButton(null), SQUARE_DISPLAY_TIME);
      return;
    }

    if (isPlaying || showSuccess) return;

    // Light up and play sound for player's click
    setLitButton(color);
    playSound(color);
    setTimeout(() => setLitButton(null), SQUARE_DISPLAY_TIME);

    const newPlayerPattern = [...playerPattern, color];
    setPlayerPattern(newPlayerPattern);

    // Check if the player's input matches the pattern so far
    if (color !== pattern[newPlayerPattern.length - 1]) {
      playGameOverTune();
      setShowGameOver(true);
      return;
    }

    // Check if player completed the current sequence
    if (newPlayerPattern.length === currentRound + 1) {
      const nextRound = currentRound + 1;
      
      if (nextRound === PATTERN_LENGTH) {
        setCurrentRound(PATTERN_LENGTH);
        playVictoryTune();
        setShowSuccess(true);
        const today = new Date().toLocaleDateString();
        localStorage.setItem(`simons-won-${today}`, 'true');
        setIsFreePlayMode(true);
        return;
      }
      
      // Use callback to ensure we have the latest round when playing sequence
      setCurrentRound(prevRound => {
        const timeout = setTimeout(() => {
          playSequence(prevRound + 1);
        }, STEP_DURATION);
        sequenceTimeouts.current.push(timeout);
        return prevRound + 1;
      });
      
      setPlayerPattern([]);
    }
  };

  // Play the current sequence
  const playSequence = useCallback((roundToPlay = currentRound) => {
    cleanup();
    setIsPlaying(true);
    setPlayerPattern([]);
    
    // Play each step in sequence with consistent timing
    const playSteps = async () => {
      for (let i = 0; i <= roundToPlay; i++) {
        // Play the square
        setLitButton(pattern[i]);
        playSound(pattern[i]);
        
        // Wait for square display time
        await new Promise(resolve => {
          const timeout = setTimeout(resolve, SQUARE_DISPLAY_TIME);
          sequenceTimeouts.current.push(timeout);
        });
        
        // Turn off the square
        setLitButton(null);
        
        // Add pause between squares (except after the last square)
        if (i < roundToPlay) {
          await new Promise(resolve => {
            const timeout = setTimeout(resolve, PAUSE_BETWEEN_SQUARES);
            sequenceTimeouts.current.push(timeout);
          });
        }
      }
      
      // Add a small delay after sequence before allowing player input
      await new Promise(resolve => {
        const timeout = setTimeout(() => {
          setIsPlaying(false);
          resolve();
        }, PAUSE_BETWEEN_SQUARES);
        sequenceTimeouts.current.push(timeout);
      });
    };

    playSteps();
  }, [pattern, cleanup]);

  // Handle game restart
  const handleRestart = () => {
    cleanup();
    setPattern(generateDailyPattern());
    setPlayerPattern([]);
    setCurrentRound(0);
    setLitButton(null);
    setShowGameOver(false);
    setShowSuccess(false);
    setGameStarted(false);
    setIsFreePlayMode(false);
    localStorage.removeItem(`simons-won-${new Date().toLocaleDateString()}`);
  };

  // Handle game start
  const handleGameStart = () => {
    setGameStarted(true);
    playSequence(0);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full filter blur-3xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/30 rounded-full filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>

      {/* Game content */}
      <div className="h-full flex flex-col items-center justify-center px-4 pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 font-cabinet tracking-tight">Simone</h1>
          <p className="text-white/60 font-space-grotesk">
            {isFreePlayMode 
              ? "Free Play Mode - Make some music!" 
              : `${currentRound}/10 - Match the pattern to win.`}
          </p>
        </div>

        {/* Game grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-2xl mx-auto">
          <ColorButton color="red" isLit={litButton === 'red'} onClick={() => handleButtonClick('red')} />
          <ColorButton color="blue" isLit={litButton === 'blue'} onClick={() => handleButtonClick('blue')} />
          <ColorButton color="green" isLit={litButton === 'green'} onClick={() => handleButtonClick('green')} />
          <ColorButton color="yellow" isLit={litButton === 'yellow'} onClick={() => handleButtonClick('yellow')} />
        </div>

        {/* Welcome modal - only show if not in free play mode */}
        {!gameStarted && !isFreePlayMode && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-sm w-full border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-4 font-cabinet tracking-tight">Welcome to Simone!</h2>
              <div className="space-y-4 text-white/80 mb-6 font-space-grotesk">
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 flex items-start space-x-2">
                  <span className="text-yellow-300 text-xl">🔊</span>
                  <p className="text-sm text-yellow-100/90">
                    Please check your volume before starting
                  </p>
                </div>
                <p className="text-lg">
                  Match the pattern of colors and sounds. Get to level 10 to win today's puzzle!
                </p>
              </div>
              <button
                onClick={handleGameStart}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/20 font-space-grotesk"
              >
                Start Today's Game
              </button>
            </div>
          </div>
        )}

        {/* Free Play Welcome - show when entering free play mode */}
        {!gameStarted && isFreePlayMode && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-sm w-full border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-4 font-cabinet tracking-tight">Free Play Mode!</h2>
              <div className="space-y-4 text-white/80 mb-6 font-space-grotesk">
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 flex items-start space-x-2">
                  <span className="text-yellow-300 text-xl">🔊</span>
                  <div>
                    <span className="font-cabinet font-semibold text-yellow-300 block mb-1">Sound Check!</span>
                    <span className="text-sm text-yellow-100/90">
                      A beat will start playing automatically. Use the volume slider below to adjust!
                    </span>
                  </div>
                </div>
                <p>
                  You've already mastered today's pattern. Now just have fun making music with the squares!
                </p>
                <p className="text-sm border border-white/20 rounded-lg p-3 bg-white/5">
                  <span className="font-cabinet font-semibold text-white block mb-1">🎵 Music Time:</span>
                  Each square plays a different chord. A beat will play in the background to help you stay in rhythm!
                </p>
              </div>
              <button
                onClick={() => setGameStarted(true)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/20 font-space-grotesk"
              >
                Start Playing
              </button>
            </div>
          </div>
        )}

        {/* Game over modal */}
        {showGameOver && !isFreePlayMode && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-sm w-full border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-4 font-cabinet tracking-tight">Game Over!</h2>
              <div className="space-y-4 mb-6 font-space-grotesk">
                <p className="text-white/80">Your score: {currentRound}</p>
                <p className="text-sm text-white/60">
                  Today's pattern will be available until midnight. Keep practicing to master it!
                </p>
              </div>
              <button
                onClick={handleRestart}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/20 font-space-grotesk"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Success modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-sm w-full border border-white/20">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-2 font-cabinet tracking-tight">Perfect Game! 🎉</h2>
                <p className="text-lg text-white/80 mb-6 font-space-grotesk">You've mastered today's pattern!</p>
                <div className="bg-white/5 border border-white/20 rounded-xl p-4 mb-6 font-space-grotesk">
                  <p className="text-white/80 mb-4">
                    Come back tomorrow for a brand new pattern and another chance to prove your memory skills!
                  </p>
                  <p className="text-white/80">
                    For now, enjoy free play mode and make some music with the squares!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setGameStarted(true);
                  }}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/20 font-space-grotesk"
                >
                  Start Free Play
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Beat controls - only show in free play mode */}
        {isFreePlayMode && gameStarted && (
          <div className="mt-6 max-w-md mx-auto w-full px-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="space-y-3 font-space-grotesk">
                <div>
                  <div className="flex justify-between text-white/60 text-xs mb-1">
                    <span>Tempo: {tempo} BPM</span>
                    <span className="opacity-50">60-180</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="180"
                    value={tempo}
                    onChange={(e) => setTempo(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white/20 hover:accent-white/30"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-white/60 text-xs mb-1">
                    <span>Beat Complexity</span>
                    <span className="opacity-50">Simple → Complex</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={beatComplexity}
                    onChange={(e) => setBeatComplexity(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white/20 hover:accent-white/30"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-white/60 text-xs mb-1">
                    <span>Volume</span>
                    <span className="opacity-50">🔈 → 🔊</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={beatVolume}
                    onChange={(e) => setBeatVolume(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white/20 hover:accent-white/30"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu bar */}
        <MenuBar 
          score={currentRound} 
          bestScore={bestScore} 
          onRestart={isFreePlayMode ? null : handleRestart}
          isFreePlayMode={isFreePlayMode}
        />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full filter blur-3xl animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/30 rounded-full filter blur-3xl animate-blob animation-delay-4000" />
        </div>
      </div>
    </div>
  );
}
