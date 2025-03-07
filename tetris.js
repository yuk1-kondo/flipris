// テトリスのゲームロジックと描画処理

// キャンバスと描画コンテキストを取得
const board = document.getElementById('board');
const nextCanvas = document.getElementById('nextCanvas');
const holdCanvas = document.getElementById('holdCanvas');
const ctx = board.getContext('2d');
const nextCtx = nextCanvas.getContext('2d');
const holdCtx = holdCanvas.getContext('2d');

// UI要素の参照を取得
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameoverScreen = document.getElementById('gameover-screen');

// 仮想ボタンの参照を取得
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const downBtn = document.getElementById('down-btn');
const rotateBtn = document.getElementById('rotate-btn');
const dropBtn = document.getElementById('drop-btn');
const holdBtn = document.getElementById('hold-btn');

// ゲームの定数
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = board.width / COLS;
const MAX_LEVEL = 99;

// ゲームの変数
let grid = createGrid();
let score = 0;
let lines = 0;
let level = 1;
let gameSpeed = 1000; // 初期の落下速度（ミリ秒）
let gameOver = false;
let gamePaused = false;
let gameStarted = false;
let dropCounter = 0;
let lastTime = 0;
let holdPiece = null;
let canHold = true;

// テトリミノの色
const COLORS = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF'  // Z
];

// テトリミノの形状
const TETROMINOS = [
    null,
    // I
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O
    [
        [4, 4],
        [4, 4]
    ],
    // S
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// プレイヤー（現在操作中のテトリミノ）
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    next: getRandomTetromino()
};

// グリッドの作成
function createGrid() {
    let grid = [];
    for (let y = 0; y < ROWS; y++) {
        grid.push(new Array(COLS).fill(0));
    }
    return grid;
}

// テトリミノのランダム選択
function getRandomTetromino() {
    const tetrominos = 'IJLOSTZ';
    const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
    
    switch (randTetromino) {
        case 'I': return { matrix: TETROMINOS[1], color: 1 };
        case 'J': return { matrix: TETROMINOS[2], color: 2 };
        case 'L': return { matrix: TETROMINOS[3], color: 3 };
        case 'O': return { matrix: TETROMINOS[4], color: 4 };
        case 'S': return { matrix: TETROMINOS[5], color: 5 };
        case 'T': return { matrix: TETROMINOS[6], color: 6 };
        case 'Z': return { matrix: TETROMINOS[7], color: 7 };
    }
}

// 次のテトリミノを取得
function getNextPiece() {
    const piece = player.next;
    player.matrix = piece.matrix;
    player.color = piece.color;
    player.next = getRandomTetromino();
    
    // 初期位置の設定（常に上部からスタート）
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix[0].length / 2);
    
    // ゲームオーバーのチェック
    if (collision()) {
        gameOver = true;
        showGameOverScreen();
    }
}

// 衝突判定
function collision() {
    const matrix = player.matrix;
    const pos = player.pos;
    
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0 &&
                (grid[y + pos.y] === undefined ||
                 grid[y + pos.y][x + pos.x] === undefined ||
                 grid[y + pos.y][x + pos.x] !== 0)) {
                return true;
            }
        }
    }
    return false;
}

// テトリミノを固定
function merge() {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                grid[y + player.pos.y][x + player.pos.x] = player.color;
            }
        });
    });
}

// テトリミノを回転
function rotate() {
    const matrix = player.matrix;
    const n = matrix.length;
    
    // 回転後の行列を作成
    const rotated = Array(n).fill().map(() => Array(n).fill(0));
    
    // 90度時計回りに回転
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            rotated[x][n - 1 - y] = matrix[y][x];
        }
    }
    
    // 回転後の行列に更新
    player.matrix = rotated;
    
    // 回転後に衝突した場合は、位置調整を試みる
    if (collision()) {
        // 左側へのオフセットを試す
        player.pos.x--;
        if (collision()) {
            // 右側へのオフセットを試す
            player.pos.x += 2;
            if (collision()) {
                // それでも衝突する場合は元に戻す
                player.pos.x--;
                player.matrix = matrix;
            }
        }
    }
}

// テトリミノを移動
function move(dir) {
    player.pos.x += dir;
    if (collision()) {
        player.pos.x -= dir;
    }
}

// テトリミノを下に移動
function drop() {
    player.pos.y++;
    if (collision()) {
        player.pos.y--;
        merge();
        clearLines();
        getNextPiece();
        canHold = true;
    }
    dropCounter = 0;
}

// ハードドロップ
function hardDrop() {
    while (!collision()) {
        player.pos.y++;
    }
    player.pos.y--;
    merge();
    clearLines();
    getNextPiece();
    canHold = true;
    dropCounter = 0;
}

