    // ==================== グローバル変数 ====================
let currentDesigns = [];
let currentDetailDesign = null;

// デバッグログ機能
const debugLogs = [];
function addDebugLog(msg) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${msg}`;
    debugLogs.push(logEntry);
    if (debugLogs.length > 20) debugLogs.shift(); // 最新20件のみ保持
    
    const debugLog = document.getElementById('debugLog');
    if (debugLog) {
        debugLog.textContent = debugLogs.join('\n');
    }
    console.log(logEntry);
}

// API ベース URL
// 優先順位: localStorageの上書き → Render同一オリジン → 固定のクラウドURL
const API_BASE_URL = (() => {
    try {
        const stored = localStorage.getItem('apiBaseUrl');
        if (stored && stored.trim()) return stored.trim();
    } catch (_) {}

    // Render上でフロントを開いた場合は同一オリジンを使用
    if (window.location.hostname.endsWith('onrender.com')) {
        return `${window.location.protocol}//${window.location.host}`;
    }

    // クラウドのバックエンド（Render）
    return 'https://sotsugyouseisaku-backend.onrender.com';
})();
addDebugLog(`📡 API: ${API_BASE_URL}`);

// 学生情報の初期化
function initializeStudent() {
    // URLパラメータをチェック
    const params = new URLSearchParams(window.location.search);
    const studentIdFromURL = params.get('student_id');
    const studentNameFromURL = params.get('name');
    
    // URLパラメータがあれば使用、なければlocalStorageをチェック
    let studentId = studentIdFromURL || localStorage.getItem('studentId');
    let studentName = studentNameFromURL || localStorage.getItem('studentName');
    
    // 学生IDがなければ新規生成
    if (!studentId) {
        studentId = 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        addDebugLog(`📝 新規ID生成: ${studentId}`);
    }
    
    // localStorageに保存（学生IDはここで確定）
    localStorage.setItem('studentId', studentId);
    
    // 学生名がなければモーダルで入力
    if (!studentName) {
        addDebugLog('📋 名前入力モーダルを表示');
        showNameInputModal(studentId);
        return false; // アプリ初期化をスキップ
    }
    
    // 学生名をlocalStorageに保存
    localStorage.setItem('studentName', studentName);
    addDebugLog(`✅ 設定完了: ${studentName}`);
    return true; // アプリ初期化を続行
}

// 名前入力モーダル
function showNameInputModal(studentId) {
    const modal = document.getElementById('classSetupModal');
    const studentNameInput = document.getElementById('studentNameInput');
    const classIdGroup = document.getElementById('classIdGroup');
    const saveBtn = document.getElementById('saveStudentNameBtn');
    
    // classIdGroupを非表示
    if (classIdGroup) {
        classIdGroup.style.display = 'none';
    }
    
    // studentNameInputをクリア
    if (studentNameInput) {
        studentNameInput.value = '';
        studentNameInput.placeholder = '例：山田太郎';
    }
    
    // モーダルを表示（flexで中央配置）
    modal.style.display = 'flex';
    
    // フォーカス
    if (studentNameInput) {
        setTimeout(() => studentNameInput.focus(), 100);
    }
    
    // saveボタンのイベント設定（既存のイベントをクリア）
    if (saveBtn) {
        // 古いイベントリスナーを削除するため、クローンして置き換え
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        newSaveBtn.addEventListener('click', () => {
            const studentName = (studentNameInput.value.trim() || '参加者');
            localStorage.setItem('studentId', studentId);
            localStorage.setItem('studentName', studentName);
            
            modal.style.display = 'none';
            console.log(`✅ 学生名保存: ${studentName} (ID: ${studentId})`);
            
            // ここでアプリを初期化
            initializeApp();
        });
    }
}

