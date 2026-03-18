// ============================================
// 性能优化模块 v1.0
// T3.3 性能优化
// ============================================

// ==================== 1. 渲染性能分析 ====================

class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fpsHistory = [];
        this.maxHistory = 60;
        
        // 性能指标
        this.metrics = {
            fps: 60,
            memory: 0,
            renderTime: 0,
            updateTime: 0,
            drawCalls: 0
        };
    }
    
    // 开始帧计时
    beginFrame() {
        this.frameStart = performance.now();
    }
    
    // 结束帧计时
    endFrame() {
        const now = performance.now();
        const frameTime = now - this.frameStart;
        
        this.frameCount++;
        this.fpsHistory.push(1000 / frameTime);
        
        if (this.fpsHistory.length > this.maxHistory) {
            this.fpsHistory.shift();
        }
        
        // 计算平均FPS
        this.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        
        return {
            fps: Math.round(this.fps),
            frameTime: Math.round(frameTime * 100) / 100
        };
    }
    
    // 获取当前状态
    getStatus() {
        return {
            fps: Math.round(this.fps),
            frameCount: this.frameCount,
            memory: this.getMemoryUsage()
        };
    }
    
    // 获取内存使用 (如果支持)
    getMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
}

// ==================== 2. 懒加载系统 ====================

class LazyLoader {
    constructor() {
        this.loadedResources = new Map();
        this.loadingResources = new Set();
        this.callbacks = new Map();
    }
    
    // 懒加载图片
    lazyLoadImage(url, callback) {
        if (this.loadedResources.has(url)) {
            callback(null, this.loadedResources.get(url));
            return;
        }
        
        if (this.loadingResources.has(url)) {
            // 已经在加载中，添加回调
            if (this.callbacks.has(url)) {
                this.callbacks.get(url).push(callback);
            } else {
                this.callbacks.set(url, [callback]);
            }
            return;
        }
        
        this.loadingResources.add(url);
        
        const img = new Image();
        img.onload = () => {
            this.loadedResources.set(url, img);
            this.loadingResources.delete(url);
            
            // 调用所有回调
            if (this.callbacks.has(url)) {
                this.callbacks.get(url).forEach(cb => cb(null, img));
                this.callbacks.delete(url);
            }
            
            if (callback) callback(null, img);
        };
        
        img.onerror = (err) => {
            this.loadingResources.delete(url);
            
            if (this.callbacks.has(url)) {
                this.callbacks.get(url).forEach(cb => cb(err));
                this.callbacks.delete(url);
            }
            
            if (callback) callback(err);
        };
        
        img.src = url;
    }
    
    // 预加载资源
    preload(urls) {
        return Promise.all(urls.map(url => {
            return new Promise((resolve, reject) => {
                this.lazyLoadImage(url, (err, img) => {
                    if (err) reject(err);
                    else resolve(img);
                });
            });
        }));
    }
    
    // 清理缓存
    clearCache() {
        this.loadedResources.clear();
    }
}

// ==================== 3. 对象池 ====================

class ObjectPool {
    constructor(factory, initialSize = 10) {
        this.factory = factory;
        this.pool = [];
        this.active = new Set();
        
        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }
    
    // 获取对象
    acquire() {
        let obj;
        
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.factory();
        }
        
        this.active.add(obj);
        return obj;
    }
    
    // 释放对象
    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            
            // 如果对象有reset方法，调用它
            if (typeof obj.reset === 'function') {
                obj.reset();
            }
            
            this.pool.push(obj);
        }
    }
    
    // 批量释放
    releaseAll() {
        this.active.forEach(obj => {
            if (typeof obj.reset === 'function') {
                obj.reset();
            }
            this.pool.push(obj);
        });
        this.active.clear();
    }
    
    // 获取池大小
    getPoolSize() {
        return this.pool.length;
    }
    
    // 获取活跃对象数
    getActiveCount() {
        return this.active.size;
    }
}

// ==================== 4. 粒子对象池 ====================

class ParticlePool extends ObjectPool {
    constructor() {
        super(() => ({
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 0,
            size: 0,
            color: '',
            active: false,
            reset() {
                this.active = false;
                this.life = 0;
            }
        }), 50);
    }
    
    // 创建粒子
    create(x, y, options = {}) {
        const particle = this.acquire();
        particle.x = x;
        particle.y = y;
        particle.vx = options.vx || (Math.random() - 0.5) * 2;
        particle.vy = options.vy || (Math.random() - 0.5) * 2;
        particle.life = options.life || 1;
        particle.maxLife = particle.life;
        particle.size = options.size || 3;
        particle.color = options.color || '#FFD700';
        particle.active = true;
        return particle;
    }
    
    // 更新粒子
    update(dt) {
        const toRelease = [];
        
        this.active.forEach(p => {
            if (!p.active) {
                toRelease.push(p);
                return;
            }
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            
            if (p.life <= 0) {
                toRelease.push(p);
            }
        });
        
        toRelease.forEach(p => this.release(p));
    }
}

// ==================== 5. 渲染批处理 ====================

class RenderBatcher {
    constructor(ctx) {
        this.ctx = ctx;
        this.batch = [];
        this.currentType = null;
        this.maxBatchSize = 100;
    }
    
    // 添加绘制任务
    add(type, drawFn) {
        if (this.currentType !== type && this.batch.length > 0) {
            this.flush();
        }
        
        this.currentType = type;
        this.batch.push(drawFn);
        
        if (this.batch.length >= this.maxBatchSize) {
            this.flush();
        }
    }
    
