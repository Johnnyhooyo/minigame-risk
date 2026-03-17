// ============================================
// 地图系统 v2.0
// 数据结构 + 渲染系统 + 编辑器
// ============================================

// ==================== 2.1 核心数据模型 ====================

// 瓦片类型定义
const TILE_CATEGORIES = {
    BASIC: '基础',
    VEGETATION: '植被', 
    BUILDING: '建筑',
    ROCK: '岩石',
    ROAD: '道路',
    DECORATION: '装饰'
};

// 30+ 地形类型
const TILE_TYPES = {
    // 基础地形 (0-9)
    0: { id: 0, name: '草地', category: TILE_CATEGORIES.BASIC, color: '#4CAF50', passable: true },
    1: { id: 1, name: '泥土', category: TILE_CATEGORIES.BASIC, color: '#8D6E63', passable: true },
    2: { id: 2, name: '石板路', category: TILE_CATEGORIES.BASIC, color: '#9E9E9E', passable: true },
    3: { id: 3, name: '沙地', category: TILE_CATEGORIES.BASIC, color: '#D7CCC8', passable: true },
    4: { id: 4, name: '雪地', category: TILE_CATEGORIES.BASIC, color: '#ECEFF1', passable: true },
    5: { id: 5, name: '冰面', category: TILE_CATEGORIES.BASIC, color: '#B3E5FC', passable: true, slip: true },
    6: { id: 6, name: '泥地', category: TILE_CATEGORIES.BASIC, color: '#6D4C41', passable: true },
    7: { id: 7, name: '深水', category: TILE_CATEGORIES.BASIC, color: '#1565C0', passable: false },
    8: { id: 8, name: '浅水', category: TILE_CATEGORIES.BASIC, color: '#42A5F5', passable: true },
    9: { id: 9, name: '草地深', category: TILE_CATEGORIES.BASIC, color: '#388E3C', passable: true },
    
    // 植被 (10-17)
    10: { id: 10, name: '小树', category: TILE_CATEGORIES.VEGETATION, color: '#2E7D32', passable: false },
    11: { id: 11, name: '大树', category: TILE_CATEGORIES.VEGETATION, color: '#1B5E20', passable: false },
    12: { id: 12, name: '枯树', category: TILE_CATEGORIES.VEGETATION, color: '#795548', passable: false },
    13: { id: 13, name: '灌木', category: TILE_CATEGORIES.VEGETATION, color: '#43A047', passable: false },
    14: { id: 14, name: '花丛', category: TILE_CATEGORIES.VEGETATION, color: '#66BB6A', passable: true },
    15: { id: 15, name: '蘑菇', category: TILE_CATEGORIES.VEGETATION, color: '#AB47BC', passable: true, collectible: true },
    16: { id: 16, name: '发光草', category: TILE_CATEGORIES.VEGETATION, color: '#76FF03', passable: true, light: true },
    17: { id: 17, name: '藤蔓', category: TILE_CATEGORIES.VEGETATION, color: '#33691E', passable: false },
    
    // 建筑 (18-23)
    18: { id: 18, name: '木屋', category: TILE_CATEGORIES.BUILDING, color: '#8D6E63', passable: false },
    19: { id: 19, name: '石屋', category: TILE_CATEGORIES.BUILDING, color: '#78909C', passable: false },
    20: { id: 20, name: '塔楼', category: TILE_CATEGORIES.BUILDING, color: '#5D4037', passable: false },
    21: { id: 21, name: '栅栏', category: TILE_CATEGORIES.BUILDING, color: '#A1887F', passable: false },
    22: { id: 22, name: '围墙', category: TILE_CATEGORIES.BUILDING, color: '#4E342E', passable: false },
    23: { id: 23, name: '大门', category: TILE_CATEGORIES.BUILDING, color: '#3E2723', passable: false, trigger: 'door' },
    
    // 岩石 (24-27)
    24: { id: 24, name: '小石', category: TILE_CATEGORIES.ROCK, color: '#90A4AE', passable: false },
    25: { id: 25, name: '大石', category: TILE_CATEGORIES.ROCK, color: '#607D8B', passable: false },
    26: { id: 26, name: '悬崖', category: TILE_CATEGORIES.ROCK, color: '#37474F', passable: false },
    27: { id: 27, name: '岩浆', category: TILE_CATEGORIES.ROCK, color: '#FF5722', passable: false, damage: 10 },
    
    // 道路 (28-31)
    28: { id: 28, name: '道路', category: TILE_CATEGORIES.ROAD, color: '#BCAAA4', passable: true },
    29: { id: 29, name: '桥梁', category: TILE_CATEGORIES.ROAD, color: '#A1887F', passable: true },
    30: { id: 30, name: '楼梯', category: TILE_CATEGORIES.ROAD, color: '#9E9E9E', passable: true },
    31: { id: 31, name: '传送门', category: TILE_CATEGORIES.ROAD, color: '#7C4DFF', passable: true, trigger: 'teleport' },
    
    // 装饰 (32-39)
    32: { id: 32, name: '火把', category: TILE_CATEGORIES.DECORATION, color: '#FF9800', passable: false, light: true },
    33: { id: 33, name: '宝箱', category: TILE_CATEGORIES.DECORATION, color: '#FFC107', passable: false, collectible: true },
    34: { id: 34, name: '墓碑', category: TILE_CATEGORIES.DECORATION, color: '#757575', passable: false },
    35: { id: 35, name: '雕像', category: TILE_CATEGORIES.DECORATION, color: '#BDBDBD', passable: false },
    36: { id: 36, name: '旗帜', category: TILE_CATEGORIES.DECORATION, color: '#F44336', passable: false },
    37: { id: 37, name: '书籍', category: TILE_CATEGORIES.DECORATION, color: '#673AB7', passable: true, collectible: true },
    38: { id: 38, name: '药剂', category: TILE_CATEGORIES.DECORATION, color: '#E91E63', passable: true, collectible: true },
    39: { id: 39, name: '钥匙', category: TILE_CATEGORIES.DECORATION, color: '#FFEB3B', passable: true, collectible: true },
    
    // 特殊 (40+)
    40: { id: 40, name: '出口', category: TILE_CATEGORIES.ROAD, color: '#FFD700', passable: true, trigger: 'exit' },
    41: { id: 41, name: '迷雾', category: TILE_CATEGORIES.DECORATION, color: '#90A4AE', passable: false, alpha: 0.7 }
};

