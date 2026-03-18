// ============================================
// 音效系统 v1.0
// T3.2 音效与背景音乐
// ============================================

class AudioManager {
    constructor() {
        this.bgm = null;
        this.bgmVolume = 0.5;
        this.sfxVolume = 0.7;
        this.muted = false;
        this.bgmPlaying = false;
        
        // 音效缓存
        this.sounds = {};
        
        // 音频格式支持检测
        this.supportedFormats = this.detectFormats();
        
        // 初始化
        this.init();
    }
    
    detectFormats() {
        const audio = new Audio();
        return {
            mp3: audio.canPlayType('audio/mpeg'),
            ogg: audio.canPlayType('audio/ogg'),
            wav: audio.canPlayType('audio/wav')
        };
    }
    
    init() {
        // 创建背景音乐元素
        this.bgm = new Audio();
        this.bgm.loop = true;
        this.bgm.volume = this.bgmVolume;
        
        // 预加载音效
        this.preloadSounds();
    }
    
    preloadSounds() {
        // 音效文件定义 (需要实际音频文件)
        const soundDefinitions = {
            footstep: { src: 'assets/audio/sfx_footstep.mp3', duration: 0.3 },
            pickup: { src: 'assets/audio/sfx_pickup.mp3', duration: 0.5 },
            click: { src: 'assets/audio/sfx_click.mp3', duration: 0.1 },
            dialogue: { src: 'assets/audio/sfx_dialogue.mp3', duration: 0.2 },
            puzzle: { src: 'assets/audio/sfx_puzzle.mp3', duration: 1.0 },
            victory: { src: 'assets/audio/sfx_victory.mp3', duration: 3.0 },
            error: { src: 'assets/audio/sfx_error.mp3', duration: 0.3 }
        };
        
        for (const [name, def] of Object.entries(soundDefinitions)) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = def.src;
            this.sounds[name] = {
                element: audio,
                duration: def.duration,
                loaded: false
            };
            
            // 监听加载完成
            audio.addEventListener('canplaythrough', () => {
                this.sounds[name].loaded = true;
            }, { once: true });
        }
    }
    
    // 播放背景音乐
    playBGM(src) {
        if (this.muted) return;
        
        if (src) {
            this.bgm.src = src;
        }
        
        this.bgm.volume = this.bgmVolume;
        this.bgm.play().then(() => {
            this.bgmPlaying = true;
        }).catch(err => {
            console.log('BGM autoplay prevented:', err);
        });
    }
    
    // 停止背景音乐
    stopBGM() {
        this.bgm.pause();
        this.bgmPlaying = false;
    }
    
    // 暂停背景音乐
    pauseBGM() {
        this.bgm.pause();
        this.bgmPlaying = false;
    }
    
    // 继续播放背景音乐
    resumeBGM() {
        if (this.muted) return;
        this.bgm.play().then(() => {
            this.bgmPlaying = true;
        });
    }
    
    // 播放音效
    playSFX(name) {
        if (this.muted) return null;
        
        const sound = this.sounds[name];
        if (!sound) {
            console.warn(`Sound "${name}" not found`);
            return null;
        }
        
        // 克隆音频以支持重叠播放
        const clone = sound.element.cloneNode();
        clone.volume = this.sfxVolume;
        clone.play().catch(err => {
            console.log('SFX autoplay prevented:', err);
        });
        
        return clone;
    }
    
    // 播放脚步声
    playFootstep() {
        return this.playSFX('footstep');
    }
    
    // 播放拾取音
    playPickup() {
        return this.playSFX('pickup');
    }
    
    // 播放点击音
    playClick() {
        return this.playSFX('click');
    }
    
    // 播放对话弹出音
    playDialogue() {
        return this.playSFX('dialogue');
    }
    
    // 播放解谜音效
    playPuzzle() {
        return this.playSFX('puzzle');
    }
    
    // 播放胜利音效
    playVictory() {
        return this.playSFX('victory');
    }
    
    // 播放错误提示音
    playError() {
        return this.playSFX('error');
    }
    
    // 设置BGM音量
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        this.bgm.volume = this.bgmVolume;
    }
    
    // 设置音效音量
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
    
    // 静音切换
    toggleMute() {
        this.muted = !this.muted;
        this.bgm.muted = this.muted;
        return this.muted;
    }
    
    // 设置静音
    setMute(muted) {
        this.muted = muted;
        this.bgm.muted = muted;
    }
    
    // 获取当前音量状态
    getVolumeState() {
        return {
            bgm: this.bgmVolume,
            sfx: this.sfxVolume,
            muted: this.muted,
            bgmPlaying: this.bgmPlaying
        };
    }
    
    // 生成音效的Web Audio API版本 (备用)
    createSFXWithWebAudio(type) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // 根据类型设置不同的音效
            switch(type) {
                case 'footstep':
                    oscillator.frequency.value = 100 + Math.random() * 50;
                    oscillator.type = 'triangle';
                    gainNode.gain.value = 0.1;
                    break;
                case 'pickup':
                    oscillator.frequency.value = 600;
                    oscillator.type = 'sine';
                    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
                    gainNode.gain.value = 0.2;
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                    break;
                case 'click':
                    oscillator.frequency.value = 800;
                    oscillator.type = 'square';
                    gainNode.gain.value = 0.1;
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                    break;
                case 'dialogue':
                    oscillator.frequency.value = 400;
                    oscillator.type = 'sine';
                    gainNode.gain.value = 0.15;
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
                    break;
                case 'puzzle':
                    oscillator.frequency.value = 523.25; // C5
                    oscillator.type = 'sine';
                    gainNode.gain.value = 0.2;
                    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
                    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
                    oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                    break;
                case 'victory':
                    oscillator.frequency.value = 523.25;
                    oscillator.type = 'sine';
                    gainNode.gain.value = 0.2;
                    // 上升音阶
                    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
                    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15);
                    oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3);
                    oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.45);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);
                    break;
                case 'error':
                    oscillator.frequency.value = 200;
                    oscillator.type = 'sawtooth';
                    gainNode.gain.value = 0.1;
                    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                    break;
                default:
                    oscillator.frequency.value = 440;
                    oscillator.type = 'sine';
                    gainNode.gain.value = 0.1;
            }
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + (type === 'victory' ? 1.0 : 0.3));
            
            return true;
        } catch(e) {
            console.warn('Web Audio API not supported:', e);
            return false;
        }
    }
}