// ラインの消去
function clearLines() {
    let linesCleared = 0;
    
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] === 0) {
                continue outer;
            }
        }
        
        // ラインが揃った場合
        const row = grid.splice(y, 1)[0].fill(0);
        grid.unshift(row);
        y++;
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        // スコア計算
        const linePoints = [40, 100, 300, 1200]; // シングル、ダブル、トリプル、テトリス
        score += linePoints[linesCleared - 1] * level;
        lines += linesCleared;
        
        // レベルアップ
        const newLevel = Math.min(Math.floor(lines / 10) + 1, MAX_LEVEL);
        if (newLevel > level) {
            level = newLevel;
            // スピード調整: 各レベルでゲームが約8%速くなる
            gameSpeed = Math.max(1000 * Math.pow(0.92, level - 1), 50);
        }
        
        // UI更新
        updateStats();
    }
}

// ホールド機能
function holdTetromino() {
    if (!canHold) return;
    
    if (holdPiece === null) {
        // ホールドがない場合、現在のテトリミノをホールドし、次のテトリミノを取得
        holdPiece = {
            matrix: player.matrix,
            color: player.color
        };
        getNextPiece();
    } else {
        // ホールドと現在のテトリミノを交換
        const temp = {
            matrix: player.matrix,
            color: player.color
        };
        player.matrix = holdPiece.matrix;
        player.color = holdPiece.color;
        holdPiece = temp;
        
        // 位置をリセット
        player.pos.y = 0;
        player.pos.x = Math.floor(COLS / 2) - Math.floor(player.matrix.length / 2);
    }
    
    canHold = false;
    drawHoldPiece();
}

// ホールドテトリミノの描画
function drawHoldPiece() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    
    if (holdPiece === null) return;
    
    const blockSize = holdCanvas.width / 6;
    const offsetX = (holdCanvas.width - holdPiece.matrix.length * blockSize) / 2;
    const offsetY = (holdCanvas.height - holdPiece.matrix.length * blockSize) / 2;
    
    holdPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // ブロックの描画
                holdCtx.fillStyle = COLORS[holdPiece.color];
                holdCtx.fillRect(
                    offsetX + x * blockSize,
                    offsetY + y * blockSize,
                    blockSize - 1,
                    blockSize - 1
                );
                
                // ブロックの枠線
                holdCtx.strokeStyle = '#FFF';
                holdCtx.lineWidth = 0.5;
                holdCtx.strokeRect(
                    offsetX + x * blockSize,
                    offsetY + y * blockSize,
                    blockSize - 1,
                    blockSize - 1
                );
            }
        });
    });
}

// 次のテトリミノの描画
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    const blockSize = nextCanvas.width / 6;
    const offsetX = (nextCanvas.width - player.next.matrix.length * blockSize) / 2;
    const offsetY = (nextCanvas.height - player.next.matrix.length * blockSize) / 2;
    
    player.next.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // ブロックの描画
                nextCtx.fillStyle = COLORS[player.next.color];
                nextCtx.fillRect(
                    offsetX + x * blockSize,
                    offsetY + y * blockSize,
                    blockSize - 1,
                    blockSize - 1
                );
                
                // ブロックの枠線
                nextCtx.strokeStyle = '#FFF';
                nextCtx.lineWidth = 0.5;
                nextCtx.strokeRect(
                    offsetX + x * blockSize,
                    offsetY + y * blockSize,
                    blockSize - 1,
                    blockSize - 1
                );
            }
        });
    });
}

// UI要素の更新
function updateStats() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// ゲームボードの描画
function drawBoard() {
    // ボードをクリア
    ctx.clearRect(0, 0, board.width, board.height);
    
    // 固定されたブロックの描画
    grid.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // ブロックの描画
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(
                    x * BLOCK_SIZE,
                    y * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
                
                // ブロックの枠線
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(
                    x * BLOCK_SIZE,
                    y * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        });
    });
    
    // 現在のテトリミノの描画
    if (player.matrix) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    // ブロックの描画
                    ctx.fillStyle = COLORS[player.color];
                    ctx.fillRect(
                        (x + player.pos.x) * BLOCK_SIZE,
                        (y + player.pos.y) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                    
                    // ブロックの枠線
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(
                        (x + player.pos.x) * BLOCK_SIZE,
                        (y + player.pos.y) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            });
        });
    }
    
    // 落下予測位置の描画（ゴースト）
    drawGhost();
}

