// Pine Script Grammar Definition

// Basic Types
export type PineType = 'float' | 'int' | 'bool' | 'string' | 'color' | 'series' | 'array' | 'matrix';

// Built-in Functions
export interface PineFunction {
    name: string;
    returnType: PineType;
    parameters: {
        name: string;
        type: PineType;
        optional?: boolean;
    }[];
    description: string;
}

// Built-in Variables
export interface PineVariable {
    name: string;
    type: PineType;
    description: string;
}

// Operator Types
export type Operator = 
    | '+' | '-' | '*' | '/' | '%' | '^'  // Arithmetic
    | '>' | '<' | '>=' | '<=' | '==' | '!='  // Comparison
    | 'and' | 'or' | 'not'  // Logical
    | '=' | '+=' | '-=' | '*=' | '/=' | '%=';  // Assignment

// Expression Types
export interface Expression {
    type: 'literal' | 'variable' | 'functionCall' | 'operator' | 'conditional';
    value: any;
    children?: Expression[];
}

// Statement Types
export interface Statement {
    type: 'variableDeclaration' | 'assignment' | 'if' | 'for' | 'while' | 'plot' | 'strategy' | 'indicator';
    content: any;
}

// Script Structure
export interface PineScript {
    version: string;
    description?: string;
    inputs?: {
        name: string;
        type: PineType;
        defaultValue?: any;
        options?: any[];
    }[];
    variables?: {
        name: string;
        type: PineType;
        value: Expression;
    }[];
    functions?: {
        name: string;
        parameters: {
            name: string;
            type: PineType;
        }[];
        returnType: PineType;
        body: Statement[];
    }[];
    main: Statement[];
}

// Built-in Functions Definition
export const builtInFunctions: PineFunction[] = [
    {
        name: 'ta.sma',
        returnType: 'series',
        parameters: [
            { name: 'source', type: 'series' },
            { name: 'length', type: 'int' }
        ],
        description: 'Simple Moving Average'
    },
    {
        name: 'ta.ema',
        returnType: 'series',
        parameters: [
            { name: 'source', type: 'series' },
            { name: 'length', type: 'int' }
        ],
        description: 'Exponential Moving Average'
    },
    // Add more built-in functions here
];

// Built-in Variables Definition
export const builtInVariables: PineVariable[] = [
    {
        name: 'close',
        type: 'series',
        description: 'Close price'
    },
    {
        name: 'open',
        type: 'series',
        description: 'Open price'
    },
    {
        name: 'high',
        type: 'series',
        description: 'High price'
    },
    {
        name: 'low',
        type: 'series',
        description: 'Low price'
    },
    {
        name: 'volume',
        type: 'series',
        description: 'Volume'
    },
    // Add more built-in variables here
]; 