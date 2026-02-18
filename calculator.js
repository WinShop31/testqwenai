// ===== Calculator Logic =====
class Calculator {
    constructor() {
        this.display = document.getElementById('display');
        this.expressionDisplay = document.getElementById('expression');
        this.historyList = document.getElementById('history-list');
        this.clearHistoryBtn = document.getElementById('clear-history');
        
        this.currentValue = '0';
        this.previousValue = null;
        this.operator = null;
        this.expression = '';
        this.shouldResetDisplay = false;
        this.history = [];
        
        this.init();
    }
    
    init() {
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', () => this.handleKey(key));
        });
        
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        this.loadHistory();
        this.updateDisplay();
    }
    
    handleKey(key) {
        const action = key.dataset.action;
        const value = key.dataset.value;
        
        this.animateKey(key);
        
        switch (action) {
            case 'number':
                this.inputNumber(value);
                break;
            case 'operator':
                this.inputOperator(value);
                break;
            case 'decimal':
                this.inputDecimal();
                break;
            case 'clear':
                this.clear();
                break;
            case 'delete':
                this.delete();
                break;
            case 'percent':
                this.percent();
                break;
            case 'calculate':
                this.calculate();
                break;
        }
    }
    
    animateKey(key) {
        key.style.transform = 'scale(0.95)';
        setTimeout(() => {
            key.style.transform = '';
        }, 100);
    }
    
    inputNumber(num) {
        if (this.shouldResetDisplay) {
            this.currentValue = num;
            this.shouldResetDisplay = false;
        } else {
            this.currentValue = this.currentValue === '0' ? num : this.currentValue + num;
        }
        this.updateDisplay();
    }
    
    inputDecimal() {
        if (this.shouldResetDisplay) {
            this.currentValue = '0.';
            this.shouldResetDisplay = false;
        } else if (!this.currentValue.includes('.')) {
            this.currentValue += '.';
        }
        this.updateDisplay();
    }
    
    inputOperator(op) {
        if (this.operator && !this.shouldResetDisplay) {
            this.calculate(false);
        }
        
        this.previousValue = this.currentValue;
        this.operator = op;
        this.expression = `${this.formatDisplayValue(this.previousValue)} ${this.getOperatorSymbol(op)}`;
        this.expressionDisplay.textContent = this.expression;
        this.shouldResetDisplay = true;
    }
    
    getOperatorSymbol(op) {
        const symbols = {
            '/': '÷',
            '*': '×',
            '-': '−',
            '+': '+'
        };
        return symbols[op] || op;
    }
    
    calculate(saveToHistory = true) {
        if (!this.operator || this.previousValue === null) return;
        
        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);
        let result;
        
        switch (this.operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    this.showError();
                    return;
                }
                result = prev / current;
                break;
            default:
                return;
        }
        
        const fullExpression = `${this.expression} ${this.formatDisplayValue(this.currentValue)}`;
        
        result = Math.round(result * 1000000000) / 1000000000;
        this.currentValue = result.toString();
        
        if (saveToHistory) {
            this.addToHistory(fullExpression, this.currentValue);
        }
        
        this.expression = '';
        this.expressionDisplay.textContent = '';
        this.previousValue = null;
        this.operator = null;
        this.shouldResetDisplay = true;
        
        this.updateDisplay();
    }
    
    clear() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operator = null;
        this.expression = '';
        this.expressionDisplay.textContent = '';
        this.shouldResetDisplay = false;
        this.updateDisplay();
    }
    
    delete() {
        if (this.currentValue.length === 1 || (this.currentValue.length === 2 && this.currentValue[0] === '-')) {
            this.currentValue = '0';
        } else {
            this.currentValue = this.currentValue.slice(0, -1);
        }
        this.updateDisplay();
    }
    
    percent() {
        const value = parseFloat(this.currentValue);
        this.currentValue = (value / 100).toString();
        this.updateDisplay();
    }
    
    showError() {
        this.currentValue = 'Error';
        this.updateDisplay();
        this.shouldResetDisplay = true;
    }
    
    formatDisplayValue(value) {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        
        if (value.includes('.') && !value.endsWith('.')) {
            const parts = value.split('.');
            return parseFloat(parts[0]).toLocaleString() + '.' + parts[1];
        } else if (value.endsWith('.')) {
            return parseFloat(value).toLocaleString() + '.';
        }
        
        return num.toLocaleString();
    }
    
    updateDisplay() {
        let displayValue = this.currentValue;
        
        if (this.currentValue !== 'Error') {
            const num = parseFloat(this.currentValue);
            if (!isNaN(num)) {
                displayValue = this.formatDisplayValue(this.currentValue);
            }
        }
        
        this.display.textContent = displayValue;
        
        if (displayValue.length > 12) {
            this.display.classList.add('small');
        } else {
            this.display.classList.remove('small');
        }
    }
    
    // ===== History Functions =====
    addToHistory(expression, result) {
        const item = { expression, result, timestamp: Date.now() };
        this.history.unshift(item);
        
        if (this.history.length > 50) {
            this.history.pop();
        }
        
        this.saveHistory();
        this.renderHistory();
    }
    
    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p class="history-empty">История пуста</p>';
            return;
        }
        
        this.historyList.innerHTML = this.history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <span class="history-expression">${this.escapeHtml(item.expression)}</span>
                <span class="history-result">= ${this.formatDisplayValue(item.result)}</span>
            </div>
        `).join('');
        
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.loadHistoryItem(index);
            });
        });
    }
    
    loadHistoryItem(index) {
        const item = this.history[index];
        if (item) {
            this.currentValue = item.result.toString();
            this.updateDisplay();
        }
    }
    
    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }
    
    saveHistory() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('calculatorHistory');
        if (saved) {
            this.history = JSON.parse(saved);
            this.renderHistory();
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ===== Keyboard Support =====
    handleKeyboard(e) {
        const key = e.key;
        
        if (key >= '0' && key <= '9') {
            this.inputNumber(key);
            this.highlightKey(`[data-action="number"][data-value="${key}"]`);
        } else if (key === '.') {
            this.inputDecimal();
            this.highlightKey('[data-action="decimal"]');
        } else if (key === '+' || key === '-' || key === '*' || key === '/') {
            this.inputOperator(key);
            this.highlightKey(`[data-action="operator"][data-value="${key}"]`);
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            this.calculate();
            this.highlightKey('[data-action="calculate"]');
        } else if (key === 'Escape' || key === 'c' || key === 'C') {
            this.clear();
            this.highlightKey('[data-action="clear"]');
        } else if (key === 'Backspace') {
            this.delete();
            this.highlightKey('[data-action="delete"]');
        } else if (key === '%') {
            this.percent();
            this.highlightKey('[data-action="percent"]');
        }
    }
    
    highlightKey(selector) {
        const key = document.querySelector(selector);
        if (key) {
            this.animateKey(key);
        }
    }
}

// ===== Initialize Calculator =====
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
