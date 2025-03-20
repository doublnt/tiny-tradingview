import { ISeriesApi, LineData } from 'lightweight-charts';
import { PineScript, PineType, Expression, Statement, builtInFunctions, builtInVariables } from './pineScriptGrammar';

interface PineScriptIndicator {
    name: string;
    type: 'line' | 'candlestick';
    data: LineData[];
    color: string;
    overlay: boolean;
}

export class PineScriptParser {
    private static instance: PineScriptParser;
    private indicators: Map<string, PineScriptIndicator> = new Map();
    private variables: Map<string, any> = new Map();
    private functions: Map<string, Function> = new Map();
    private colorMap: Record<string, string> = {
        'color.blue': '#2962FF',
        'color.red': '#FF4136',
        'color.green': '#2ECC40',
        'color.yellow': '#FFDC00',
        'color.purple': '#B10DC9',
        'color.orange': '#FF851B',
        'color.black': '#111111',
        'color.white': '#FFFFFF',
    };

    private constructor() {
        this.initializeBuiltInFunctions();
    }

    static getInstance(): PineScriptParser {
        if (!PineScriptParser.instance) {
            PineScriptParser.instance = new PineScriptParser();
        }
        return PineScriptParser.instance;
    }

    private initializeBuiltInFunctions() {
        // Initialize built-in functions
        this.functions.set('ta.sma', this.calculateSMA.bind(this));
        this.functions.set('ta.ema', this.calculateEMA.bind(this));
        // Add more built-in functions here
    }

    parseScript(script: string, candlestickData: any[]): PineScriptIndicator[] {
        try {
            console.log("Parsing Pine Script...");
            const lines = script.split('\n').filter(line => line.trim() !== '');
            const parsedScript = this.parseScriptStructure(lines);
            return this.executeScript(parsedScript, candlestickData);
        } catch (error) {
            console.error('Error parsing Pine Script:', error);
            throw error;
        }
    }

    private parseScriptStructure(lines: string[]): PineScript {
        const script: PineScript = {
            version: '',
            main: []
        };

        let currentSection = 'main';
        let currentFunction: any = null;

        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('//')) {
                continue;
            }

            // Parse version
            if (trimmedLine.startsWith('//@version=')) {
                script.version = trimmedLine.split('=')[1];
                continue;
            }

            // Parse indicator declaration
            if (trimmedLine.includes('indicator(')) {
                const match = trimmedLine.match(/indicator\("([^"]+)",\s*overlay=(\w+)\)/);
                if (match) {
                    script.main.push({
                        type: 'indicator',
                        content: {
                            name: match[1],
                            overlay: match[2] === 'true'
                        }
                    });
                }
                continue;
            }

            // Parse inputs
            if (trimmedLine.startsWith('input.')) {
                const input = this.parseInput(trimmedLine);
                if (input) {
                    if (!script.inputs) script.inputs = [];
                    script.inputs.push(input);
                }
                continue;
            }

            // Parse variable declarations
            if (this.isVariableDeclaration(trimmedLine)) {
                const variable = this.parseVariableDeclaration(trimmedLine);
                if (variable) {
                    if (!script.variables) script.variables = [];
                    script.variables.push(variable);
                }
                continue;
            }

            // Parse function declarations
            if (trimmedLine.startsWith('method')) {
                currentFunction = this.parseFunctionDeclaration(trimmedLine);
                if (currentFunction) {
                    if (!script.functions) script.functions = [];
                    script.functions.push(currentFunction);
                }
                continue;
            }

            // Parse plot statements
            if (trimmedLine.startsWith('plot(')) {
                const plot = this.parsePlotStatement(trimmedLine);
                if (plot) {
                    script.main.push({
                        type: 'plot',
                        content: plot
                    });
                }
                continue;
            }