    // 刷新批次
    flush() {
        this.batch.forEach(fn => fn());
        this.batch = [];
        this.currentType = null;
    }
}

// ==================== 6. 离屏渲染 ====================

class OffscreenRenderer {
    constructor(width, height) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.dirty = true;
    }
    
    // 标记需要重绘
    invalidate() {
        this.dirty = true;
    }
    
    // 渲染到离屏canvas
    render(renderFn) {
        if (this.dirty) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            renderFn(this.ctx);
            this.dirty = false;
        }
    }
    
    // 绘制到主canvas
    drawTo(ctx, x, y) {
        ctx.drawImage(this.canvas, x, y);
    }
    
    // 调整大小
    resize(width, height) {
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.invalidate();
        }
    }
}

// ==================== 7. 资源压缩工具 ====================

const ResourceCompressor = {
    // 压缩图片
    async compressImage(img, maxWidth, maxHeight, quality = 0.8) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        // 计算缩放比例
        if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
        }
        
        if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        return canvas.toDataURL('image/jpeg', quality);
    },
    
    // 生成雪碧图数据
    generateSpriteSheet(images, cols) {
        const sizes = images.map(img => ({ w: img.width, h: img.height }));
        const maxW = Math.max(...sizes.map(s => s.w));
        const maxH = Math.max(...sizes.map(s => s.h));
        const rows = Math.ceil(images.length / cols);
        
        const canvas = document.createElement('canvas');
        canvas.width = maxW * cols;
        canvas.height = maxH * rows;
        const ctx = canvas.getContext('2d');
        
        const positions = [];
        
        images.forEach((img, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = col * maxW;
            const y = row * maxH;
            
            ctx.drawImage(img, x, y);
            positions.push({ x, y, w: img.width, h: img.height });
        });
        
        return {
            canvas,
            positions,
            cols,
            rows,
            tileWidth: maxW,
            tileHeight: maxH
        };
    }
};

// ==================== 8. 内存优化 ====================

class MemoryOptimizer {
    constructor() {
        this.caches = new Map();
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB
        this.currentSize = 0;
    }
    
    // 添加缓存
    addCache(name, loader, maxSize = 10 * 1024 * 1024) {
        this.caches.set(name, {
            loader,
            maxSize,
            currentSize: 0,
            items: new Map()
        });
    }
    
    // 获取或加载
    async get(name, key) {
        const cache = this.caches.get(name);
        if (!cache) return null;
        
        if (cache.items.has(key)) {
            return cache.items.get(key);
        }
        
        const item = await cache.loader(key);
        cache.items.set(key, item);
        return item;
    }
    
    // 清理缓存
    clear(name) {
        const cache = this.caches.get(name);
        if (cache) {
            cache.items.clear();
            cache.currentSize = 0;
        }
    }
    
    // 清理所有缓存
    clearAll() {
        this.caches.forEach(cache => {
            cache.items.clear();
            cache.currentSize = 0;
        });
    }
}

// ==================== 9. 帧率控制器 ====================

class FrameRateController {
    constructor(targetFPS = 30) {
        this.targetFPS = targetFPS;
        this.frameInterval = 1000 / targetFPS;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.maxDeltaTime = 100; // 最大delta，防止卡顿
    }
    
    // 是否应该渲染
    shouldRender(currentTime) {
        this.deltaTime = currentTime - this.lastFrameTime;
        
        if (this.deltaTime >= this.frameInterval) {
            this.lastFrameTime = currentTime - (this.deltaTime % this.frameInterval);
            // 限制deltaTime，防止跳帧
            this.deltaTime = Math.min(this.deltaTime, this.maxDeltaTime);
            return true;
        }
        
        return false;
    }
    
    // 获取归一化deltaTime (0-1)
    getNormalizedDelta() {
        return this.deltaTime / this.frameInterval;
    }
}

// ==================== 10. 性能优化管理器 ====================

class PerformanceOptimizer {
    constructor() {
        this.monitor = new PerformanceMonitor();
        this.lazyLoader = new LazyLoader();
        this.memoryOptimizer = new MemoryOptimizer();
        this.frc = new FrameRateController(30);
        this.enabled = {
            objectPool: true,
            renderBatching: true,
            offscreenRender: true,
            lazyLoad: true
        };
    }
    
    // 开始性能监控帧
    beginFrame() {
        this.monitor.beginFrame();
    }
    
    // 结束性能监控帧
    endFrame() {
        return this.monitor.endFrame();
    }
    
    // 获取性能状态
    getPerformanceStatus() {
        return this.monitor.getStatus();
    }
    
    // 检查是否应该渲染
    shouldRender(currentTime) {
        return this.frc.shouldRender(currentTime);
    }
    
    // 获取deltaTime
    getDeltaTime() {
        return this.monitor.metrics.renderTime;
    }
    
    // 启用/禁用优化
    setOptimization(name, enabled) {
        if (name in this.enabled) {
            this.enabled[name] = enabled;
        }
    }
    
    // 获取优化状态
    getOptimizationStatus() {
        return { ...this.enabled };
    }
}

// 创建全局实例
let performanceOptimizer = null;

function getPerformanceOptimizer() {
    if (!performanceOptimizer) {
        performanceOptimizer = new PerformanceOptimizer();
    }
    return performanceOptimizer;
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PerformanceMonitor,
        LazyLoader,
        ObjectPool,
        ParticlePool,
        RenderBatcher,
        OffscreenRenderer,
        ResourceCompressor,
        MemoryOptimizer,
        FrameRateController,
        PerformanceOptimizer,
        getPerformanceOptimizer
    };
}
