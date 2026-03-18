// ============================================
// 多平台适配模块 v1.0
// T3.4 多平台适配
// ============================================

// ==================== 1. 平台检测 ====================

const Platform = {
    // 平台枚举
    WECHAT: 'wechat',      // 微信小游戏
    H5: 'h5',              // H5浏览器
    PC: 'pc',              // PC模拟器
    
    // 当前平台
    current: null,
    
    // 检测当前平台
    detect() {
        // 微信小游戏环境
        if (typeof wx !== 'undefined' && wx.onShow) {
            this.current = this.WECHAT;
            return this.WECHAT;
        }
        
        // PC环境 (通过User Agent或屏幕尺寸判断)
        if (this.isPC()) {
            this.current = this.PC;
            return this.PC;
        }
        
        // 默认H5
        this.current = this.H5;
        return this.H5;
    },
    
    // 判断是否为PC
    isPC() {
        const ua = navigator.userAgent.toLowerCase();
        const screenW = window.screen.width;
        const screenH = window.screen.height;
        
        // 通过屏幕尺寸判断 (PC通常 > 768px)
        if (screenW > 768 && screenH > 768) return true;
        
        // 通过User Agent判断
        const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'mobile', 'windows phone'];
        for (const kw of mobileKeywords) {
            if (ua.includes(kw)) return false;
        }
        
        return true;
    },
    
    // 获取平台信息
    getInfo() {
        return {
            platform: this.current,
            isWechat: this.current === this.WECHAT,
            isH5: this.current === this.H5,
            isPC: this.current === this.PC,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            pixelRatio: window.devicePixelRatio || 1,
            os: this.getOS()
        };
    },
    
    // 获取操作系统
    getOS() {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
        if (ua.includes('android')) return 'android';
        if (ua.includes('windows')) return 'windows';
        if (ua.includes('mac')) return 'mac';
        if (ua.includes('linux')) return 'linux';
        return 'unknown';
    }
};

// ==================== 2. 微信小游戏SDK ====================

class WechatGameSDK {
    constructor() {
        this.sdk = null;
        this.initialized = false;
        this.userInfo = null;
    }
    
    // 初始化
    async init() {
        if (typeof wx === 'undefined') {
            console.log('Not in WeChat environment');
            return false;
        }
        
        try {
            // 获取系统信息
            const sysInfo = wx.getSystemInfoSync();
            console.log('WeChat System Info:', sysInfo);
            
            // 初始化分享
            this.initShare();
            
            this.initialized = true;
            return true;
        } catch (e) {
            console.error('WeChat SDK init error:', e);
            return false;
        }
    }
    
    // 初始化分享
    initShare() {
        // 设置分享内容
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
        });
        
        // 自定义分享内容
        wx.onShareAppMessage(() => {
            return {
                title: '神秘森林 - 探险解谜',
                imageUrl: '/assets/images/share.png',
                query: 'from=share'
            };
        });
        
        wx.onShareTimeline(() => {
            return {
                title: '神秘森林 - 探险解谜',
                imageUrl: '/assets/images/share.png',
                query: 'from=timeline'
            };
        });
    }
    
    // 获取用户信息 (需要用户授权)
    async getUserInfo() {
        if (!this.initialized) return null;
        
        try {
            const setting = await wx.getSetting();
            if (setting.authSetting['scope.userInfo']) {
                const userInfo = await wx.getUserInfo();
                this.userInfo = userInfo.userInfo;
                return this.userInfo;
            }
            return null;
        } catch (e) {
            console.error('Get user info error:', e);
            return null;
        }
    }
    
    // 存储数据
    setStorage(key, value) {
        if (this.initialized) {
            wx.setStorageSync(key, value);
        } else {
            localStorage.setItem(key, value);
        }
    }
    
    // 获取数据
    getStorage(key) {
        if (this.initialized) {
            return wx.getStorageSync(key);
        } else {
            return localStorage.getItem(key);
        }
    }
    
    // 激励广告
    async showRewardedVideoAd(adUnitId) {
        if (!this.initialized) return false;
        
        try {
            const video = wx.createRewardedVideoAd({ adUnitId });
            await video.show();
            return true;
        } catch (e) {
            console.error('Rewarded video error:', e);
            return false;
        }
    }
    
    // 震动反馈
    vibrateShort() {
        if (this.initialized && wx.vibrateShort) {
            wx.vibrateShort({ type: 'light' });
        }
    }
    
    vibrateLong() {
        if (this.initialized && wx.vibrateLong) {
            wx.vibrateLong();
        }
    }
}

// ==================== 3. 屏幕适配 ====================

