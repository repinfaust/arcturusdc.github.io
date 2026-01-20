'use client';

import { useEffect } from 'react';

export default function FightOrFlightPage() {
  useEffect(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const uiHp = document.getElementById('hp');
    const uiScore = document.getElementById('score');
    const uiMsg = document.getElementById('message');

    // --- GAME SETTINGS ---
    let gameState = 'START'; // START, PLAYING, GAMEOVER, WIN
    let frames = 0;
    let gravity = 0.5;

    // --- HERO: SMASHER ---
    const hero = {
      x: 100,
      y: 300,
      width: 50,
      height: 50,
      vx: 0,
      vy: 0,
      speed: 5,
      jumpPower: -10,
      hp: 100,
      coins: 0,
      color: 'blue',
      emoji: '🦸‍♂️',
      facingRight: true,
      powerUp: false,
      powerTimer: 0
    };

    // --- VILLAIN: PISH THE PENGUIN ---
    const boss = {
      x: 600,
      y: 450,
      width: 80,
      height: 80,
      hp: 100,
      maxHp: 100,
      speed: 2,
      direction: -1,
      emoji: '🐧',
      name: 'PISH THE PENGUIN',
      attackTimer: 0,
      bellyFlopState: 'GROUND', // GROUND, JUMPING, FALLING, LANDED
      bellyFlopTimer: 0,
      jumpY: 0
    };

    // --- OBJECTS ---
    let lasers = [];
    let hotdogs = [];
    let punches = [];
    let iceCracks = []; // Ice cracks from belly flops
    let piranhas = []; // Piranhas in the cracks

    // --- INPUTS ---
    const keys = {};
    const handleKeyDown = (e) => {
      // Prevent arrow keys and space from scrolling the page
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      keys[e.code] = true;
      if(gameState === 'START' && e.code === 'Space') resetGame();
      if(gameState === 'GAMEOVER' && e.code === 'Space') resetGame();
      if(gameState === 'WIN' && e.code === 'Space') resetGame();

      // Fighting Logic
      if(gameState === 'PLAYING' && e.code === 'Space') {
        punch();
      }
    };
    const handleKeyUp = (e) => {
      // Prevent arrow keys from scrolling the page
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- MOBILE TOUCH CONTROLS ---
    const handleTouchButton = (action, isPressed) => {
      if (action === 'left') {
        keys['ArrowLeft'] = isPressed;
      } else if (action === 'right') {
        keys['ArrowRight'] = isPressed;
      } else if (action === 'jump') {
        keys['ArrowUp'] = isPressed;
      } else if (action === 'punch') {
        if (isPressed) {
          if (gameState === 'START' || gameState === 'GAMEOVER' || gameState === 'WIN') {
            resetGame();
          } else if (gameState === 'PLAYING') {
            punch();
          }
        }
      }
    };

    // Make touch handler available globally for buttons
    window.handleTouchButton = handleTouchButton;

    function resetGame() {
      hero.hp = 100;
      hero.x = 100;
      hero.y = 300;
      hero.coins = 0;
      boss.hp = 100;
      boss.x = 600;
      boss.y = 450; // Ground level
      boss.bellyFlopState = 'GROUND';
      boss.bellyFlopTimer = 0;
      lasers = [];
      hotdogs = [];
      iceCracks = [];
      piranhas = [];
      gameState = 'PLAYING';
      uiMsg.style.display = 'none';
    }

    function punch() {
      // Create a punch hitbox
      const punchX = hero.facingRight ? hero.x + 40 : hero.x - 40;
      punches.push({
        x: punchX,
        y: hero.y + 10,
        width: 40,
        height: 30,
        life: 10
      });
    }

    // --- GAME LOOP ---
    function update() {
      if(gameState !== 'PLAYING') return;
      frames++;

      // 1. HERO MOVEMENT (Fight or Flight!)
      if (keys['ArrowLeft'] || keys['KeyA']) { hero.vx = -hero.speed; hero.facingRight = false; }
      else if (keys['ArrowRight'] || keys['KeyD']) { hero.vx = hero.speed; hero.facingRight = true; }
      else { hero.vx = 0; }

      if (keys['ArrowUp'] || keys['KeyW']) {
        hero.vy = hero.jumpPower; // Flight/Jump
      }

      hero.vy += gravity;
      hero.x += hero.vx;
      hero.y += hero.vy;

      // Floor Collision
      if (hero.y > 500) { hero.y = 500; hero.vy = 0; }
      // Ceiling/Walls
      if (hero.y < 0) hero.y = 0;
      if (hero.x < 0) hero.x = 0;
      if (hero.x > canvas.width - hero.width) hero.x = canvas.width - hero.width;

      // 2. BOSS AI (Pish the Penguin - Belly Flop Attack!)
      boss.attackTimer++;

      if (boss.bellyFlopState === 'GROUND') {
        // Move back and forth on ground
        boss.x += boss.speed * boss.direction;
        if (boss.x < 400 || boss.x > 700) boss.direction *= -1;

        // Start belly flop attack
        if (boss.attackTimer > 120) {
          boss.bellyFlopState = 'JUMPING';
          boss.jumpY = boss.y;
          boss.attackTimer = 0;
        }
      } else if (boss.bellyFlopState === 'JUMPING') {
        // Jump up into the air
        boss.y -= 8;
        if (boss.y < 200) {
          boss.bellyFlopState = 'FALLING';
        }
      } else if (boss.bellyFlopState === 'FALLING') {
        // Fall down with MASSIVE BELLY FLOP!
        boss.y += 12;
        if (boss.y >= 450) {
          boss.y = 450;
          boss.bellyFlopState = 'LANDED';
          boss.bellyFlopTimer = 30; // Stun time after landing

          // CREATE ICE CRACK!
          const crackX = boss.x - 50;
          const crackWidth = 180;
          iceCracks.push({
            x: crackX,
            y: 540,
            width: crackWidth,
            height: 60,
            lifetime: 300, // Crack stays for 5 seconds
            age: 0
          });

          // Spawn piranhas in the crack!
          for (let i = 0; i < 3; i++) {
            piranhas.push({
              x: crackX + (i * 60) + 20,
              y: 555,
              emoji: '🐟',
              wiggle: Math.random() * Math.PI * 2
            });
          }
        }
      } else if (boss.bellyFlopState === 'LANDED') {
        // Stunned after landing
        boss.bellyFlopTimer--;
        if (boss.bellyFlopTimer <= 0) {
          boss.bellyFlopState = 'GROUND';
        }
      }

      // 3. SPAWN HOTDOGS (Randomly)
      if(Math.random() < 0.005) { // Rare chance
        hotdogs.push({x: Math.random() * 700, y: 0, vy: 2, emoji: '🌭'});
      }

      // 4. PHYSICS & COLLISIONS

      // Ice Cracks - Age them and check if hero falls in
      for(let i=0; i<iceCracks.length; i++) {
        iceCracks[i].age++;

        // Check if hero is standing on a crack (dangerous!)
        if (hero.y >= 480 && hero.y <= 520 &&
            hero.x + hero.width > iceCracks[i].x &&
            hero.x < iceCracks[i].x + iceCracks[i].width) {
          // FALLING THROUGH ICE!
          hero.hp -= 15; // Big damage from piranhas!
          hero.y = 300; // Reset position
          hero.x = 100;
        }

        // Remove old cracks
        if (iceCracks[i].age > iceCracks[i].lifetime) {
          iceCracks.splice(i, 1);
          i--;
        }
      }

      // Animate piranhas
      for(let i=0; i<piranhas.length; i++) {
        piranhas[i].wiggle += 0.1;
      }

      // Lasers (removed for penguin, but keeping structure)
      for(let i=0; i<lasers.length; i++) {
        lasers[i].x += lasers[i].vx;
        // Hit Hero?
        if(rectIntersect(lasers[i].x, lasers[i].y, 20, 5, hero)) {
          hero.hp -= 10;
          lasers.splice(i, 1);
          i--;
        }
      }

      // Punches hitting Boss
      for(let i=0; i<punches.length; i++) {
        punches[i].life--;
        if(rectIntersect(punches[i].x, punches[i].y, punches[i].width, punches[i].height, boss)) {
          let dmg = hero.powerUp ? 10 : 2; // Super strength!
          boss.hp -= dmg;
          punches.splice(i, 1);
          i--;
          // Knockback boss
          boss.x += 10;
        } else if (punches[i].life <= 0) {
          punches.splice(i, 1);
          i--;
        }
      }

      // Eating Hotdogs
      for(let i=0; i<hotdogs.length; i++) {
        hotdogs[i].y += hotdogs[i].vy;
        if(rectIntersect(hotdogs[i].x, hotdogs[i].y, 30, 30, hero)) {
          activateHotdogPower();
          hotdogs.splice(i, 1);
          i--;
        }
      }

      // Hero Power Timer
      if(hero.powerUp) {
        hero.powerTimer--;
        if(hero.powerTimer <= 0) {
          hero.powerUp = false;
          hero.speed = 5; // Reset speed
          hero.emoji = '🦸‍♂️';
        }
      }

      // 5. WIN/LOSS CHECKS
      if(hero.hp <= 0) {
        gameState = 'GAMEOVER';
        uiMsg.innerText = "GAME OVER! TRY AGAIN!";
        uiMsg.style.display = 'block';
      }
      if(boss.hp <= 0) {
        gameState = 'WIN';
        uiMsg.innerText = "YOU DEFEATED PISH THE PENGUIN!";
        uiMsg.style.display = 'block';
      }

      // Update UI
      uiHp.innerText = hero.hp;
      uiScore.innerText = hero.coins;
    }

    function activateHotdogPower() {
      hero.powerUp = true;
      hero.powerTimer = 300; // 5 seconds approx
      hero.hp = 100; // Heal
      hero.speed = 15; // SUPER SPEED
      hero.emoji = '🌭⚡'; // Visual change
      // Add floating text effect in draw loop later
    }

    function rectIntersect(x1, y1, w1, h1, r2) {
      return r2.x < x1 + w1 && r2.x + r2.width > x1 &&
             r2.y < y1 + h1 && r2.y + r2.height > y1;
    }

    // --- DRAW LOOP ---
    function draw() {
      // Clear Screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Antarctic Ice Ground
      ctx.fillStyle = '#B0E0E6'; // Powder blue ice
      ctx.fillRect(0, 550, 800, 50);

      // Ice texture effect
      ctx.fillStyle = '#E0FFFF'; // Light cyan highlights
      for (let i = 0; i < 10; i++) {
        ctx.fillRect(i * 80 + 10, 555, 30, 5);
      }

      // Draw Ice Cracks FIRST (behind everything)
      ctx.fillStyle = '#00008B'; // Dark blue for cracks
      for(let crack of iceCracks) {
        // Draw jagged crack lines
        ctx.fillRect(crack.x, crack.y, crack.width, crack.height);

        // Draw crack lines
        ctx.strokeStyle = '#000080';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(crack.x, crack.y);
        ctx.lineTo(crack.x + crack.width/3, crack.y + 10);
        ctx.lineTo(crack.x + crack.width/2, crack.y + 5);
        ctx.lineTo(crack.x + 2*crack.width/3, crack.y + 15);
        ctx.lineTo(crack.x + crack.width, crack.y);
        ctx.stroke();
      }

      // Draw Piranhas in cracks
      ctx.font = '25px Arial';
      for(let p of piranhas) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.wiggle) * 0.2); // Wiggle animation
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      }

      // Draw Hero
      ctx.font = '50px Arial';
      // Flip emoji if facing left
      ctx.save();
      if(!hero.facingRight) {
        ctx.scale(-1, 1);
        ctx.fillText(hero.emoji, -hero.x - hero.width, hero.y + 40);
      } else {
        ctx.fillText(hero.emoji, hero.x, hero.y + 40);
      }
      ctx.restore();

      // Draw Boss (Pish the Penguin) - MASSIVE SIZE!
      if(boss.hp > 0) {
        ctx.font = '80px Arial'; // BIGGER PENGUIN!
        ctx.fillText(boss.emoji, boss.x, boss.y + 60);

        // Boss Health Bar
        ctx.fillStyle = 'red';
        ctx.fillRect(boss.x, boss.y - 15, 80, 6);
        ctx.fillStyle = 'green';
        ctx.fillRect(boss.x, boss.y - 15, 80 * (boss.hp/boss.maxHp), 6);

        // Boss Name
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText('PISH THE PENGUIN', boss.x - 10, boss.y - 25);
      }

      // Draw Lasers (unused now but kept for compatibility)
      ctx.fillStyle = 'red';
      for(let l of lasers) {
        ctx.fillRect(l.x, l.y, 20, 5);
      }

      // Draw Hotdogs
      ctx.font = '30px Arial';
      for(let h of hotdogs) {
        ctx.fillText(h.emoji, h.x, h.y);
      }

      // Draw Punch Visual
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for(let p of punches) {
        ctx.beginPath();
        ctx.arc(p.x + p.width/2, p.y + p.height/2, 20, 0, Math.PI*2);
        ctx.fill();
      }

      // Draw Powerup Text
      if(hero.powerUp) {
        ctx.fillStyle = 'yellow';
        ctx.font = '20px Arial';
        ctx.fillText("HOTDOG SPEED!!!", hero.x - 20, hero.y - 10);
      }

      if(gameState === 'START') {
        uiMsg.style.display = 'block';
      }
    }

    // Run Game
    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }
    loop();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div style={{
      margin: 0,
      padding: '20px',
      backgroundColor: '#222',
      minHeight: '100vh',
      fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif",
      color: 'white',
      overflowY: 'auto'
    }}>
      {/* Title */}
      <h1 style={{
        textAlign: 'center',
        fontSize: '48px',
        margin: '20px 0',
        color: '#00FFFF',
        textShadow: '3px 3px 0 #FF4500'
      }}>
        FIGHT OR FLIGHT v0.1
      </h1>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '20px',
        flexWrap: 'wrap',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Left Panel - Controls */}
        <div style={{
          backgroundColor: '#333',
          border: '3px solid #00FFFF',
          borderRadius: '10px',
          padding: '20px',
          minWidth: '250px',
          maxWidth: '280px'
        }}>
          <h2 style={{
            color: '#FFD700',
            fontSize: '24px',
            marginTop: 0,
            borderBottom: '2px solid #FFD700',
            paddingBottom: '10px'
          }}>CONTROLS</h2>

          <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
            <p><strong style={{ color: '#00FF00' }}>MOVE:</strong></p>
            <p>← → or A D - Left/Right</p>
            <p>↑ or W - Jump/Flight</p>

            <p style={{ marginTop: '15px' }}><strong style={{ color: '#FF4500' }}>FIGHT:</strong></p>
            <p>SPACE - Punch!</p>

            <p style={{ marginTop: '15px' }}><strong style={{ color: '#FFD700' }}>START:</strong></p>
            <p>SPACE - Begin Game</p>
          </div>
        </div>

        {/* Center - Game Container */}
        <div id="gameContainer" style={{
          position: 'relative',
          border: '5px solid #fff',
          boxShadow: '0 0 20px rgba(0,255,255,0.5)'
        }}>
          <div id="ui" style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            fontSize: '20px',
            color: '#000',
            textShadow: '1px 1px 0 #fff',
            pointerEvents: 'none'
          }}>
            HERO: <span id="heroName">SMASHER</span><br />
            HP: <span id="hp">100</span>%<br />
            COINS: <span id="score">0</span>
          </div>
          <div id="message" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '40px',
            color: '#FF4500',
            textShadow: '2px 2px 0 #fff',
            display: 'block'
          }}>
            PRESS SPACE TO START
          </div>
          <canvas
            id="gameCanvas"
            width="800"
            height="600"
            style={{
              display: 'block',
              background: 'linear-gradient(to bottom, #F0F8FF, #B0E0E6)' // Antarctic sky
            }}
          />

          {/* Mobile Touch Controls - Only visible on touch devices */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '0',
            right: '0',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 20px',
            pointerEvents: 'none'
          }}>
            {/* Left side - Movement controls */}
            <div style={{
              display: 'flex',
              gap: '10px',
              pointerEvents: 'auto'
            }}>
              {/* Left button */}
              <button
                onTouchStart={() => window.handleTouchButton('left', true)}
                onTouchEnd={() => window.handleTouchButton('left', false)}
                onMouseDown={() => window.handleTouchButton('left', true)}
                onMouseUp={() => window.handleTouchButton('left', false)}
                onMouseLeave={() => window.handleTouchButton('left', false)}
                style={{
                  width: '60px',
                  height: '60px',
                  fontSize: '24px',
                  backgroundColor: 'rgba(0, 255, 255, 0.7)',
                  border: '3px solid white',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  touchAction: 'none',
                  userSelect: 'none'
                }}
              >
                ◄
              </button>

              {/* Right button */}
              <button
                onTouchStart={() => window.handleTouchButton('right', true)}
                onTouchEnd={() => window.handleTouchButton('right', false)}
                onMouseDown={() => window.handleTouchButton('right', true)}
                onMouseUp={() => window.handleTouchButton('right', false)}
                onMouseLeave={() => window.handleTouchButton('right', false)}
                style={{
                  width: '60px',
                  height: '60px',
                  fontSize: '24px',
                  backgroundColor: 'rgba(0, 255, 255, 0.7)',
                  border: '3px solid white',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  touchAction: 'none',
                  userSelect: 'none'
                }}
              >
                ►
              </button>
            </div>

            {/* Right side - Action controls */}
            <div style={{
              display: 'flex',
              gap: '10px',
              pointerEvents: 'auto'
            }}>
              {/* Jump button */}
              <button
                onTouchStart={() => window.handleTouchButton('jump', true)}
                onTouchEnd={() => window.handleTouchButton('jump', false)}
                onMouseDown={() => window.handleTouchButton('jump', true)}
                onMouseUp={() => window.handleTouchButton('jump', false)}
                onMouseLeave={() => window.handleTouchButton('jump', false)}
                style={{
                  width: '60px',
                  height: '60px',
                  fontSize: '20px',
                  backgroundColor: 'rgba(0, 255, 0, 0.7)',
                  border: '3px solid white',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  touchAction: 'none',
                  userSelect: 'none'
                }}
              >
                JUMP
              </button>

              {/* Punch button */}
              <button
                onTouchStart={() => window.handleTouchButton('punch', true)}
                onTouchEnd={() => window.handleTouchButton('punch', false)}
                onMouseDown={() => window.handleTouchButton('punch', true)}
                onMouseUp={() => window.handleTouchButton('punch', false)}
                style={{
                  width: '60px',
                  height: '60px',
                  fontSize: '16px',
                  backgroundColor: 'rgba(255, 69, 0, 0.7)',
                  border: '3px solid white',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  touchAction: 'none',
                  userSelect: 'none'
                }}
              >
                PUNCH
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Game Info */}
        <div style={{
          backgroundColor: '#333',
          border: '3px solid #00FFFF',
          borderRadius: '10px',
          padding: '20px',
          minWidth: '250px',
          maxWidth: '280px'
        }}>
          <h2 style={{
            color: '#FFD700',
            fontSize: '24px',
            marginTop: 0,
            borderBottom: '2px solid #FFD700',
            paddingBottom: '10px'
          }}>OBJECTIVE</h2>

          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Defeat <strong style={{ color: '#87CEEB' }}>PISH THE PENGUIN</strong> before he freezes you out!
          </p>

          <h3 style={{ color: '#FF4500', fontSize: '18px', marginTop: '20px' }}>WATCH OUT!</h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
            🐧 Pish does massive <strong>BELLY FLOPS</strong> that crack the ice!
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
            ❄️ Avoid the <strong>ICE CRACKS</strong> or you'll fall through!
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
            🐟 <strong>PIRANHAS</strong> in the water will bite you for 15 HP!
          </p>

          <h3 style={{ color: '#00FF00', fontSize: '18px', marginTop: '20px' }}>POWER-UPS!</h3>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
            🌭 <strong>HOTDOGS</strong> grant super speed and heal you to full HP!
          </p>
        </div>
      </div>

      {/* Bottom Panel - Characters */}
      <div style={{
        maxWidth: '1200px',
        margin: '30px auto',
        backgroundColor: '#333',
        border: '3px solid #FFD700',
        borderRadius: '10px',
        padding: '20px'
      }}>
        <h2 style={{
          color: '#FFD700',
          fontSize: '28px',
          textAlign: 'center',
          marginTop: 0,
          borderBottom: '2px solid #FFD700',
          paddingBottom: '10px'
        }}>CHARACTERS</h2>

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '20px',
          marginTop: '20px'
        }}>
          {/* Hero */}
          <div style={{
            textAlign: 'center',
            flex: '1',
            minWidth: '200px',
            padding: '15px',
            backgroundColor: '#444',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '60px' }}>🦸‍♂️</div>
            <h3 style={{ color: '#00FF00', margin: '10px 0' }}>SMASHER</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
              The hero! Quick on his feet and packs a mean punch. When powered up by hotdogs, nothing can stop him!
            </p>
          </div>

          {/* Boss */}
          <div style={{
            textAlign: 'center',
            flex: '1',
            minWidth: '200px',
            padding: '15px',
            backgroundColor: '#444',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '60px' }}>🐧</div>
            <h3 style={{ color: '#87CEEB', margin: '10px 0' }}>PISH THE PENGUIN</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
              A MASSIVE penguin from Antarctica! Attacks with devastating belly flops that crack the ice. Controls the piranhas of the frozen south!
            </p>
          </div>

          {/* Piranhas */}
          <div style={{
            textAlign: 'center',
            flex: '1',
            minWidth: '200px',
            padding: '15px',
            backgroundColor: '#444',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '60px' }}>🐟</div>
            <h3 style={{ color: '#FF6347', margin: '10px 0' }}>ICE PIRANHAS</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Deadly fish that lurk in the crevices created by Pish's attacks. Fall in and they'll chomp you for massive damage!
            </p>
          </div>

          {/* Power-up */}
          <div style={{
            textAlign: 'center',
            flex: '1',
            minWidth: '200px',
            padding: '15px',
            backgroundColor: '#444',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '60px' }}>🌭</div>
            <h3 style={{ color: '#FFD700', margin: '10px 0' }}>HOTDOG</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
              A mystical hotdog that falls from the sky! Grants super speed, mega strength, and full health restoration!
            </p>
          </div>
        </div>
      </div>

      {/* Credits */}
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '14px',
        color: '#888'
      }}>
        <p>👨‍💻 ARCTURUS DIGITAL CONSULTING</p>
        <p>Junior Creative Assistant: Felix | Lead Designer: Dad</p>
        <p>Version: 0.1</p>
      </div>

      <style jsx>{`
        @media (max-width: 1200px) {
          h1 {
            font-size: 36px !important;
          }
        }
      `}</style>
    </div>
  );
}