// カラースキーム定義
const colorSchemes = {
    vibrant: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B500', '#FF69B4'
    ],
    pastel: [
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
        '#E8C5E5', '#FFE5D9', '#D4F1F4', '#FFDFD3', '#C7CEEA'
    ],
    earth: [
        '#8B7355', '#A0826D', '#C9B59A', '#E6D5C3', '#B8956A',
        '#9C8367', '#D4C5B9', '#A88F76', '#C4A57B', '#8C7851'
    ],
    monochrome: [
        '#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7',
        '#ECF0F1', '#D5DBDB', '#AEB6BF', '#566573', '#17202A'
    ],
    warm: [
        '#FF6B6B', '#FFA07A', '#FFB84D', '#FFD93D', '#F9C74F',
        '#F94144', '#FF595E', '#FF8A5B', '#FA8072', '#E63946'
    ],
    cool: [
        '#4ECDC4', '#45B7D1', '#5DADE2', '#3498DB', '#2E86AB',
        '#6C9BD1', '#84DCC6', '#95E1D3', '#7FCDCD', '#5AB9EA'
    ]
};

// 形状の種類
const shapeTypes = ['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'star'];

// ==================== 初期化 ====================
document.addEventListener('DOMContentLoaded', () => {
    addDebugLog('🚀 ページ読み込み開始');
    
    // デバッグコントロール
    const debugToggle = document.getElementById('debugToggle');
    const debugPanel = document.getElementById('debugPanel');
    if (debugToggle && debugPanel) {
        debugToggle.addEventListener('click', () => {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    const canContinue = initializeStudent();
    if (canContinue) {
        initializeApp();
    }
});

function initializeApp() {
    // イベントリスナー設定
    setupEventListeners();
    
    // 初期デザイン生成
    generateDesigns();
    
    // お気に入りを読み込み
    loadFavorites();
}

function setupEventListeners() {
    // ナビゲーション
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });

    // コントロール
    document.getElementById('generateBtn').addEventListener('click', generateDesigns);
    document.getElementById('shapeCount').addEventListener('input', (e) => {
        document.getElementById('shapeCountValue').textContent = e.target.value;
    });

    // モーダル
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', closeModal);
    document.getElementById('downloadBtn').addEventListener('click', downloadDesign);
    document.getElementById('modalFavoriteBtn').addEventListener('click', toggleModalFavorite);

    // お気に入り
    document.getElementById('clearAllBtn').addEventListener('click', clearAllFavorites);
}

// ==================== ビュー切り替え ====================
function switchView(view) {
    // ナビゲーションボタンの状態更新
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // ビューセクションの切り替え
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    if (view === 'explore') {
        document.getElementById('exploreView').classList.add('active');
    } else if (view === 'favorites') {
        document.getElementById('favoritesView').classList.add('active');
        loadFavorites();
    }
}

// ==================== デザイン生成 ====================
function generateDesigns() {
    const gallery = document.getElementById('gallery');

    // ギャラリーをクリア
    gallery.innerHTML = '';

    // 9個のデザインを生成
    const designCount = 9;
    currentDesigns = [];
    
    const colorSchemeOptions = Object.keys(colorSchemes);
    const complexityOptions = ['simple', 'medium', 'complex'];

    for (let i = 0; i < designCount; i++) {
        // 各デザインごとに異なるランダムパラメータを決定
        const colorScheme = colorSchemeOptions[Math.floor(Math.random() * colorSchemeOptions.length)];
        const complexity = complexityOptions[Math.floor(Math.random() * complexityOptions.length)];
        const shapeCount = Math.floor(Math.random() * 8) + 1;
        
        const design = createRandomDesign(colorScheme, shapeCount, complexity);
        currentDesigns.push(design);

        const card = createDesignCard(design, i);
        gallery.appendChild(card);
    }
    
    // UIのコントロールは最後のパラメータで更新（表示用）
    const lastColorScheme = colorSchemeOptions[Math.floor(Math.random() * colorSchemeOptions.length)];
    const lastComplexity = complexityOptions[Math.floor(Math.random() * complexityOptions.length)];
    const lastShapeCount = Math.floor(Math.random() * 8) + 1;
    
    document.getElementById('colorScheme').value = lastColorScheme;
    document.getElementById('shapeCount').value = lastShapeCount;
    document.getElementById('shapeCountValue').textContent = lastShapeCount;
    document.getElementById('complexity').value = lastComplexity;
}

function createRandomDesign(colorScheme, shapeCount, complexity) {
    const colors = colorSchemes[colorScheme];
    const shapes = [];

    // 複雑度に応じてパラメータ調整
    let minSize, maxSize, rotationVariety, opacityRange;
    
    switch (complexity) {
        case 'simple':
            minSize = 20;
            maxSize = 160;
            rotationVariety = 45;
            opacityRange = [0.8, 1];
            break;
        case 'medium':
            minSize = 15;
            maxSize = 180;
            rotationVariety = 90;
            opacityRange = [0.6, 1];
            break;
        case 'complex':
            minSize = 10;
            maxSize = 200;
            rotationVariety = 180;
            opacityRange = [0.5, 1];
            break;
    }

    for (let i = 0; i < shapeCount; i++) {
        shapes.push({
            type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
            x: Math.random() * 300,
            y: Math.random() * 300,
            size: minSize + Math.random() * (maxSize - minSize),
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * rotationVariety,
            opacity: opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0])
        });
    }

    return {
        shapes,
        backgroundColor: getBackgroundColor(colorScheme),
        scheme: colorScheme,
        complexity
    };
}