class ScreenAdapter {
    constructor() {
        this.designWidth = 500;      // 设计稿宽度
        this.designHeight = 900;     // 设计稿高度
        this.maxWidth = 500;        // 最大宽度
        this.maxHeight = 900;       // 最大高度
        this.ratio = 0;             // 缩放比例
        this.orientation = 'portrait'; // 横竖屏
        this.landscape = false;
        
        this.init();
    }
    
    init() {
        this.update();
        
        // 监听窗口变化
        window.addEventListener('resize', () => this.update());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.update(), 100);
        });
    }
    
    update() {
        const container = document.getElementById('game-container');
        if (!container) return;
        
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        // 判断横竖屏
        this.landscape = screenW > screenH;
        this.orientation = this.landscape ? 'landscape' : 'portrait';
        
        // 计算缩放比例
        const scaleX = screenW / this.designWidth;
        const scaleY = screenH / this.designHeight;
        this.ratio = Math.min(scaleX, scaleY, 1); // 不放大，只缩小
        
        // 应用缩放
        container.style.transform = `scale(${this.ratio})`;
        container.style.transformOrigin = 'center center';
        
        // 记录实际尺寸
        this.width = screenW * this.ratio;
        this.height = screenH * this.ratio;
    }
    
    // 锁定屏幕方向
    lockOrientation(orientation) {
        if (Platform.current === Platform.WECHAT) {
            if (wx.lockScreenOrientation) {
                wx.lockScreenOrientation({
                    orientation: orientation
                });
            }
        }
    }
    
    // 获取缩放后的坐标
    scaleX(x) {
        return x * this.ratio;
    }
    
    scaleY(y) {
        return y * this.ratio;
    }
}

// ==================== 4. 触控优化 ====================

class TouchOptimizer {
    constructor() {
        this.touches = new Map();
        this.multiTouch = false;
        this.pinchDistance = 0;
        this.enabled = true;
        
        this.init();
    }
    
    init() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;
        
        // 触摸事件
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
        
