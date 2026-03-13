/**
 * 地图数据结构设计
 * 支持 20+ 地形类型
 */

const TILE_TYPES = {
    // 基础地形 (0-9)
    0: { name: '草地', color: '#2d5a2d', passable: true, sprite: 'grass' },
    1: { name: '大树', color: '#1a3a1a', passable: false, sprite: 'tree' },
    2: { name: '石板路', color: '#8d6e63', passable: true, sprite: 'path' },
    3: { name: '水域', color: '#1565c0', passable: false, sprite: 'water' },
    4: { name: '出口', color: '#f1c40f', passable: true, sprite: 'exit', trigger: 'level_complete' },
    5: { name: '木屋', color: '#6d4c41', passable: false, sprite: 'house' },
    6: { name: '草丛', color: '#43a047', passable: true, sprite: 'bush' },
    7: { name: '石头', color: '#607d8b', passable: false, sprite: 'rock' },
    8: { name: '花朵', color: '#e91e63', passable: true, sprite: 'flower' },
    9: { name: '沙地', color: '#d4a574', passable: true, sprite: 'sand' },
    
    // 高级地形 (10-19)
    10: { name: '藤蔓', color: '#4caf50', passable: false, sprite: 'vine' },
    11: { name: '沼泽', color: '#5d4037', passable: false, sprite: 'swamp' },
    12: { name: '岩浆', color: '#ff5722', passable: false, sprite: 'lava', damage: 10 },
    13: { name: '冰面', color: '#b3e5fc', passable: true, sprite: 'ice', slip: true },
    14: { name: '桥梁', color: '#8d6e63', passable: true, sprite: 'bridge' },
    15: { name: '栅栏', color: '#795548', passable: false, sprite: 'fence' },
    16: { name: '门', color: '#3e2723', passable: false, sprite: 'door', trigger: 'door' },
    17: { name: '楼梯', color: '#9e9e9e', passable: true, sprite: 'stairs' },
    18: { name: '地板', color: '#bdbdbd', passable: true, sprite: 'floor' },
    19: { name: '墙', color: '#424242', passable: false, sprite: 'wall' },
    
    // 装饰地形 (20-29)
    20: { name: '发光草', color: '#76ff03', passable: true, sprite: 'glow_grass', light: true },
    21: { name: '火把', color: '#ff9800', passable: false, sprite: 'torch', light: true },
    22: { name: '宝箱', color: '#ffc107', passable: false, sprite: 'chest', trigger: 'chest' },
    23: { name: '墓碑', color: '#757575', passable: false, sprite: 'tombstone' },
    24: { name: '枯树', color: '#8d6e63', passable: false, sprite: 'dead_tree' },
    25: { name: '蘑菇', color: '#e040fb', passable: true, sprite: 'mushroom', collectible: true },
    26: { name: '水晶', color: '#00bcd4', passable: true, sprite: 'crystal', collectible: true },
    27: { name: '钥匙', color: '#ffeb3b', passable: true, sprite: 'key', collectible: true },
    28: { name: '卷轴', color: '#673ab7', passable: true, sprite: 'scroll', collectible: true },
    29: { name: '药剂', color: '#f44336', passable: true, sprite: 'potion', collectible: true }
};

// 地形组（用于编辑器分类）
const TILE_GROUPS = {
   基础: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
   高级: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
   装饰: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
};

// 碰撞层数据
const COLLISION_LAYERS = {
    // 静态碰撞
    static: {
        1: true,  // 大树
        3: true,  // 水域
        5: true,  // 木屋
        7: true,  // 石头
        10: true, // 藤蔓
        11: true, // 沼泽
        12: true, // 岩浆
        15: true, // 栅栏
        16: true, // 门
        19: true, // 墙
        21: true, // 火把
        22: true, // 宝箱
        23: true, // 墓碑
        24: true  // 枯树
    },
    // 可触发碰撞
    trigger: {
        4: 'level_complete',  // 出口
        16: 'door',           // 门
        22: 'chest',          // 宝箱
        25: 'collect_mushroom', // 蘑菇
        26: 'collect_crystal', // 水晶
        27: 'collect_key',    // 钥匙
        28: 'collect_scroll', // 卷轴
        29: 'collect_potion'  // 药剂
    }
};

// 区域触发器类型
const REGION_TRIGGERS = {
    dialogue: { type: 'dialogue', data: { npcId: '', lines: [] } },
    puzzle: { type: 'puzzle', data: { puzzleId: '', required: [] } },
    teleport: { type: 'teleport', data: { x: 0, y: 0, targetLevel: '' } },
    cutscene: { type: 'cutscene', data: { scenes: [] } },
    spawn: { type: 'spawn', data: { enemyId: '', count: 0 } }
};

// 地图数据结构
class MapData {
    constructor(width = 50, height = 50) {
        this.version = '1.0';
        this.width = width;
        this.height = height;
        this.tileSize = 32;
        this.name = '新地图';
        this.tiles = [];        // 地形数据
        this.collision = [];    // 碰撞数据
        this.triggers = [];     // 触发器
        this.spawns = [];       // 出生点
        this.properties = {};   // 自定义属性
        
        this.initTiles();
    }
    
    initTiles() {
        this.tiles = [];
        this.collision = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            const collRow = [];
            for (let x = 0; x < this.width; x++) {
                row.push(0);  // 默认草地
                collRow.push(false);
            }
            this.tiles.push(row);
            this.collision.push(collRow);
        }
    }
    
    // 设置地形
    setTile(x, y, type) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y][x] = type;
            this.collision[y][x] = !TILE_TYPES[type]?.passable;
        }
    }
    
    // 获取地形
    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.tiles[y][x];
        }
        return -1;
    }
    
    // 添加触发器
    addTrigger(trigger) {
        this.triggers.push({
            id: `trigger_${Date.now()}`,
            x: trigger.x || 0,
            y: trigger.y || 0,
            width: trigger.width || 1,
            height: trigger.height || 1,
            type: trigger.type || 'dialogue',
            data: trigger.data || {}
        });
    }
    
    // 导出JSON
    toJSON() {
        return {
            version: this.version,
            name: this.name,
            width: this.width,
            height: this.height,
            tileSize: this.tileSize,
            tiles: this.tiles,
            collision: this.collision,
            triggers: this.triggers,
            spawns: this.spawns,
            properties: this.properties
        };
    }
    
    // 从JSON导入
    static fromJSON(json) {
        const map = new MapData(json.width || 50, json.height || 50);
        map.version = json.version || '1.0';
        map.name = json.name || '新地图';
        map.tileSize = json.tileSize || 32;
        map.tiles = json.tiles || [];
        map.collision = json.collision || [];
        map.triggers = json.triggers || [];
        map.spawns = json.spawns || [];
        map.properties = json.properties || {};
        return map;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TILE_TYPES, TILE_GROUPS, COLLISION_LAYERS, REGION_TRIGGERS, MapData };
}