// 落下予測位置（ゴースト）の描画
function drawGhost() {
    if (!player.matrix) return;
    
    // 現在の位置を保存
    const originalPos = { ...player.pos };
    
    // 底まで落とす
    while (!collision()) {
        player.pos.y++;
    }
    player.pos.y--;
    
    // ゴーストの描画
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // 透明なブロック
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(
                    (x + player.pos.x) * BLOCK_SIZE,
                    (y + player.pos.y) * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
                
                // ブロックの枠線
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(
                    (x + player.pos.x) * BLOCK_SIZE,
                    (y + player.pos.y) * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        });
    });
    
    // 元の位置に戻す
    player.pos = originalPos;
}

// ゲームループ
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    if (!gameStarted || gameOver || gamePaused) {
        requestAnimationFrame(update);
        return;
    }
    
    dropCounter += deltaTime;
    if (dropCounter > gameSpeed) {
        drop();
    }
    
    drawBoard();
    drawNextPiece();
    drawHoldPiece();
    
    requestAnimationFrame(update);
}

// キーボード入力の処理（PC向け）
document.addEventListener('keydown', event => {
    if (!gameStarted || gameOver || gamePaused) return;
    
    switch (event.code) {
        case 'ArrowLeft':
            move(-1);
            break;
        case 'ArrowRight':
            move(1);
            break;
        case 'ArrowDown':
            drop();
            break;
        case 'ArrowUp':
            rotate();
            break;
        case 'Space':
            hardDrop();
            break;
        case 'ShiftLeft':
        case 'ShiftRight':
            holdTetromino();
            break;
    }
});

// ゲームの一時停止
document.addEventListener('keydown', event => {
    if (event.code === 'KeyP' && gameStarted && !gameOver) {
        togglePause();
    }
});

// 一時停止の切り替え
function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseScreen.style.display = 'flex';
    } else {
        pauseScreen.style.display = 'none';
    }
}

// モバイルコントロールの設定（仮想ボタン）
function setupMobileControls() {
    // 左移動
    leftBtn.addEventListener('touchstart', event => {
        event.preventDefault();
        if (!gameStarted || gameOver || gamePaused) return;
        move(-1);
    });
    
    // 右移動
    rightBtn.addEventListener('touchstart', event => {
        event.preventDefault();
        if (!gameStarted || gameOver || gamePaused) return;
        move(1);
    });
    
    // 下移動
    downBtn.addEventListener('touchstart', event => {
        event.preventDefault();
        if (!gameStarted || gameOver || gamePaused) return;
        drop();
    });
    
    // 回転
    rotateBtn.addEventListener('touchstart', event => {
        event.preventDefault();
        if (!gameStarted || gameOver || gamePaused) return;
        rotate();
    });
    
    // ハードドロップ
    dropBtn.addEventListener('touchstart', event => {
        event.preventDefault();
        if (!gameStarted || gameOver || gamePaused) return;
        hardDrop();
    });
    
    // ホールド
    holdBtn.addEventListener('touchstart', event => {
        event.preventDefault();
        if (!gameStarted || gameOver || gamePaused) return;
        holdTetromino();
    });
    
    // マウス操作（PC用）
    leftBtn.addEventListener('click', () => {
        if (!gameStarted || gameOver || gamePaused) return;
        move(-1);
    });
    
    rightBtn.addEventListener('click', () => {
        if (!gameStarted || gameOver || gamePaused) return;
        move(1);
    });
    
    downBtn.addEventListener('click', () => {
        if (!gameStarted || gameOver || gamePaused) return;
        drop();
    });
    
    rotateBtn.addEventListener('click', () => {
        if (!gameStarted || gameOver || gamePaused) return;
        rotate();
    });
    
    dropBtn.addEventListener('click', () => {
        if (!gameStarted || gameOver || gamePaused) return;
        hardDrop();
    });
    
    holdBtn.addEventListener('click', () => {
        if (!gameStarted || gameOver || gamePaused) return;
        holdTetromino();
    });
}

// ゲームスタート画面表示
function showStartScreen() {
    startScreen.style.display = 'flex';
    pauseScreen.style.display = 'none';
    gameoverScreen.style.display = 'none';
}

// ゲームオーバー画面表示
function showGameOverScreen() {
    finalScoreElement.textContent = score;
    gameoverScreen.style.display = 'flex';
}

// ゲームリセット
function resetGame() {
    grid = createGrid();
    score = 0;
    lines = 0;
    level = 1;
    gameSpeed = 1000;
    gameOver = false;
    holdPiece = null;
    canHold = true;
    
    player.next = getRandomTetromino();
    getNextPiece();
    
    updateStats();
}

// スタート画面クリック時の処理
startScreen.addEventListener('click', () => {
    if (gameStarted) return;
    
    gameStarted = true;
    startScreen.style.display = 'none';
    resetGame();
    update();
});

// 一時停止画面クリック時の処理
pauseScreen.addEventListener('click', () => {
    togglePause();
});