function getBackgroundColor(scheme) {
    const backgrounds = {
        vibrant: '#FFFFFF',
        pastel: '#FFF9F0',
        earth: '#F5F1E8',
        monochrome: '#FAFAFA',
        warm: '#FFF5E6',
        cool: '#F0F8FF'
    };
    return backgrounds[scheme] || '#FFFFFF';
}

function createDesignCard(design, index) {
    const card = document.createElement('div');
    card.className = 'design-card';

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'design-canvas-container';

    const canvas = document.createElement('canvas');
    canvas.className = 'design-canvas';
    canvas.width = 300;
    canvas.height = 300;

    drawDesign(canvas, design);
    canvasContainer.appendChild(canvas);

    const actions = document.createElement('div');
    actions.className = 'design-card-actions';

    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'btn-icon favorite';
    favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
    favoriteBtn.onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(design, favoriteBtn);
    };

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn-icon';
    viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
    viewBtn.onclick = () => openDetailModal(design);

    actions.appendChild(favoriteBtn);
    actions.appendChild(viewBtn);

    card.appendChild(canvasContainer);
    card.appendChild(actions);

    card.onclick = () => openDetailModal(design);

    return card;
}

function drawDesign(canvas, design) {
    const ctx = canvas.getContext('2d');

    // 背景を描画
    ctx.fillStyle = design.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 形状を描画
    design.shapes.forEach(shape => {
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation * Math.PI / 180);
        ctx.globalAlpha = shape.opacity;
        ctx.fillStyle = shape.color;

        switch (shape.type) {
            case 'circle':
                drawCircle(ctx, shape.size);
                break;
            case 'square':
                drawSquare(ctx, shape.size);
                break;
            case 'triangle':
                drawTriangle(ctx, shape.size);
                break;
            case 'pentagon':
                drawPolygon(ctx, shape.size, 5);
                break;
            case 'hexagon':
                drawPolygon(ctx, shape.size, 6);
                break;
            case 'star':
                drawStar(ctx, shape.size);
                break;
        }

        ctx.restore();
    });
}

// ==================== 図形描画関数 ====================
function drawCircle(ctx, size) {
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawSquare(ctx, size) {
    ctx.fillRect(-size / 2, -size / 2, size, size);
}

function drawTriangle(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
}

function drawPolygon(ctx, size, sides) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const x = (size / 2) * Math.cos(angle);
        const y = (size / 2) * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
}

function drawStar(ctx, size) {
    const outerRadius = size / 2;
    const innerRadius = size / 4;
    const points = 5;

    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
}

// ==================== モーダル ====================
function openDetailModal(design) {
    currentDetailDesign = design;
    const modal = document.getElementById('detailModal');
    const canvas = document.getElementById('detailCanvas');
    
    canvas.width = 600;
    canvas.height = 600;
    
    // デザインをスケールして描画
    const scaledDesign = scaleDesign(design, 2);
    drawDesign(canvas, scaledDesign);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentDetailDesign = null;
}

function scaleDesign(design, scaleFactor) {
    return {
        ...design,
        shapes: design.shapes.map(shape => ({
            ...shape,
            x: shape.x * scaleFactor,
            y: shape.y * scaleFactor,
            size: shape.size * scaleFactor
        }))
    };
}

