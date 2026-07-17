import React, { useEffect, useRef, useState } from 'react';

interface JoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

export default function Joystick({ onMove }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
  const [keyboardVector, setKeyboardVector] = useState({ x: 0, y: 0 });

  // Joystick dimensions
  const maxRadius = 45; // Max displacement in pixels

  // Handle keyboard inputs
  useEffect(() => {
    const activeKeys = new Set<string>();

    const updateKeyboardVector = () => {
      let x = 0;
      let y = 0;
      if (activeKeys.has('w') || activeKeys.has('arrowup')) y -= 1;
      if (activeKeys.has('s') || activeKeys.has('arrowdown')) y += 1;
      if (activeKeys.has('a') || activeKeys.has('arrowleft')) x -= 1;
      if (activeKeys.has('d') || activeKeys.has('arrowright')) x += 1;

      // Normalize diagonal speed
      if (x !== 0 && y !== 0) {
        const len = Math.sqrt(x * x + y * y);
        x /= len;
        y /= len;
      }

      setKeyboardVector({ x, y });
      onMove({ x, y });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        activeKeys.add(key);
        updateKeyboardVector();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        activeKeys.delete(key);
        updateKeyboardVector();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onMove]);

  // Handle touch and mouse events
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    calculatePosition(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    calculatePosition(clientX, clientY);
  };

  const handleEnd = () => {
    setIsDragging(false);
    setTouchPos({ x: 0, y: 0 });
    // Restore keyboard if active, otherwise stop
    onMove(keyboardVector);
  };

  const calculatePosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Compute dynamic maxRadius: subtract part of the knob width to keep it perfectly bound
    const knobWidth = rect.width < 100 ? 32 : 40; 
    const dynamicMaxRadius = (rect.width - knobWidth) / 2;

    if (distance > dynamicMaxRadius) {
      dx = (dx / distance) * dynamicMaxRadius;
      dy = (dy / distance) * dynamicMaxRadius;
    }

    setTouchPos({ x: dx, y: dy });

    // Send normalized vector (-1 to 1) to game loop
    onMove({
      x: dx / dynamicMaxRadius,
      y: dy / dynamicMaxRadius,
    });
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  // Mouse handlers (for testing on desktop with mouse dragging)
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, keyboardVector]);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Keyboard guide overlay inside HUD instead or right above joystick */}
      <div
        id="joystick-boundary"
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center cursor-pointer touch-none active:scale-95 transition-transform"
      >
        {/* Inner ring marker */}
        <div className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-white/10 pointer-events-none" />

        {/* Dynamic thumb handle */}
        <div
          id="joystick-knob"
          className="absolute w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-[0_4px_12px_rgba(255,255,255,0.2)] pointer-events-none"
          style={{
            transform: `translate(${touchPos.x}px, ${touchPos.y}px)`,
          }}
        />

        {/* Multi-directional arrows decoration */}
        <div className="absolute top-1 sm:top-1.5 text-[8px] sm:text-[9px] text-white/30 font-bold">▲</div>
        <div className="absolute bottom-1 sm:bottom-1.5 text-[8px] sm:text-[9px] text-white/30 font-bold">▼</div>
        <div className="absolute left-1 sm:left-1.5 text-[8px] sm:text-[9px] text-white/30 font-bold">◀</div>
        <div className="absolute right-1 sm:right-1.5 text-[8px] sm:text-[9px] text-white/30 font-bold">▶</div>
      </div>
      <p className="mt-1.5 text-[8px] sm:text-[9px] text-slate-400 text-center uppercase tracking-wider font-mono">
        WASD or Drag Joystick
      </p>
    </div>
  );
}
