// ============================================
// 神秘森林 - 第一关游戏逻辑 v8 (T2.5)
// 关卡系统完善
// ============================================

// ==================== 关卡配置 ====================
const LEVEL_CONFIG = {
    id: 'level_1',
    name: '神秘森林',
    difficulty: 1,
    objectives: [
        { id: 'collect_fragments', name: '收集光芒碎片', target: 3, current: 0, completed: false }
    ],
    rewards: [
        { id: 'exp', name: '经验值', value: 100 },
        { id: 'title', name: '称号', value: '森林探险家' }
    ]
};

// ==================== 配置 ====================
const CONFIG = {
    TILE_SIZE: 32,
    MAP_WIDTH: 50,
    MAP_HEIGHT: 50,
    PLAYER_WIDTH: 2,
    PLAYER_HEIGHT: 2,
    VIEW_WIDTH: 25,
    VIEW_HEIGHT: 25,
    MOVE_INTERVAL: 80,
    CAMERA_LERP: 0.1
};

const TILE_TYPES = {
    0: { name: '草地', color: '#2d5a2d', passable: true },
    1: { name: '大树', color: '#1a3a1a', passable: false },
    2: { name: '石板路', color: '#8d6e63', passable: true },
    3: { name: '湖泊', color: '#1565c0', passable: false },
    4: { name: '出口', color: '#f1c40f', passable: true },
    5: { name: '木屋', color: '#6d4c41', passable: false },
    6: { name: '草丛', color: '#43a047', passable: true },
    7: { name: '石头', color: '#607d8b', passable: false },
    8: { name: '花朵', color: '#e91e63', passable: true },
    10: { name: '迷雾', color: '#90a4ae', passable: false, alpha: 0.7 },
    12: { name: '藤蔓墙', color: '#2e7d32', passable: false }
};

const PASSABLE_TILES = [0, 2, 4, 6, 8];

function generateMap() {
    const map = [];
    for (let y = 0; y < CONFIG.MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < CONFIG.MAP_WIDTH; x++) {
            if (x === 0 || x === CONFIG.MAP_WIDTH - 1 || y === 0 || y === CONFIG.MAP_HEIGHT - 1) row.push(1);
            else {
                const rand = Math.random();
                if (rand < 0.05) row.push(1);
                else if (rand < 0.08) row.push(7);
                else if (rand < 0.11) row.push(6);
                else if (rand < 0.13) row.push(8);
                else row.push(0);
            }
        }
        map.push(row);
    }
    for (let y = 3; y <= 5; y++) for (let x = 3; x <= 5; x++) map[y][x] = 5;
    map[42][42] = 3; map[42][43] = 3; map[43][42] = 3; map[43][43] = 3;
    for (let x = 3; x < 25; x++) map[6][x] = 2;
    for (let y = 6; y < 25; y++) map[y][24] = 2;
    map[24][24] = 4;
    for (let y = 30; y < 40; y++) for (let x = 10; x < 20; x++) if (Math.random() < 0.7) map[y][x] = 10;
    map[15][30] = 12; map[15][31] = 12; map[16][30] = 12; map[16][31] = 12;
    return map;
}

const LEVEL_MAP = { width: CONFIG.MAP_WIDTH, height: CONFIG.MAP_HEIGHT, tiles: generateMap() };
const EXIT_POS = { x: 24, y: 24 };

// ==================== 游戏实体 ====================
const ITEMS = [
    { id: 'f1', name: '光芒碎片', x: 8, y: 8, collected: false, emoji: '💎', type: 'fragment' },
    { id: 'f2', name: '光芒碎片', x: 14, y: 34, collected: false, emoji: '💎', type: 'fragment' },
    { id: 'f3', name: '光芒碎片', x: 35, y: 35, collected: false, emoji: '💎', type: 'fragment' },
    { id: 'm1', name: '蘑菇', x: 12, y: 32, collected: false, emoji: '🍄', forPuzzle: 1 },
    { id: 'm2', name: '蘑菇', x: 16, y: 35, collected: false, emoji: '🍄', forPuzzle: 1 },
    { id: 'm3', name: '蘑菇', x: 18, y: 33, collected: false, emoji: '🍄', forPuzzle: 1 }
];