// ==================== ダウンロード ====================
function downloadDesign() {
    if (!currentDetailDesign) return;

    const canvas = document.getElementById('detailCanvas');
    const link = document.createElement('a');
    const timestamp = new Date().getTime();
    
    link.download = `design-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showNotification('デザインをダウンロードしました！');
}

// ==================== お気に入り機能 ====================
// localStorageの定数
const FAVORITES_STORAGE_KEY = 'designFavorites';
const RATINGS = ['ワクワク', 'おちつく', 'ふしぎ', 'さびしい', 'かわいい', 'かっこいい', 'やさしい', 'ドキドキ', 'さわやか', 'せつない'];

async function toggleFavorite(design, button) {
    try {
        const rating = await showRatingDialog();
        if (rating === null) return; // キャンセルされた
        
        const favorites = getFavoritesFromStorage();
        const designString = JSON.stringify(design);
        
        // すでに保存されているか確認
        const isDuplicate = favorites.some(fav => fav.design_data === designString);
        
        if (!isDuplicate) {
            const designData = {
                id: Date.now(),
                design_data: designString,
                rating: rating,
                created_at: new Date().toISOString(),
                tags: `${design.scheme},${design.complexity}`
            };
            
            favorites.push(designData);
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
            
            // サーバーに送信
            const studentId = localStorage.getItem('studentId') || 'student_' + Date.now();
            const studentName = localStorage.getItem('studentName') || '参加者';
            
            localStorage.setItem('studentId', studentId);
            localStorage.setItem('studentName', studentName);
            
            // サーバーへ同期（失敗時は通知して原因を把握しやすくする）
            try {
                const res = await fetch(`${API_BASE_URL}/api/favorites`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId,
                        studentName,
                        designData: designString,
                        rating,
                        tags: `${design.scheme},${design.complexity}`
                    })
                });

                if (!res.ok) {
                    addDebugLog(`❌ サーバー保存失敗: ${res.status}`);
                    showNotification('サーバー保存に失敗しました。電波状況を確認してください。');
                } else {
                    addDebugLog('✅ サーバー保存成功');
                }
            } catch (err) {
                addDebugLog(`❌ サーバー送信エラー: ${err.message}`);
                showNotification('サーバー送信に失敗しました。オフラインの可能性があります。');
            }
            
            button.classList.add('active');
            showNotification(`お気に入りに追加しました！(${rating})`);
        } else {
            showNotification('既に保存されています。');
        }
        
        updateFavoritesCount();

    } catch (error) {
        console.error('Error saving favorite:', error);
        showNotification('保存に失敗しました。');
    }
}

async function toggleModalFavorite() {
    if (!currentDetailDesign) return;
    
    try {
        const rating = await showRatingDialog();
        if (rating === null) return; // キャンセルされた
        
        const favorites = getFavoritesFromStorage();
        const designString = JSON.stringify(currentDetailDesign);
        
        // すでに保存されているか確認
        const isDuplicate = favorites.some(fav => fav.design_data === designString);
        
        if (!isDuplicate) {
            const designData = {
                id: Date.now(),
                design_data: designString,
                rating: rating,
                created_at: new Date().toISOString(),
                tags: `${currentDetailDesign.scheme},${currentDetailDesign.complexity}`
            };
            
            favorites.push(designData);
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
            
            showNotification(`お気に入りに追加しました！(${rating})`);
        } else {
            showNotification('既に保存されています。');
        }
        
        updateFavoritesCount();

    } catch (error) {
        console.error('Error saving favorite:', error);
        showNotification('保存に失敗しました。');
    }
}

// 評価選択ダイアログ
function showRatingDialog() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'rating-dialog-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex; justify-content: center; align-items: center;
            z-index: 3000;
            overflow-y: auto;
        `;

        const dialog = document.createElement('div');
        dialog.className = 'rating-dialog';
        dialog.style.cssText = `
            background: white; padding: 2rem; border-radius: 12px;
            width: 90%; max-width: 400px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            text-align: center;
            margin: auto;
        `;

        const title = document.createElement('h3');
        title.textContent = 'このデザインはどう思いますか？';
        title.style.cssText = 'margin-top: 0; margin-bottom: 1.5rem; color: #333;';
        dialog.appendChild(title);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem;';

        RATINGS.forEach(rating => {
            const btn = document.createElement('button');
            btn.textContent = rating;
            btn.style.cssText = `
                padding: 0.8rem; background: #4ECDC4; color: white;
                border: none; border-radius: 8px; cursor: pointer;
                font-size: 0.95rem; font-weight: bold; transition: background 0.3s;
            `;
            btn.onmouseover = () => btn.style.background = '#3AA399';
            btn.onmouseout = () => btn.style.background = '#4ECDC4';
            btn.onclick = () => {
                overlay.remove();
                resolve(rating);
            };
            buttonsContainer.appendChild(btn);
        });

        dialog.appendChild(buttonsContainer);

        // カスタム評価入力セクション
        const customSection = document.createElement('div');
        customSection.style.cssText = 'margin-bottom: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #eee;';

        const customLabel = document.createElement('label');
        customLabel.textContent = 'または自分で入力：';
        customLabel.style.cssText = 'display: block; margin-bottom: 0.8rem; color: #666; font-weight: bold; text-align: left;';
        customSection.appendChild(customLabel);

        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.placeholder = '例：新しい感覚、美しい、など...';
        customInput.style.cssText = `
            width: 100%; padding: 0.8rem; border: 1px solid #ddd;
            border-radius: 6px; font-size: 1rem; box-sizing: border-box;
        `;
        customSection.appendChild(customInput);

        const customBtn = document.createElement('button');
        customBtn.textContent = 'カスタム評価で保存';
        customBtn.style.cssText = `
            width: 100%; margin-top: 0.8rem; padding: 0.8rem; background: #45B7D1; color: white;
            border: none; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: bold;
            transition: background 0.3s;
        `;
        customBtn.onmouseover = () => customBtn.style.background = '#3498DB';
        customBtn.onmouseout = () => customBtn.style.background = '#45B7D1';
        customBtn.onclick = () => {
            const customValue = customInput.value.trim();
            if (customValue) {
                overlay.remove();
                resolve(customValue);
            } else {
                alert('評価を入力してください。');
            }
        };
        customSection.appendChild(customBtn);

        dialog.appendChild(customSection);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'キャンセル';
        cancelBtn.style.cssText = `
            padding: 0.8rem; background: #eee; color: #333;
            border: none; border-radius: 8px; cursor: pointer; width: 100%;
        `;
        cancelBtn.onclick = () => {
            overlay.remove();
            resolve(null);
        };
        dialog.appendChild(cancelBtn);

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // フォーカスをカスタム入力にセット
        customInput.focus();
    });
}

