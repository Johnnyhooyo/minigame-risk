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
    private nameInput: HTMLInputElement;
    private startBtn: HTMLButtonElement;
    private errorTip: HTMLElement;
    private welcomeTip: HTMLElement;
    private cachedNameSpan: HTMLElement;
    private changeNameSpan: HTMLElement;
    private loginPage: HTMLElement;
    private gamePage: HTMLElement;
    private playerNameSpan: HTMLElement;

    constructor() {
        this.initElements();
        this.initEvents();
        this.checkCachedName();
        this.createStars();
        this.createFireflies();
    }

    private initElements(): void {
        this.nameInput = document.getElementById('nameInput') as HTMLInputElement;
        this.startBtn = document.getElementById('startBtn') as HTMLButtonElement;
        this.errorTip = document.getElementById('errorTip') as HTMLElement;
        this.welcomeTip = document.getElementById('welcomeTip') as HTMLElement;
        this.cachedNameSpan = document.getElementById('cachedName') as HTMLElement;
        this.changeNameSpan = document.getElementById('changeName') as HTMLElement;
        this.loginPage = document.getElementById('login-page') as HTMLElement;
        this.gamePage = document.getElementById('gamePage') as HTMLElement;
        this.playerNameSpan = document.getElementById('playerName') as HTMLElement;
    }

    private initEvents(): void {
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

    private checkCachedName(): void {
        const cachedName = localStorage.getItem(STORAGE_KEY.PLAYER_NAME);
        if (cachedName) {
            this.welcomeTip.style.display = 'block';
            this.cachedNameSpan.textContent = cachedName;
            // 自动填充
            this.nameInput.value = cachedName;
            this.validateAndUpdateButton();
        }
    }

    private onInputChange(): void {
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

    private onInputFocus(): void {
        this.hideError();
    }

    private validateAndUpdateButton(): void {
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

    private validateName(name: string): boolean {
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

    private showError(message: string): void {
        this.errorTip.textContent = message;
        this.errorTip.classList.add('show');
    }

    private hideError(): void {
        this.errorTip.classList.remove('show');
    }

    private onStartGame(): void {
        const name = this.nameInput.value.trim();
        
        if (!this.validateName(name)) {
            this.showError('请输入2-12个字符的名字');
            return;
        }
        
        // 保存用户名到本地存储
        localStorage.setItem(STORAGE_KEY.PLAYER_NAME, name);
        
        // 进入游戏
        this.enterGame(name);
    }

    private enterGame(name: string): void {
        this.playerNameSpan.textContent = name;
        this.loginPage.style.display = 'none';
        this.gamePage.classList.add('show');
        
        console.log(`🎮 玩家 "${name}" 开始探险！`);
    }

    private onChangeName(): void {
        this.nameInput.value = '';
        this.welcomeTip.style.display = 'none';
        this.startBtn.disabled = true;
        this.nameInput.focus();
    }

    private createStars(): void {
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

    private createFireflies(): void {
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