const NPCS = [
    { id: 'elder', name: '森林老人', x: 6, y: 3, emoji: '👴', met: false, dialogues: ['年轻人，欢迎来到神秘森林...', '收集三块光芒碎片才能离开...', '祝你好运！'] },
    { id: 'spirit', name: '树精', x: 32, y: 20, emoji: '🌳', met: false, dialogues: ['我是森林守护者...', '推动石头到我面前...', '给你奖励！'] }
];

const PUZZLES = {
    1: { solved: false, onSolve: () => { for (let y = 30; y < 40; y++) for (let x = 10; x < 20; x++) if (LEVEL_MAP.tiles[y][x] === 10) LEVEL_MAP.tiles[y][x] = 0; showTip('✨ 迷雾散开！'); gameState.puzzlesSolved++; }},
    2: { solved: false, input: '', correctCode: '7359', onSolve: () => { LEVEL_MAP.tiles[15][30] = 0; LEVEL_MAP.tiles[15][31] = 0; LEVEL_MAP.tiles[16][30] = 0; LEVEL_MAP.tiles[16][31] = 0; showTip('🔓 藤蔓开！'); gameState.puzzlesSolved++; }},
    3: { solved: false, stones: [{x:28,y:18}, {x:30,y:22}, {x:26,y:24}], onSolve: () => { gameState.inventory.push({id:'key',name:'钥匙',emoji:'🔑'}); gameState.keys++; showTip('🌳 得钥匙！'); gameState.puzzlesSolved++; }}
};

const PUSHABLES = [{x:28,y:18}, {x:30,y:22}, {x:26,y:24}];
const PLAYER_START = { x: 10, y: 40 };

let gameState = {
    playerX: PLAYER_START.x, playerY: PLAYER_START.y, playerDir: 'down', playerState: 'idle',
    inventory: [], fragmentsCollected: 0, mushroomsCollected: 0, keys: 0, puzzlesSolved: 0,
    gameComplete: false, currentDialogue: null, dialogueIndex: 0,
    nearInteractable: null, nearPuzzle: null, nearPushable: null, debugMode: false, inputMode: null, questAccepted: false
};

let camera = { x: 0, y: 0 };

function updateCamera() {
    let tx = gameState.playerX * CONFIG.TILE_SIZE - (CONFIG.VIEW_WIDTH * CONFIG.TILE_SIZE) / 2;
    let ty = gameState.playerY * CONFIG.TILE_SIZE - (CONFIG.VIEW_HEIGHT * CONFIG.TILE_SIZE) / 2;
    const maxX = CONFIG.MAP_WIDTH * CONFIG.TILE_SIZE - CONFIG.VIEW_WIDTH * CONFIG.TILE_SIZE;
    const maxY = CONFIG.MAP_HEIGHT * CONFIG.TILE_SIZE - CONFIG.VIEW_HEIGHT * CONFIG.TILE_SIZE;
    tx = Math.max(0, Math.min(tx, maxX)); ty = Math.max(0, Math.min(ty, maxY));
    camera.x += (tx - camera.x) * CONFIG.CAMERA_LERP;
    camera.y += (ty - camera.y) * CONFIG.CAMERA_LERP;
}

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function initCanvas() {
    const c = document.getElementById('game-container');
    const maxW = Math.min(c.clientWidth, 500), maxH = Math.min(c.clientHeight, 900);
    canvas.width = CONFIG.VIEW_WIDTH * CONFIG.TILE_SIZE;
    canvas.height = CONFIG.VIEW_HEIGHT * CONFIG.TILE_SIZE;
    const scale = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
    canvas.style.width = (canvas.width * scale) + 'px';
    canvas.style.height = (canvas.height * scale) + 'px';
}
window.addEventListener('resize', initCanvas);
initCanvas();

let lastTime = 0, moveTimer = 0;

function gameLoop(timestamp) {
    const dt = timestamp - lastTime; lastTime = timestamp;
    if (!gameState.gameComplete) update(dt);
    updateCamera(); render();
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (currentDirection) { moveTimer += dt; if (moveTimer >= CONFIG.MOVE_INTERVAL) { movePlayer(currentDirection); gameState.playerState = 'walking'; moveTimer = 0; } }
    else gameState.playerState = 'idle';
    checkCollisions(); checkNearInteractables();
}