        // 鼠标事件 (PC兼容)
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }
    
    onTouchStart(e) {
        e.preventDefault();
        this.touches.clear();
        
        for (const touch of e.touches) {
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY
            });
        }
        
        this.multiTouch = e.touches.length > 1;
        
        if (this.multiTouch) {
            this.pinchDistance = this.calcDistance();
        }
        
        this.emit('touchstart', this.getTouchData());
    }
    
    onTouchMove(e) {
        e.preventDefault();
        this.touches.clear();
        
        for (const touch of e.touches) {
            const data = this.touches.get(touch.identifier) || {};
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                prevX: data.x || touch.clientX,
                prevY: data.y || touch.clientY,
                deltaX: (data.x || touch.clientX) - (data.prevX || touch.clientX),
                deltaY: (data.y || touch.clientY) - (data.prevY || touch.clientY)
            });
        }
        
        if (e.touches.length > 1) {
            const newDist = this.calcDistance();
            this.emit('pinch', newDist - this.pinchDistance);
            this.pinchDistance = newDist;
        }
        
        this.emit('touchmove', this.getTouchData());
    }
    
    onTouchEnd(e) {
        this.touches.clear();
        
        for (const touch of e.touches) {
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY
            });
        }
        
        this.multiTouch = e.touches.length > 1;
        this.emit('touchend', this.getTouchData());
    }
    
    calcDistance() {
        const touchArr = Array.from(this.touches.values());
        if (touchArr.length < 2) return 0;
        
        const dx = touchArr[1].x - touchArr[0].x;
        const dy = touchArr[1].y - touchArr[0].y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getTouchData() {
        const arr = Array.from(this.touches.values());
        return {
            count: arr.length,
            touches: arr,
            multiTouch: this.multiTouch,
            center: this.getCenter()
        };
    }
    
    getCenter() {
        const arr = Array.from(this.touches.values());
        if (arr.length === 0) return { x: 0, y: 0 };
        
        const sum = arr.reduce((acc, t) => ({
            x: acc.x + t.x,
            y: acc.y + t.y
        }), { x: 0, y: 0 });
        
        return {
            x: sum.x / arr.length,
            y: sum.y / arr.length
        };
    }
    
    // 事件系统
    on(event, callback) {
        if (!this.listeners) this.listeners = {};
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.listeners || !this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    
    emit(event, data) {
        if (!this.listeners || !this.listeners[event]) return;
        this.listeners[event].forEach(cb => cb(data));
    }
    
    // 鼠标事件 (PC)
    onMouseDown(e) {
        this.touches.set('mouse', {
            x: e.clientX,
            y: e.clientY,
            startX: e.clientX,
            startY: e.clientY
        });
        this.emit('touchstart', this.getTouchData());
    }
    
    onMouseMove(e) {
        const data = this.touches.get('mouse');
        if (!data) return;
        
        data.x = e.clientX;
        data.y = e.clientY;
        data.deltaX = data.x - (data.prevX || data.x);
        data.deltaY = data.y - (data.prevY || data.y);
        data.prevX = data.x;
        data.prevY = data.y;
        
        this.emit('touchmove', this.getTouchData());
    }
    
    onMouseUp(e) {
        this.touches.delete('mouse');
        this.emit('touchend', this.getTouchData());
    }
}

// ==================== 5. 分包加载 ====================

class SubpackageLoader {
    constructor() {
        this.loaded = new Set();
    }
    
    // 加载分包 (微信小游戏)
    async loadSubpackage(name, success, fail) {
        if (this.loaded.has(name)) {
            if (success) success();
            return;
        }
        
        if (typeof wx !== 'undefined' && wx.loadSubpackage) {
            try {
                const task = wx.loadSubpackage({
                    name: name,
                    success: () => {
                        this.loaded.add(name);
                        if (success) success();
                    },
                    fail: (err) => {
                        console.error(`Subpackage ${name} load failed:`, err);
                        if (fail) fail(err);
                    }
                });
                
                // 进度回调
                if (task && task.onProgressUpdate) {
                    task.onProgressUpdate((res) => {
                        console.log(`${name} progress:`, res.progress, res.totalBytesExpectedToReceive);
                    });
                }
            } catch (e) {
                console.error('Load subpackage error:', e);
                if (fail) fail(e);
            }
        } else {
            // 非微信环境，直接成功
            this.loaded.add(name);
            if (success) success();
        }
    }
}

// ==================== 6. 网络状态 ====================

class NetworkManager {
    constructor() {
        this.online = navigator.onLine;
        this.type = 'unknown';
        
        this.init();
    }
    
    init() {
        window.addEventListener('online', () => {
            this.online = true;
            this.emit('change', { online: true });
        });
        
        window.addEventListener('offline', () => {
            this.online = false;
            this.emit('change', { online: false });
        });
        
        // 微信网络状态
        if (typeof wx !== 'undefined' && wx.getNetworkType) {
            wx.getNetworkType({
                success: (res) => {
                    this.type = res.networkType;
                }
            });
            
            wx.onNetworkStatusChange((res) => {
                this.online = res.isConnected;
                this.type = res.networkType;
                this.emit('change', { online: res.isConnected, type: res.networkType });
            });
        }
    }
    
    isOnline() {
        return this.online;
    }
    
    isWifi() {
        return this.type === 'wifi';
    }
    
    on(event, callback) {
        if (!this.listeners) this.listeners = {};
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    
    emit(event, data) {
        if (!this.listeners || !this.listeners[event]) return;
        this.listeners[event].forEach(cb => cb(data));
    }
}

// ==================== 7. 适配管理器 ====================

class PlatformAdapter {
    constructor() {
        this.platform = Platform;
        this.sdk = null;
        this.screen = null;
        this.touch = null;
        this.network = null;
        this.subpackage = null;
    }
    
    async init() {
        // 检测平台
        this.platform.detect();
        console.log('Platform:', this.platform.getInfo());
        
        // 初始化屏幕适配
        this.screen = new ScreenAdapter();
        
        // 初始化触控
        this.touch = new TouchOptimizer();
        
        // 初始化网络
        this.network = new NetworkManager();
        
        // 初始化分包
        this.subpackage = new SubpackageLoader();
        
        // 微信小游戏SDK
        if (this.platform.current === this.platform.WECHAT) {
            this.sdk = new WechatGameSDK();
            await this.sdk.init();
        }
        
        return this.platform.current;
    }
    
    // 获取适配信息
    getAdapterInfo() {
        return {
            platform: this.platform.current,
            platformInfo: this.platform.getInfo(),
            screen: {
                width: this.screen?.width || 0,
                height: this.screen?.height || 0,
                ratio: this.screen?.ratio || 1,
                orientation: this.screen?.orientation || 'portrait'
            },
            network: {
                online: this.network?.isOnline() || false,
                type: this.network?.type || 'unknown'
            }
        };
    }
}

// 创建全局实例
let platformAdapter = null;

async function initPlatformAdapter() {
    if (!platformAdapter) {
        platformAdapter = new PlatformAdapter();
        await platformAdapter.init();
    }
    return platformAdapter;
}

function getPlatformAdapter() {
    return platformAdapter;
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Platform,
        WechatGameSDK,
        ScreenAdapter,
        TouchOptimizer,
        SubpackageLoader,
        NetworkManager,
        PlatformAdapter,
        initPlatformAdapter,
        getPlatformAdapter
    };
}