// localStorageのヘルパー関数
function getFavoritesFromStorage() {
    try {
        const data = localStorage.getItem(FAVORITES_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return [];
    }
}

function generateThumbnail(design) {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    drawDesign(canvas, design);
    return canvas.toDataURL('image/png');
}

// ==================== お気に入り読み込み・表示 ====================
async function loadFavorites() {
    try {
        const favorites = getFavoritesFromStorage();
        
        // フィルタバーを生成
        generateRatingFilterBar(favorites);
        
        // フィルタバーのイベントリスナーを設定
        setupRatingFilterListeners();
        
        displayFavorites(favorites);
        
        // 統計表示を非表示にする
        const colorStatsAccordion = document.getElementById('colorStatsAccordion');
        const shapeStatsAccordion = document.getElementById('shapeStatsAccordion');
        if (colorStatsAccordion) colorStatsAccordion.style.display = 'none';
        if (shapeStatsAccordion) shapeStatsAccordion.style.display = 'none';
        
        updateFavoritesCount();

    } catch (error) {
        console.error('Error loading favorites:', error);
        displayFavorites([]);
    }
}

// 評価フィルタバーを生成
function generateRatingFilterBar(favorites) {
    const filterBar = document.querySelector('.rating-filter-bar');
    
    // 既存のボタンをクリア（「すべて」ボタン以外）
    const existingButtons = filterBar.querySelectorAll('[data-rating]');
    existingButtons.forEach((btn, index) => {
        if (index > 0) btn.remove();
    });
    
    // 使用されている評価を取得
    const usedRatings = new Set();
    favorites.forEach(fav => {
        if (fav.rating) {
            usedRatings.add(fav.rating);
        }
    });
    
    // 定義済み評価と使用済み評価を組み合わせ
    const allRatings = new Set([...RATINGS, ...usedRatings]);
    
    // ボタンを生成
    allRatings.forEach(rating => {
        const btn = document.createElement('button');
        btn.className = 'rating-filter-btn';
        btn.textContent = rating;
        btn.dataset.rating = rating;
        filterBar.appendChild(btn);
    });
}

// フィルタボタンのイベントリスナーを設定
function setupRatingFilterListeners() {
    document.querySelectorAll('.rating-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // アクティブ状態を更新
            document.querySelectorAll('.rating-filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            
            // フィルタに基づいて表示を更新
            const selectedRating = btn.dataset.rating;
            const favorites = getFavoritesFromStorage();
            
            let filtered = favorites;
            if (selectedRating !== 'all') {
                filtered = favorites.filter(fav => fav.rating === selectedRating);
            }
            
            displayFavorites(filtered);
            
            // 「すべて」以外の場合のみ統計を表示
            if (selectedRating !== 'all') {
                updateColorStats(filtered, selectedRating);
            } else {
                const colorStatsAccordion = document.getElementById('colorStatsAccordion');
                const shapeStatsAccordion = document.getElementById('shapeStatsAccordion');
                if (colorStatsAccordion) colorStatsAccordion.style.display = 'none';
                if (shapeStatsAccordion) shapeStatsAccordion.style.display = 'none';
            }
        });
    });
}

