const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let state = "menu", userName = "", score = 0, currentLvl = 1;
let player = {}, enemy = {}, log = [];
let selAtk = null, selBlk = [], isProcessing = false;
let pDisplayHp = 0, eDisplayHp = 0, shake = 0, particles = [];
let highScores = JSON.parse(localStorage.getItem('gauntletScores')) || [];
let hoveredItem = null, selectedInvItem = null, tooltipPos = {x:0, y:0};

const assets = {};
function loadAsset(key, path) { const img = new Image(); img.src = path; assets[key] = img; }

loadAsset('player', 'assets/player.png');
for(let i=1; i<=10; i++) loadAsset(`enemy_${i}`, `assets/enemy_lvl_${i}.png`);
Object.keys(ZONE_NAMES).forEach(id => loadAsset(`icon_${id}`, `assets/${ZONE_NAMES[id].toLowerCase()}.png`));
ALL_ITEMS.forEach(item => loadAsset(item.name, `assets/${item.name.toLowerCase().replace(/ /g, '_')}.png`));