/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  const handleStartGame = (level: number) => {
    setSelectedLevel(level);
    setScreen('playing');
  };

  const handleReturnToMenu = () => {
    setScreen('menu');
  };

  return (
    <div className="w-full h-full min-h-screen bg-zinc-950 font-sans text-white relative">
      {screen === 'menu' ? (
        <MainMenu onStartGame={handleStartGame} />
      ) : (
        <GameCanvas
          startingLevel={selectedLevel}
          onReturnToMenu={handleReturnToMenu}
        />
      )}
    </div>
  );
}