// ゲームオーバー画面クリック時の処理
gameoverScreen.addEventListener('click', () => {
    gameoverScreen.style.display = 'none';
    resetGame();
    gameOver = false;
});

// ウィンドウがロードされた時の処理
window.addEventListener('load', () => {
    // モバイルコントロールの設定
    setupMobileControls();
    
    // スタート画面表示
    showStartScreen();
    
    // 初期描画
    drawBoard();
    drawNextPiece();
    drawHoldPiece();
});

// ----------------------------------------------------------
// タッチ操作の改善: ドラッグして左右移動、タップで回転、上下スワイプでドロップ/ホールド
// ----------------------------------------------------------
const gameArea = document.querySelector('.game-area'); 
// ドラッグ操作時の判定用変数
let dragging = false;
let startX = 0;
let startY = 0;
let lastMoveTime = 0;
let lastMoveDirection = 0;
let tapTimeout = null;
let doubleTapPrevented = false;

const dragThreshold = 20;     // タップと判定する移動許容距離(px)
const swipeThreshold = 50;    // 上下スワイプと判定する移動距離(px)
const moveDelay = 150;        // 左右連続移動のディレイ(ms)
const doubleTapDelay = 300;   // ダブルタップとみなす時間(ms)

// ブラウザのズーム防止
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// ダブルタップによるズーム防止
document.addEventListener('touchend', function(e) {
    if (!doubleTapPrevented) {
        doubleTapPrevented = true;
        setTimeout(function() {
            doubleTapPrevented = false;
        }, doubleTapDelay);
    } else {
        e.preventDefault();
    }
}, { passive: false });

// ゲームエリア全体に対するタッチイベントリスナー
gameArea.addEventListener('touchstart', handleTouchStart, { passive: false });
gameArea.addEventListener('touchmove', handleTouchMove, { passive: false });
gameArea.addEventListener('touchend', handleTouchEnd, { passive: false });

// タッチ開始時の処理
function handleTouchStart(e) {
    e.preventDefault();
    if (!gameStarted || gameOver || gamePaused) return;

    dragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    lastMoveTime = performance.now();
    lastMoveDirection = 0;
    
    // ダブルタップを防止するためタップタイムアウトをクリア
    clearTimeout(tapTimeout);
}

// タッチ移動時の処理
function handleTouchMove(e) {
    if (!dragging) return;
    e.preventDefault();
    if (!gameStarted || gameOver || gamePaused) return;

    const now = performance.now();
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    // 横方向の移動が縦より大きい場合のみ左右移動を処理
    if (Math.abs(deltaX) > dragThreshold && Math.abs(deltaX) > Math.abs(deltaY) && (now - lastMoveTime) > moveDelay) {
        const moveDirection = deltaX > 0 ? 1 : -1;
        
        // 同じ方向に移動していない場合はすぐに移動
        if (moveDirection !== lastMoveDirection) {
            move(moveDirection);
            lastMoveDirection = moveDirection;
            lastMoveTime = now;
        } else {
            // 同じ方向への連続移動の場合
            move(moveDirection);
            lastMoveTime = now;
        }
        
        // ドラッグの起点を更新（大きく移動させる）
        startX = currentX;
    }
}

// タッチ終了時の処理
function handleTouchEnd(e) {
    e.preventDefault();
    if (!dragging || !gameStarted || gameOver || gamePaused) {
        dragging = false;
        return;
    }
    
    // 最後のタッチポイントを取得
    const currentX = e.changedTouches[0].clientX;
    const currentY = e.changedTouches[0].clientY;
    
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    // 移動距離が少ない場合はタップとみなす
    if (Math.abs(deltaX) < dragThreshold && Math.abs(deltaY) < dragThreshold) {
        // タップ → 回転
        rotate();
        
        // ダブルタップ防止（次のタップまで短時間無視）
        tapTimeout = setTimeout(() => {
            tapTimeout = null;
        }, 100);
    } 
    // 垂直方向の移動が大きい場合はスワイプ判定
    else if (Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0) {
            // 下スワイプ → ハードドロップ
            hardDrop();
        } else {
            // 上スワイプ → ホールド
            holdTetromino();
        }
    }
    
    dragging = false;
}

// リサイズ時にviewportをリセット（ズーム対策）
function resetViewport() {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    } else {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.getElementsByTagName('head')[0].appendChild(meta);
    }
}

// ウィンドウサイズ変更時にviewportをリセット
window.addEventListener('resize', resetViewport);

// 初期化時にviewportを設定
window.addEventListener('load', () => {
    resetViewport();
    // 既存の初期化コードは残す
    setupMobileControls();
    showStartScreen();
    drawBoard();
    drawNextPiece();
    drawHoldPiece();
});