// 可通过地形
const PASSABLE_TILES = Object.entries(TILE_TYPES)
    .filter(([id, t]) => t.passable)
    .map(([id]) => parseInt(id));

// ==================== 2.2 地图数据类 ====================

class MapData {
    constructor(options = {}) {
        this.id = options.id || 'map_' + Date.now();
        this.name = options.name || '新地图';
        this.version = '2.0';
        this.width = options.width || 50;
        this.height = options.height || 50;
        this.tileSize = options.tileSize || 32;
        
        // 图层
        this.layers = {
            terrain: new TileLayer(this.width, this.height),
            collision: new TileLayer(this.width, this.height),
            decoration: new TileLayer(this.width, this.height),
            trigger: new TileLayer(this.width, this.height)
        };
        
        // 对象
        this.objects = [];
        this.spawns = [];
        this.triggers = [];
        
        // 属性
        this.properties = {};
    }
    
    // 设置瓦片
    setTile(x, y, layer, tileId) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.layers[layer].set(x, y, tileId);
        }
    }
    
    // 获取瓦片
    getTile(x, y, layer) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.layers[layer].get(x, y);
        }
        return -1;
    }
    
    // 添加对象
    addObject(obj) {
        obj.id = obj.id || 'obj_' + Date.now() + '_' + this.objects.length;
        this.objects.push(obj);
        return obj.id;
    }
    
    // 移除对象
    removeObject(objId) {
        const index = this.objects.findIndex(o => o.id === objId);
        if (index !== -1) {
            this.objects.splice(index, 1);
            return true;
        }
        return false;
    }
    
    // 添加触发器
    addTrigger(trigger) {
        trigger.id = trigger.id || 'trigger_' + Date.now();
        this.triggers.push(trigger);
        return trigger.id;
    }
    
    // 导出JSON
    toJSON() {
        return {
            format: 'map-v2',
            map: {
                id: this.id,
                name: this.name,
                width: this.width,
                height: this.height,
                tileSize: this.tileSize
            },
            layers: {
                terrain: { data: Array.from(this.layers.terrain.data) },
                collision: { data: Array.from(this.layers.collision.data) },
                decoration: { data: Array.from(this.layers.decoration.data) },
                trigger: { data: Array.from(this.layers.trigger.data) }
            },
            objects: this.objects,
            spawns: this.spawns,
            triggers: this.triggers,
            properties: this.properties
        };
    }
    
    // 从JSON导入
    static fromJSON(json) {
        const map = new MapData({
            id: json.map.id,
            name: json.map.name,
            width: json.map.width,
            height: json.map.height,
            tileSize: json.map.tileSize
        });
        
        if (json.layers) {
            if (json.layers.terrain) map.layers.terrain.data = new Int16Array(json.layers.terrain.data);
            if (json.layers.collision) map.layers.collision.data = new Int16Array(json.layers.collision.data);
            if (json.layers.decoration) map.layers.decoration.data = new Int16Array(json.layers.decoration.data);
            if (json.layers.trigger) map.layers.trigger.data = new Int16Array(json.layers.trigger.data);
        }
        
        map.objects = json.objects || [];
        map.spawns = json.spawns || [];
        map.triggers = json.triggers || [];
        map.properties = json.properties || {};
        
        return map;
    }
}