// 色彩統計を計算・表示
function updateColorStats(favorites, selectedRating) {
    const statsAccordion = document.getElementById('colorStatsAccordion');
    const shapeStatsAccordion = document.getElementById('shapeStatsAccordion');
    
    if (favorites.length === 0) {
        statsAccordion.style.display = 'none';
        shapeStatsAccordion.style.display = 'none';
        return;
    }
    
    statsAccordion.style.display = 'block';
    shapeStatsAccordion.style.display = 'block';
    
    // 初回表示時にアコーディオンをセットアップ
    setupAccordions();
    
    // カラースキーム別の集計
    const schemeCount = {};
    const allColors = [];
    const shapeCount = {};
    
    favorites.forEach(fav => {
        const design = JSON.parse(fav.design_data);
        const scheme = design.scheme;
        schemeCount[scheme] = (schemeCount[scheme] || 0) + 1;
        
        // この評価で使用されている色を集める
        design.shapes.forEach(shape => {
            allColors.push(shape.color);
            // 形状をカウント
            shapeCount[shape.type] = (shapeCount[shape.type] || 0) + 1;
        });
    });
    
    // グラフを描画
    displaySchemeChart(schemeCount, favorites.length);
    
    // カラーパレットを描画
    displayColorPalette(allColors);
    
    // 形状統計パネルを表示
    displayShapeStats(shapeCount);
}

// カラースキーム分布グラフを表示
function displaySchemeChart(schemeCount, total) {
    const chartContainer = document.getElementById('schemeChart');
    chartContainer.innerHTML = '';
    
    // スキーム名と代表色
    const schemeInfo = {
        'vibrant': { name: 'ビビッド', colors: ['#FF6B6B', '#4ECDC4', '#FFA07A'] },
        'pastel': { name: 'パステル', colors: ['#FFB3BA', '#FFDFBA', '#BAFFC9'] },
        'earth': { name: 'アース', colors: ['#8B7355', '#C9B59A', '#D4C5B9'] },
        'monochrome': { name: 'モノクロ', colors: ['#2C3E50', '#7F8C8D', '#BDC3C7'] },
        'warm': { name: 'ウォーム', colors: ['#FF6B6B', '#FFB84D', '#FA8072'] },
        'cool': { name: 'クール', colors: ['#4ECDC4', '#5DADE2', '#84DCC6'] }
    };
    
    Object.entries(schemeCount).forEach(([scheme, count]) => {
        const percentage = Math.round((count / total) * 100);
        const info = schemeInfo[scheme];
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        
        // 色見本を作成
        const colorSamples = info.colors.map(color => 
            `<div class="scheme-color-sample" style="background-color: ${color}"></div>`
        ).join('');
        
        bar.innerHTML = `
            <div class="bar-label-with-colors">
                <div class="scheme-colors">${colorSamples}</div>
                <span>${info.name}</span>
            </div>
            <div class="bar-container">
                <div class="bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="bar-value">${count}個 (${percentage}%)</div>
        `;
        chartContainer.appendChild(bar);
    });
}