function render() {
    const ts = CONFIG.TILE_SIZE, camX = Math.floor(camera.x), camY = Math.floor(camera.y);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const startCol = Math.floor(camX / ts), endCol = Math.min(startCol + CONFIG.VIEW_WIDTH + 1, CONFIG.MAP_WIDTH);
    const startRow = Math.floor(camY / ts), endRow = Math.min(startRow + CONFIG.VIEW_HEIGHT + 1, CONFIG.MAP_HEIGHT);
    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            const tile = LEVEL_MAP.tiles[y][x], s = TILE_TYPES[tile] || TILE_TYPES[0];
            const px = x * ts - camX, py = y * ts - camY;
            ctx.fillStyle = s.color; ctx.fillRect(px, py, ts, ts);
            if (s.alpha) { ctx.fillStyle = `rgba(144,164,174,${s.alpha})`; ctx.fillRect(px,py,ts,ts); }
            if (tile === 4) { const g = Math.sin(Date.now()/250)*0.3+0.7; ctx.fillStyle = `rgba(255,215,0,${g*0.4})`; ctx.fillRect(px+2,py+2,ts-4,ts-4); }
            ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.strokeRect(px,py,ts,ts);
        }
    }
    PUSHABLES.forEach(p => { const px = p.x*ts-camX+ts/2, py = p.y*ts-camY+ts/2; ctx.font='22px Arial'; ctx.textAlign='center'; ctx.fillText('🪨',px,py); });
    const kp = {x:30,y:15}; ctx.font='20px'; ctx.fillText('🔢',kp.x*ts-camX+ts/2,kp.y*ts-camY+ts/2);
    ITEMS.forEach(item => { if(!item.collected) { const px=item.x*ts-camX+ts/2, py=item.y*ts-camY+ts/2; ctx.fillStyle=`rgba(255,215,0,${Math.sin(Date.now()/200)*0.3+0.5})`; ctx.beginPath(); ctx.arc(px,py,ts*0.5,0,Math.PI*2); ctx.fill(); ctx.font='18px'; ctx.fillText(item.emoji,px,py); }});
    NPCS.forEach(n => { if(!n.met) { const px=n.x*ts-camX+ts/2, py=n.y*ts-camY+ts/2; ctx.fillStyle='rgba(255,215,0,0.3)'; ctx.beginPath(); ctx.arc(px,py,ts*0.6,0,Math.PI*2); ctx.fill(); ctx.font='22px'; ctx.fillText(n.emoji,px,py); }});
    drawPlayer(camX, camY);
    if (gameState.nearInteractable || gameState.nearPuzzle || gameState.nearPushable) drawInteractPrompt();
    if (gameState.inputMode === 'keypad') drawKeypad();
    if (gameState.debugMode) { ctx.fillStyle='rgba(255,0,0,0.8)'; ctx.font='12px'; ctx.fillText('🔧 DEBUG',10,20); }
    if (gameState.questAccepted) { ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(10,canvas.height-40,120,30); ctx.fillStyle='#ffd700'; ctx.font='14px'; ctx.fillText(`任务: ${gameState.fragmentsCollected}/3`,20,canvas.height-20); }
}