// 瓦片层
class TileLayer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.visible = true;
        this.opacity = 1;
        this.data = new Int16Array(width * height);
    }
    
    set(x, y, value) {
        this.data[y * this.width + x] = value;
    }
    
    get(x, y) {
        return this.data[y * this.width + x];
    }
    
    fill(value) {
        this.data.fill(value);
    }
    
    fillRect(x, y, w, h, value) {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                this.set(x + dx, y + dy, value);
            }
        }
    }
}

// ==================== 2.3 游戏对象 ====================

const OBJECT_TYPES = {
    NPC: 'npc',
    ITEM: 'item',
    INTERACTABLE: 'interactable',
    DECORATION: 'decoration'
};

// Z值层级
const Z_LAYERS = {
    BACKGROUND: 0,
    TERRAIN: 10,
    DECORATION: 20,
    ITEM: 30,
    NPC: 40,
    PLAYER: 50,
    FOREGROUND: 60,
    UI: 100
};

class GameObject {
    constructor(options) {
        this.id = options.id || 'obj_' + Date.now();
        this.type = options.type || OBJECT_TYPES.DECORATION;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 1;
        this.height = options.height || 1;
        this.z = options.z || Z_LAYERS.DECORATION;
        this.sprite = options.sprite || null;
        this.emoji = options.emoji || '?';
        this.name = options.name || '未知对象';
        this.interaction = options.interaction || null;
        this.script = options.script || null;
        this.state = options.state || 'default';
        this.properties = options.properties || {};
    }
}

// ==================== 2.4 触发器系统 ====================

const TRIGGER_CONDITIONS = {
    ENTER: 'enter',
    LEAVE: 'leave',
    INTERACT: 'interact',
    ITEM_COLLECTED: 'item_collected',
    PUZZLE_SOLVED: 'puzzle_solved'
};

const TRIGGER_ACTIONS = {
    DIALOGUE: 'dialogue',
    TELEPORT: 'teleport',
    GIVE_ITEM: 'give_item',
    SET_FLAG: 'set_flag',
    PLAY_CUTSCENE: 'play_cutscene'
};

class Trigger {
    constructor(options) {
        this.id = options.id || 'trigger_' + Date.now();
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 1;
        this.height = options.height || 1;
        this.condition = options.condition || { type: TRIGGER_CONDITIONS.ENTER };
        this.actions = options.actions || [];
        this.maxTriggers = options.maxTriggers || 0;
        this.triggerCount = 0;
    }
    
    canTrigger() {
        return this.maxTriggers === 0 || this.triggerCount < this.maxTriggers;
    }
    
    execute(context) {
        if (!this.canTrigger()) return;
        
        this.actions.forEach(action => {
            switch (action.type) {
                case TRIGGER_ACTIONS.DIALOGUE:
                    // 执行对话
                    break;
                case TRIGGER_ACTIONS.TELEPORT:
                    // 执行传送
                    break;
                case TRIGGER_ACTIONS.GIVE_ITEM:
                    // 给予物品
                    break;
                case TRIGGER_ACTIONS.SET_FLAG:
                    // 设置标记
                    break;
            }
        });
        
        this.triggerCount++;
    }
}

// ==================== 2.5 地图管理器 ====================

class MapManager {
    constructor() {
        this.currentMap = null;
        this.maps = new Map();
    }
    
    // 加载地图
    loadMap(mapId) {
        return this.maps.get(mapId) || null;
    }
    
    // 保存地图
    saveMap(map) {
        this.maps.set(map.id, map);
    }
    
    // 创建新地图
    createMap(options) {
        const map = new MapData(options);
        this.saveMap(map);
        return map;
    }
    
    // 获取瓦片类型
    getTileType(tileId) {
        return TILE_TYPES[tileId] || null;
    }
    
    // 检查碰撞
    checkCollision(x, y, width, height) {
        if (!this.currentMap) return false;
        
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tileId = this.currentMap.getTile(x + dx, y + dy, 'terrain');
                const tileType = this.getTileType(tileId);
                if (tileType && !tileType.passable) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // 获取范围内的对象
    getObjectsInRect(x, y, width, height) {
        if (!this.currentMap) return [];
        
        return this.currentMap.objects.filter(obj => {
            return obj.x < x + width && obj.x + obj.width > x &&
                   obj.y < y + height && obj.y + obj.height > y;
        });
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        MapData, TileLayer, GameObject, Trigger, MapManager,
        TILE_TYPES, TILE_CATEGORIES, OBJECT_TYPES, Z_LAYERS,
        TRIGGER_CONDITIONS, TRIGGER_ACTIONS, PASSABLE_TILES
    };
}