// 色パレットを表示
function displayColorPalette(colors) {
    const paletteContainer = document.getElementById('paletteColors');
    paletteContainer.innerHTML = '';
    
    // 色をグループ化（重複排除）
    const uniqueColors = [...new Set(colors)];
    
    // 最大20色まで表示
    const displayColors = uniqueColors.slice(0, 20);
    
    displayColors.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = color;
        colorBox.title = color;
        paletteContainer.appendChild(colorBox);
    });
    
    if (uniqueColors.length > 20) {
        const moreText = document.createElement('div');
        moreText.className = 'color-more';
        moreText.textContent = `+${uniqueColors.length - 20}色`;
        paletteContainer.appendChild(moreText);
    }
}

// 形状統計を表示
function displayShapeStats(shapeCount) {
    const chartContainer = document.getElementById('shapeChart');
    
    if (Object.keys(shapeCount).length === 0) {
        return;
    }
    
    chartContainer.innerHTML = '';
    
    // 形状の日本語名
    const shapeLabels = {
        'circle': '● 円',
        'square': '■ 四角',
        'triangle': '▲ 三角',
        'pentagon': '⬟ 五角',
        'hexagon': '⬢ 六角',
        'star': '★ 星'
    };
    
    // 総数を計算
    const totalShapes = Object.values(shapeCount).reduce((a, b) => a + b, 0);
    
    // 形状を個数の多い順でソート
    const sortedShapes = Object.entries(shapeCount)
        .sort((a, b) => b[1] - a[1]);
    
    sortedShapes.forEach(([shape, count]) => {
        const percentage = Math.round((count / totalShapes) * 100);
        
        const bar = document.createElement('div');
        bar.className = 'shape-chart-bar';
        bar.innerHTML = `
            <div class="shape-bar-label">${shapeLabels[shape] || shape}</div>
            <div class="shape-bar-container">
                <div class="shape-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="shape-bar-value">${count}個 (${percentage}%)</div>
        `;
        chartContainer.appendChild(bar);
    });
}

// 折りたたみ機能の初期化
function setupAccordions() {
    const colorHeader = document.getElementById('colorStatsHeader');
    const colorContent = document.getElementById('colorStatsContent');
    const colorIcon = colorHeader ? colorHeader.querySelector('.accordion-icon') : null;

    const shapeHeader = document.getElementById('shapeStatsHeader');
    const shapeContent = document.getElementById('shapeStatsContent');
    const shapeIcon = shapeHeader ? shapeHeader.querySelector('.accordion-icon') : null;

    // 色彩統計アコーディオン
    if (colorHeader && !colorHeader.dataset.initialized) {
        colorHeader.dataset.initialized = 'true';
        colorHeader.addEventListener('click', () => {
            const isOpen = colorContent.style.display === 'block';
            colorContent.style.display = isOpen ? 'none' : 'block';
            colorIcon.textContent = isOpen ? '▶' : '▼';
        });
    }

    // 形状統計アコーディオン
    if (shapeHeader && !shapeHeader.dataset.initialized) {
        shapeHeader.dataset.initialized = 'true';
        shapeHeader.addEventListener('click', () => {
            const isOpen = shapeContent.style.display === 'block';
            shapeContent.style.display = isOpen ? 'none' : 'block';
            shapeIcon.textContent = isOpen ? '▶' : '▼';
        });
    }
}