// 创建全局音频管理器实例
let audioManager = null;

// 初始化音频管理器
function initAudio() {
    if (!audioManager) {
        audioManager = new AudioManager();
    }
    return audioManager;
}

// 获取音频管理器
function getAudioManager() {
    return audioManager;
}

// 播放背景音乐
function playBGM(src) {
    if (!audioManager) initAudio();
    audioManager.playBGM(src);
}

// 播放脚步声
function playFootstep() {
    if (!audioManager) initAudio();
    // 优先使用Web Audio API生成音效
    if (!audioManager.createSFXWithWebAudio('footstep')) {
        audioManager.playFootstep();
    }
}

// 播放拾取音
function playPickup() {
    if (!audioManager) initAudio();
    if (!audioManager.createSFXWithWebAudio('pickup')) {
        audioManager.playPickup();
    }
}

// 播放点击音
function playClick() {
    if (!audioManager) initAudio();
    if (!audioManager.createSFXWithWebAudio('click')) {
        audioManager.playClick();
    }
}

// 播放对话弹出音
function playDialogue() {
    if (!audioManager) initAudio();
    if (!audioManager.createSFXWithWebAudio('dialogue')) {
        audioManager.playDialogue();
    }
}

// 播放解谜音效
function playPuzzle() {
    if (!audioManager) initAudio();
    if (!audioManager.createSFXWithWebAudio('puzzle')) {
        audioManager.playPuzzle();
    }
}

// 播放胜利音效
function playVictory() {
    if (!audioManager) initAudio();
    if (!audioManager.createSFXWithWebAudio('victory')) {
        audioManager.playVictory();
    }
}

// 播放错误提示音
function playError() {
    if (!audioManager) initAudio();
    if (!audioManager.createSFXWithWebAudio('error')) {
        audioManager.playError();
    }
}

// 静音切换
function toggleMute() {
    if (!audioManager) initAudio();
    return audioManager.toggleMute();
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        AudioManager, 
        initAudio, getAudioManager,
        playBGM, playFootstep, playPickup, playClick,
        playDialogue, playPuzzle, playVictory, playError,
        toggleMute
    };
}
