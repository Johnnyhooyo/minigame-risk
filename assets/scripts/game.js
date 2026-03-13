/**
 * 探险解谜 - 登录页面逻辑
 * 游戏管理器
 */

// 存储键名
const STORAGE_KEY = {
    PLAYER_NAME: 'adventure_player_name',
    GAME_PROGRESS: 'adventure_game_progress'
};

// 字符验证正则
const CHAR_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;

class GameManager {
    constructor() {
        this.initElements();
        this.initEvents();
        this.checkCachedName();
        this.createStars();
        this.createFireflies();
    }

    initElements() {
        this.nameInput = document.getElementById('nameInput');
        this.startBtn = document.getElementById('startBtn');
        this.errorTip = document.getElementById('errorTip');
        this.welcomeTip = document.getElementById('welcomeTip');
        this.cachedNameSpan = document.getElementById('cachedName');
        this.changeNameSpan = document.getElementById('changeName');
        this.loginPage = document.getElementById('login-page');
        this.gamePage = document.getElementById('gamePage');
        this.playerNameSpan = document.getElementById('playerName');
    }

    initEvents() {
        // 输入框事件
        this.nameInput.addEventListener('input', () => this.onInputChange());
        this.nameInput.addEventListener('focus', () => this.onInputFocus());
        
        // 开始按钮点击
        this.startBtn.addEventListener('click', () => this.onStartGame());
        
        // 切换名字
        this.changeNameSpan.addEventListener('click', () => this.onChangeName());
        
        // 回车键提交
        this.nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.startBtn.disabled) {
                this.onStartGame();
            }
        });
    }

    checkCachedName() {
        const cachedName = localStorage.getItem(STORAGE_KEY.PLAYER_NAME);
        if (cachedName) {
            this.welcomeTip.style.display = 'block';
            this.cachedNameSpan.textContent = cachedName;
            // 自动填充
            this.nameInput.value = cachedName;
            this.validateAndUpdateButton();
        }
    }

    onInputChange() {
        let value = this.nameInput.value;
        
        // 过滤特殊字符
        value = value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
        
        // 首尾空格 trim
        value = value.trim();
        
        if (value !== this.nameInput.value) {
            this.nameInput.value = value;
        }
        
        this.validateAndUpdateButton();
    }

    onInputFocus() {
        this.hideError();
    }

    validateAndUpdateButton() {
        const name = this.nameInput.value.trim();
        const isValid = this.validateName(name);
        
        this.startBtn.disabled = !isValid;
        
        if (name.length > 0 && name.length < 2) {
            this.showError('名字至少2个字符');
        } else if (name.length > 12) {
            this.showError('名字最多12个字符');
        } else {
            this.hideError();
        }
    }

    validateName(name) {
        if (!name || name.length < 2 || name.length > 12) {
            return false;
        }
        
        // 检查是否只包含中文、英文、数字
        for (const char of name) {
            if (!CHAR_REGEX.test(char)) {
                return false;
            }
        }
        
        return true;
    }

    showError(message) {
        this.errorTip.textContent = message;
        this.errorTip.classList.add('show');
    }

    hideError() {
        this.errorTip.classList.remove('show');
    }

    onStartGame() {
        const name = this.nameInput.value.trim();
        
        if (!this.validateName(name)) {
            this.showError('请输入2-12个字符的名字');
            return;
        }
        
        // 保存用户名到本地存储
        localStorage.setItem(STORAGE_KEY.PLAYER_NAME, name);
        
        console.log('Starting game with name:', name);
        
        // 进入游戏
        this.enterGame(name);
    }

    enterGame(name) {
        // 跳转第一关
        console.log('Redirecting to level1.html...');
        window.location.href = 'level1.html';
    }

    onChangeName() {
        this.nameInput.value = '';
        this.welcomeTip.style.display = 'none';
        this.startBtn.disabled = true;
        this.nameInput.focus();
    }

    createStars() {
        const starsContainer = document.getElementById('stars');
        if (!starsContainer) return;

        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.width = Math.random() * 3 + 1 + 'px';
            star.style.height = star.style.width;
            star.style.animationDelay = Math.random() * 2 + 's';
            star.style.animationDuration = (Math.random() * 2 + 1) + 's';
            starsContainer.appendChild(star);
        }
    }

    createFireflies() {
        const container = document.getElementById('game-container');
        if (!container) return;

        for (let i = 0; i < 8; i++) {
            const firefly = document.createElement('div');
            firefly.className = 'firefly';
            firefly.style.left = Math.random() * 100 + '%';
            firefly.style.top = Math.random() * 100 + '%';
            firefly.style.animationDelay = Math.random() * 6 + 's';
            firefly.style.animationDuration = (Math.random() * 4 + 4) + 's';
            container.appendChild(firefly);
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new GameManager();
});