function displayFavorites(favorites) {
    const grid = document.getElementById('favoritesGrid');
    const emptyState = document.getElementById('emptyState');

    grid.innerHTML = '';

    if (favorites.length === 0) {
        emptyState.style.display = 'block';
        grid.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    grid.style.display = 'grid';

    favorites.forEach(favorite => {
        const item = createFavoriteItem(favorite);
        grid.appendChild(item);
    });
}

function createFavoriteItem(favorite) {
    const item = document.createElement('div');
    item.className = 'favorite-item';

    const thumbnail = document.createElement('div');
    thumbnail.className = 'favorite-thumbnail';

    const canvas = document.createElement('canvas');
    canvas.className = 'favorite-canvas';
    canvas.width = 300;
    canvas.height = 300;

    const design = JSON.parse(favorite.design_data);
    drawDesign(canvas, design);

    thumbnail.appendChild(canvas);
    thumbnail.onclick = () => openDetailModal(design);

    // 評価バッジを追加（クリック可能）
    const ratingBadge = document.createElement('div');
    ratingBadge.className = 'rating-badge';
    ratingBadge.textContent = favorite.rating || '未評価';
    ratingBadge.style.cssText = `
        position: absolute; top: 10px; right: 10px;
        background: #FF6B6B; color: white; padding: 0.5rem 1rem;
        border-radius: 20px; font-size: 0.9rem; font-weight: bold;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        cursor: pointer; transition: background 0.3s;
    `;
    ratingBadge.onmouseover = () => ratingBadge.style.background = '#E85555';
    ratingBadge.onmouseout = () => ratingBadge.style.background = '#FF6B6B';
    ratingBadge.onclick = (e) => {
        e.stopPropagation();
        updateRating(favorite.id);
    };
    thumbnail.style.position = 'relative';
    thumbnail.appendChild(ratingBadge);

    const actions = document.createElement('div');
    actions.className = 'favorite-actions';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-icon-small';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> 保存';
    downloadBtn.onclick = () => downloadFavorite(canvas);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon-small delete';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> 削除';
    deleteBtn.onclick = () => deleteFavorite(favorite.id);

    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(thumbnail);
    item.appendChild(actions);

    return item;
}

// 評価を更新する関数
async function updateRating(favoriteId) {
    try {
        const newRating = await showRatingDialog();
        if (newRating === null) return; // キャンセルされた
        
        let favorites = getFavoritesFromStorage();
        const favorite = favorites.find(fav => fav.id === favoriteId);
        
        if (favorite) {
            favorite.rating = newRating;
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
            
            showNotification(`評価を「${newRating}」に変更しました！`);
            loadFavorites(); // UIを再読み込み
        }
    } catch (error) {
        console.error('Error updating rating:', error);
        showNotification('評価の更新に失敗しました。');
    }
}

function downloadFavorite(canvas) {
    const link = document.createElement('a');
    const timestamp = new Date().getTime();
    link.download = `favorite-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showNotification('デザインをダウンロードしました！');
}

function deleteFavorite(id) {
    if (!confirm('このデザインを削除しますか？')) return;

    try {
        let favorites = getFavoritesFromStorage();
        favorites = favorites.filter(fav => fav.id !== id);
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));

        showNotification('お気に入りを削除しました。');
        loadFavorites();

    } catch (error) {
        console.error('Error deleting favorite:', error);
        showNotification('削除に失敗しました。');
    }
}

function clearAllFavorites() {
    if (!confirm('すべてのお気に入りを削除しますか？この操作は取り消せません。')) return;

    try {
        localStorage.removeItem(FAVORITES_STORAGE_KEY);

        showNotification('すべてのお気に入りを削除しました。');
        loadFavorites();

    } catch (error) {
        console.error('Error clearing favorites:', error);
        showNotification('削除に失敗しました。');
    }
}

function updateFavoritesCount() {
    try {
        const favorites = getFavoritesFromStorage();
        const count = favorites.length;
        document.getElementById('favoritesCount').textContent = count;

    } catch (error) {
        console.error('Error updating favorites count:', error);
    }
}

// ==================== 通知 ====================
function showNotification(message) {
    const notification = document.getElementById('notification');
    const text = document.getElementById('notificationText');
    
    text.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