function drawPlayer(camX, camY) {
    const ts = CONFIG.TILE_SIZE, pw = CONFIG.PLAYER_WIDTH*ts, ph = CONFIG.PLAYER_HEIGHT*ts;
    const px = gameState.playerX*ts-camX, py = gameState.playerY*ts-camY;
    const bob = gameState.playerState==='walking'?Math.sin(Date.now()/100)*2:0;
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(px+pw/2,py+ph-4,pw*0.4,5,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#7b1fa2'; ctx.fillRect(px+ts*0.2,py+ts*1.2+bob,pw-ts*0.4,ph-ts*1.4);
    ctx.fillStyle='#ffcc80'; ctx.beginPath(); ctx.arc(px+pw/2,py+ts*0.8+bob,ts*0.7,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#333'; const eo = gameState.playerDir==='left'? -3:(gameState.playerDir==='right'?3:0);
    ctx.beginPath(); ctx.arc(px+pw/2-ts*0.2+eo,py+ts*0.7+bob,ts*0.12,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+pw/2+ts*0.2+eo,py+ts*0.7+bob,ts*0.12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#6a1b9a'; ctx.beginPath(); ctx.moveTo(px+pw*0.1,py+ts*0.5+bob); ctx.lineTo(px+pw/2,py-ts*0.3+bob); ctx.lineTo(px+pw*0.9,py+ts*0.5+bob); ctx.fill();
}

function drawInteractPrompt() {
    let t = gameState.nearInteractable || gameState.nearPuzzle || gameState.nearPushable;
    if(!t) return; const ts=CONFIG.TILE_SIZE, px=t.x*ts-camera.x+ts/2, py=t.y*ts-camera.y-20;
    ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(px-40,py-12,80,24); ctx.fillStyle='#fff'; ctx.font='12px'; ctx.textAlign='center'; ctx.fillText('按空格',px,py+4);
}

function drawKeypad() {
    const w=canvas.width, h=canvas.height;
    ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(w/2-100,h/2-80,200,160);
    ctx.fillStyle='#ffd700'; ctx.font='24px'; ctx.textAlign='center'; ctx.fillText('密码',w/2,h/2-50);
    ctx.fillStyle='#fff'; ctx.font='32px'; ctx.fillText(PUZZLES[2].input||'____',w/2,h/2-10);
    ctx.font='14px'; ctx.fillStyle='#888'; ctx.fillText('1-9空格确认,ESC取消',w/2,h/2+60);
}

let currentDirection = null;
function setupJoystick() {
    const area = document.getElementById('joystick-area'), knob = document.getElementById('joystick-knob');
    area.addEventListener('touchstart', e => { e.preventDefault(); joystickActive=true; handleJoystick(e.touches[0]); }, {passive:false});
    document.addEventListener('touchmove', e => { if(joystickActive&&e.touches.length>0){e.preventDefault();handleJoystick(e.touches[0]);}}, {passive:false});
    document.addEventListener('touchend', () => { joystickActive=false; currentDirection=null; knob.style.transform='translate(-50%,-50%)'; });
}
function handleJoystick(t) {
    const r=document.getElementById('joystick-area').getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    let dx=t.clientX-cx, dy=t.clientY-cy, d=Math.sqrt(dx*dx+dy*dy), m=35;
    if(d>m){dx=dx/d*m;dy=dy/d*m;}
    document.getElementById('joystick-knob').style.transform=`translate(calc(-50%+${dx}px),calc(-50%+${dy}px))`;
    if(Math.abs(dx)>Math.abs(dy)){currentDirection=dx>8?'right':(dx<-8?'left':null);if(currentDirection)gameState.playerDir=currentDirection;}
    else{currentDirection=dy>8?'down':(dy<-8?'up':null);if(currentDirection)gameState.playerDir=currentDirection;}
}

function setupKeyboard() {
    document.addEventListener('keydown', e => {
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
        if(gameState.inputMode==='keypad'){
            if(e.key>='1'&&e.key<='9')PUZZLES[2].input=(PUZZLES[2].input+e.key).slice(0,4);
            else if(e.key==='Backspace')PUZZLES[2].input=PUZZLES[2].input.slice(0,-1);
            else if(e.key===' '){if(PUZZLES[2].input===PUZZLES[2].correctCode){PUZZLES[2].solved=true;PUZZLES[2].onSolve();}else showTip('❌');gameState.inputMode=null;PUZZLES[2].input='';}
            else if(e.key==='Escape'){gameState.inputMode=null;PUZZLES[2].input='';} return;
        }
        if(e.key==='x'||e.key==='X'){gameState.debugMode=!gameState.debugMode;showTip(gameState.debugMode?'🔧开':'🔧关');return;}
        if(gameState.currentDialogue){handleDialogueClick();return;}
        if(e.key===' '||e.key==='Enter'){doInteraction();return;}
        switch(e.key){case 'ArrowUp':case 'w':case 'W':currentDirection='up';gameState.playerDir='up';break;case 'ArrowDown':case 's':case 'S':currentDirection='down';gameState.playerDir='down';break;case 'ArrowLeft':case 'a':case 'A':currentDirection='left';gameState.playerDir='left';break;case 'ArrowRight':case 'd':case 'D':if(!gameState.debugMode){currentDirection='right';gameState.playerDir='right';}break;}
    });
    document.addEventListener('keyup', e => { if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key))currentDirection=null; });
}

function movePlayer(dir) {
    let nx=gameState.playerX, ny=gameState.playerY;
    if(dir==='up')ny--; else if(dir==='down')ny++; else if(dir==='left')nx--; else if(dir==='right')nx++;
    if(nx<0||nx>=CONFIG.MAP_WIDTH||ny<0||ny>=CONFIG.MAP_HEIGHT)return;
    if(checkPushable(nx,ny))return;
    if(gameState.debugMode||canMoveTo(nx,ny)){gameState.playerX=nx;gameState.playerY=ny;}
}
function canMoveTo(x,y){
    for(let dy=0;dy<CONFIG.PLAYER_HEIGHT;dy++)for(let dx=0;dx<CONFIG.PLAYER_WIDTH;dx++){
        let tx=x+dx, ty=y+dy;
        if(tx>=0&&tx<CONFIG.MAP_WIDTH&&ty>=0&&ty<CONFIG.MAP_HEIGHT){
            if(!PASSABLE_TILES.includes(LEVEL_MAP.tiles[ty][tx]))return false;
        }
    }
    return true;
}
function checkPushable(nx,ny){
    for(let p of PUSHABLES){
        for(let dy=0;dy<CONFIG.PLAYER_HEIGHT;dy++)for(let dx=0;dx<CONFIG.PLAYER_WIDTH;dx++){
            if(nx+dx===p.x&&ny+dy===p.y){
                let nx2=p.x, ny2=p.y;
                if(currentDirection==='up')ny2--;else if(currentDirection==='down')ny2++;else if(currentDirection==='left')nx2--;else if(currentDirection==='right')nx2++;
                if(canMoveTo(nx2,ny2)){p.x=nx2;p.y=ny2;showTip('🪨');checkPuzzle3();return true;}
            }
        }
    }
    return false;
}

function checkNearInteractables(){
    const pcx=gameState.playerX+CONFIG.PLAYER_WIDTH/2, pcy=gameState.playerY+CONFIG.PLAYER_HEIGHT/2;
    gameState.nearInteractable=null;gameState.nearPuzzle=null;gameState.nearPushable=null;
    // 优化距离计算，使用更简洁的写法
    NPCS.forEach(n=>{if(!n.met && Math.hypot(pcx-(n.x+0.5),pcy-(n.y+0.5))<=2){gameState.nearInteractable={type:'npc',target:n};}});
    PUSHABLES.forEach(p=>{if(Math.hypot(pcx-p.x,pcy-p.y)<=2){gameState.nearPushable={type:'push',target:p};}});
    if(Math.hypot(pcx-30,pcy-15)<=2){gameState.nearPuzzle={type:'keypad'};}
}

function doInteraction(){
    if(gameState.nearInteractable){
        const npc = gameState.nearInteractable.target;
        if(!gameState.questAccepted && npc.id==='elder'){gameState.questAccepted=true;showTip('📜 任务:收集碎片');}
        npc.met=true; startDialogue({emoji:npc.emoji,name:npc.name,dialogue:npc.dialogues});
    }else if(gameState.nearPuzzle){gameState.inputMode='keypad';}
}

function checkCollisions(){
    for(let dy=0;dy<CONFIG.PLAYER_HEIGHT;dy++)for(let dx=0;dx<CONFIG.PLAYER_WIDTH;dx++){
        ITEMS.forEach(item=>{if(!item.collected&&gameState.playerX+dx===item.x&&gameState.playerY+dy===item.y){collectItem(item);}});
        if(gameState.playerX+dx===EXIT_POS.x&&gameState.playerY+dy===EXIT_POS.y){
            if(gameState.fragmentsCollected>=3&&gameState.puzzlesSolved>=3){showVictory();}else{showTip('需3碎片+3谜题');gameState.playerY++;}
            return;
        }
    }
}

function collectItem(item){
    item.collected=true;gameState.inventory.push(item);
    if(item.forPuzzle===1){gameState.mushroomsCollected++;showTip('🍄');if(!PUZZLES[1].solved&&gameState.mushroomsCollected>=3){PUZZLES[1].solved=true;PUZZLES[1].onSolve();}}
    else if(item.type==='fragment'){gameState.fragmentsCollected++;showTip('💎碎片'+gameState.fragmentsCollected+'/3');if(gameState.fragmentsCollected>=3)setTimeout(()=>showTip('✨ 去找出口!'),1500);}
    updateHUD();
}

function checkPuzzle3(){
    if(PUZZLES[3].solved)return;
    const s=NPCS.find(n=>n.id==='spirit');
    let c=0;PUSHABLES.forEach(p=>{if(Math.hypot(p.x-s.x,p.y-(s.y+1))<=3){c++;}});
    if(c>=3){PUZZLES[3].solved=true;PUZZLES[3].onSolve();}
}

function startDialogue(npc){gameState.currentDialogue=npc;gameState.dialogueIndex=0;gameState.typewriterIndex=0;gameState.typewriterText='';showDialogue(npc);}
function showDialogue(npc){
    document.getElementById('dialogue-box').style.display='block';
    document.getElementById('npcAvatar').textContent=npc.emoji;
    document.getElementById('npcName').textContent=npc.name;
    gameState.typewriterText=npc.dialogue[gameState.dialogueIndex];
    gameState.typewriterIndex=0;
    document.getElementById('dialogueText').textContent='';
    typewriterEffect();
    document.getElementById('dialogue-box').onclick=handleDialogueClick;
}
function typewriterEffect(){
    if(gameState.typewriterIndex < gameState.typewriterText.length){
        document.getElementById('dialogueText').textContent += gameState.typewriterText[gameState.typewriterIndex];
        gameState.typewriterIndex++;
        setTimeout(typewriterEffect, 30);
    }
}
function handleDialogueClick(){
    // 点击跳过打字机效果
    if(gameState.typewriterIndex < gameState.typewriterText.length){
        document.getElementById('dialogueText').textContent = gameState.typewriterText;
        gameState.typewriterIndex = gameState.typewriterText.length;
        return;
    }
    gameState.dialogueIndex++;
    if(gameState.dialogueIndex>=gameState.currentDialogue.dialogue.length){
        document.getElementById('dialogue-box').style.display='none';
        gameState.currentDialogue=null;
    }else{
        gameState.typewriterText=gameState.currentDialogue.dialogue[gameState.dialogueIndex];
        gameState.typewriterIndex=0;
        document.getElementById('dialogueText').textContent='';
        typewriterEffect();
    }
}

function showVictory(){
    gameState.gameComplete=true;
    const screen=document.getElementById('victory-screen');
    screen.innerHTML=`<div class="trophy">🏆</div><h1>🎉 通关成功!</h1><p>${LEVEL_CONFIG.name}已完成</p><div class="stats"><div class="stat"><div class="stat-value">${gameState.fragmentsCollected}</div><div class="stat-label">收集碎片</div></div><div class="stat"><div class="stat-value">${gameState.puzzlesSolved}</div><div class="stat-label">解开谜题</div></div></div><p>获得称号: ${LEVEL_CONFIG.rewards[1].value}</p><button onclick="restartGame()">再玩一次</button>`;
    screen.classList.add('show');
}

function showTip(msg){const t=document.getElementById('tip');t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',2500);}
function updateHUD(){
    const countEl = document.getElementById('fragmentCount');
    const oldVal = parseInt(countEl.textContent);
    countEl.textContent = gameState.fragmentsCollected;
    // 收集动画
    if (gameState.fragmentsCollected > oldVal) {
        countEl.classList.add('bump');
        setTimeout(() => countEl.classList.remove('bump'), 300);
    }
}
function showInventory(){const m=document.getElementById('inventory-modal');document.querySelectorAll('.inv-slot').forEach((s,i)=>{s.classList.remove('has-item');s.textContent='';gameState.inventory.forEach((it,j)=>{if(j<6){s.classList.add('has-item');s.textContent=it.emoji;}});});m.classList.add('show');}
function hideInventory(){document.getElementById('inventory-modal').classList.remove('show');}
function exitGame(){window.location.href='index.html';}
function restartGame(){
    gameState={playerX:PLAYER_START.x,playerY:PLAYER_START.y,playerDir:'down',playerState:'idle',inventory:[],fragmentsCollected:0,mushroomsCollected:0,keys:0,puzzlesSolved:0,gameComplete:false,currentDialogue:null,dialogueIndex:0,nearInteractable:null,nearPuzzle:null,nearPushable:null,debugMode:false,inputMode:null,questAccepted:false};
    ITEMS.forEach(i=>i.collected=false);NPCS.forEach(n=>n.met=false);
    PUZZLES[1].solved=false;PUZZLES[2].solved=false;PUZZLES[2].input='';PUZZLES[3].solved=false;
    PUSHABLES[0].x=28;PUSHABLES[0].y=18;PUSHABLES[1].x=30;PUSHABLES[1].y=22;PUSHABLES[2].x=26;PUSHABLES[2].y=24;
    LEVEL_MAP.tiles=generateMap();updateHUD();document.getElementById('victory-screen').classList.remove('show');
}

function init(){
    document.getElementById('playerName').textContent=localStorage.getItem('adventure_player_name')||'冒险家';
    setupJoystick();setupKeyboard();updateHUD();requestAnimationFrame(gameLoop);
    console.log('🎮 T2.5 关卡系统');
}
init();