            // Add other statement types here
        }

        return script;
    }

    private parseInput(line: string): any {
        const match = line.match(/input\.(\w+)\s*=\s*([^,]+)(?:,\s*([^,]+))?/);
        if (match) {
            return {
                name: match[1],
                type: this.inferType(match[2]),
                defaultValue: this.parseValue(match[2]),
                options: match[3] ? this.parseOptions(match[3]) : undefined
            };
        }
        return null;
    }

    private parseVariableDeclaration(line: string): any {
        const match = line.match(/(\w+)\s*=\s*(.+)/);
        if (match) {
            return {
                name: match[1],
                type: this.inferType(match[2]),
                value: this.parseExpression(match[2])
            };
        }
        return null;
    }

    private parseFunctionDeclaration(line: string): any {
        const match = line.match(/method\s+(\w+)\s*\((.*)\)\s*=>\s*(.+)/);
        if (match) {
            return {
                name: match[1],
                parameters: this.parseParameters(match[2]),
                returnType: this.inferType(match[3]),
                body: this.parseFunctionBody(match[3])
            };
        }
        return null;
    }

    private parsePlotStatement(line: string): any {
        const match = line.match(/plot\(([^,]+),\s*color=([^,]+),\s*title="([^"]+)"\)/);
        if (match) {
            return {
                expression: this.parseExpression(match[1]),
                color: this.parseColor(match[2]),
                title: match[3]
            };
        }
        return null;
    }

    private parseExpression(expr: string): Expression {
        // Handle function calls
        if (expr.includes('(')) {
            const match = expr.match(/(\w+\.?\w*)\s*\((.*)\)/);
            if (match) {
                return {
                    type: 'functionCall',
                    value: match[1],
                    children: match[2].split(',').map(arg => this.parseExpression(arg.trim()))
                };
            }
        }

        // Handle operators
        const operators = ['+', '-', '*', '/', '%', '^', '>', '<', '>=', '<=', '==', '!=', 'and', 'or', 'not'];
        for (const op of operators) {
            if (expr.includes(op)) {
                const parts = expr.split(op).map(p => p.trim());
                return {
                    type: 'operator',
                    value: op,
                    children: parts.map(p => this.parseExpression(p))
                };
            }
        }

        // Handle variables and literals
        if (this.isVariable(expr)) {
            return {
                type: 'variable',
                value: expr
            };
        }

        return {
            type: 'literal',
            value: this.parseValue(expr)
        };
    }

    private parseValue(value: string): any {
        // Parse numbers
        if (!isNaN(Number(value))) {
            return Number(value);
        }

        // Parse booleans
        if (value === 'true' || value === 'false') {
            return value === 'true';
        }

        // Parse strings
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }

        return value;
    }

    private parseColor(color: string): string {
        return this.colorMap[color.trim()] || color.trim();
    }

    private parseParameters(params: string): any[] {
        return params.split(',').map(param => {
            const [name, type] = param.trim().split(':');
            return {
                name: name.trim(),
                type: type ? type.trim() as PineType : this.inferType(name)
            };
        });
    }

    private parseFunctionBody(body: string): Statement[] {
        // Simple implementation - can be expanded
        return [{
            type: 'assignment',
            content: this.parseExpression(body)
        }];
    }

    private parseOptions(options: string): any[] {
        return options.split('|').map(opt => this.parseValue(opt.trim()));
    }

    private inferType(value: string): PineType {
        if (!isNaN(Number(value))) {
            return Number(value) % 1 === 0 ? 'int' : 'float';
        }
        if (value === 'true' || value === 'false') {
            return 'bool';
        }
        if (value.startsWith('"') && value.endsWith('"')) {
            return 'string';
        }
        if (value.startsWith('color.')) {
            return 'color';
        }
        return 'series';
    }

    private isVariable(value: string): boolean {
        return builtInVariables.some(v => v.name === value) || this.variables.has(value);
    }

    private isVariableDeclaration(line: string): boolean {
        return /^\w+\s*=\s*/.test(line);
    }

    private executeScript(script: PineScript, candlestickData: any[]): PineScriptIndicator[] {
        const indicators: PineScriptIndicator[] = [];

        // Initialize variables
        if (script.variables) {
            for (const variable of script.variables) {
                this.variables.set(variable.name, this.evaluateExpression(variable.value, candlestickData));
            }
        }

        // Execute main statements
        for (const statement of script.main) {
            if (statement.type === 'plot') {
                const plotData = this.evaluateExpression(statement.content.expression, candlestickData);
                if (Array.isArray(plotData)) {
                    indicators.push({
                        name: statement.content.title,
                        type: 'line',
                        data: plotData,
                        color: statement.content.color,
                        overlay: true
                    });
                }
            }
        }

        return indicators;
    }

    private evaluateExpression(expr: Expression, candlestickData: any[]): any {
        switch (expr.type) {
            case 'literal':
                return expr.value;
            case 'variable':
                return this.variables.get(expr.value) || this.getBuiltInVariable(expr.value, candlestickData);
            case 'functionCall':
                const func = this.functions.get(expr.value);
                if (func) {
                    const args = expr.children?.map(child => this.evaluateExpression(child, candlestickData)) || [];
                    return func(...args);
                }
                throw new Error(`Unknown function: ${expr.value}`);
            case 'operator':
                return this.evaluateOperator(expr.value, expr.children?.map(child => this.evaluateExpression(child, candlestickData)) || []);
            default:
                throw new Error(`Unknown expression type: ${expr.type}`);
        }
    }

    private getBuiltInVariable(name: string, candlestickData: any[]): any {
        switch (name) {
            case 'close':
                return candlestickData.map(d => d.close);
            case 'open':
                return candlestickData.map(d => d.open);
            case 'high':
                return candlestickData.map(d => d.high);
            case 'low':
                return candlestickData.map(d => d.low);
            case 'volume':
                return candlestickData.map(d => d.volume);
            default:
                throw new Error(`Unknown built-in variable: ${name}`);
        }
    }

    private evaluateOperator(operator: string, operands: any[]): any {
        switch (operator) {
            case '+':
                return operands[0] + operands[1];
            case '-':
                return operands[0] - operands[1];
            case '*':
                return operands[0] * operands[1];
            case '/':
                return operands[0] / operands[1];
            case '%':
                return operands[0] % operands[1];
            case '^':
                return Math.pow(operands[0], operands[1]);
            case '>':
                return operands[0] > operands[1];
            case '<':
                return operands[0] < operands[1];
            case '>=':
                return operands[0] >= operands[1];
            case '<=':
                return operands[0] <= operands[1];
            case '==':
                return operands[0] === operands[1];
            case '!=':
                return operands[0] !== operands[1];
            case 'and':
                return operands[0] && operands[1];
            case 'or':
                return operands[0] || operands[1];
            case 'not':
                return !operands[0];
            default:
                throw new Error(`Unknown operator: ${operator}`);
        }
    }

    private calculateSMA(source: number[], period: number): LineData[] {
        const result: LineData[] = [];
        for (let i = period - 1; i < source.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += source[i - j];
            }
            result.push({
                time: i.toString(),
                value: sum / period
            });
        }
        return result;
    }

    private calculateEMA(source: number[], period: number): LineData[] {
        const result: LineData[] = [];
        const multiplier = 2 / (period + 1);
        let ema = source[0];

        result.push({
            time: '0',
            value: ema
        });

        for (let i = 1; i < source.length; i++) {
            ema = (source[i] - ema) * multiplier + ema;
            result.push({
                time: i.toString(),
                value: ema
            });
        }

        return result;
    }

    addIndicator(indicator: PineScriptIndicator) {
        this.indicators.set(indicator.name, indicator);
    }

    removeIndicator(name: string) {
        this.indicators.delete(name);
    }

    clearIndicators() {
        this.indicators.clear();
    }

    getIndicators(): PineScriptIndicator[] {
        return Array.from(this.indicators.values());
    }
} 