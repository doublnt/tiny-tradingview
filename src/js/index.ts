import { createChart, IChartApi, ISeriesApi, CandlestickData, CandlestickSeries, LineSeries, Time } from 'lightweight-charts';
import { PineScriptParser } from './pineScriptParser';

// Generate 10 years of daily candlestick data
function generateCandlestickData(startYear: number, endYear: number): CandlestickData[] {
    const data: CandlestickData[] = [];
    let currentPrice = 100; // Starting price
    const volatility = 2; // Price volatility factor

    for (let year = startYear; year <= endYear; year++) {
        for (let month = 1; month <= 12; month++) {
            const daysInMonth = new Date(year, month, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                // Generate random price movement
                const open = currentPrice;
                const close = open + (Math.random() - 0.5) * volatility;
                const high = Math.max(open, close) + Math.random() * volatility;
                const low = Math.min(open, close) - Math.random() * volatility;

                // Update current price for next iteration
                currentPrice = close;

                // Format date as YYYY-MM-DD
                const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                data.push({
                    time: date,
                    open: open,
                    high: high,
                    low: low,
                    close: close
                });
            }
        }
    }

    console.log(`Generated ${data.length} candlestick data points from ${startYear} to ${endYear}`);
    return data;
}

// Calculate SMA for the data
function calculateSMA(data: CandlestickData[], period: number): { time: Time; value: number }[] {
    const result: { time: Time; value: number }[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        result.push({
            time: data[i].time,
            value: sum / period
        });
    }
    
    return result;
}

// Generate 10 years of data (2014-2024)
const candlestickData = generateCandlestickData(2024, 2025);

// Calculate SMAs
const sma20Data = calculateSMA(candlestickData, 20);
const sma50Data = calculateSMA(candlestickData, 50);
const sma200Data = calculateSMA(candlestickData, 200);

class TradingChart {
    private chart: IChartApi;
    private candlestickSeries: ISeriesApi<'Candlestick'>;
    private indicatorSeries: Map<string, ISeriesApi<'Line'>> = new Map();
    private container: HTMLElement;
    private pineScriptParser: PineScriptParser;

    constructor(containerId: string) {
        this.container = document.getElementById(containerId) as HTMLElement;
        if (!this.container) {
            throw new Error('Container not found');
        }

        this.pineScriptParser = PineScriptParser.getInstance();

        // Create chart
        this.chart = createChart(this.container, {
            layout: {
                background: { color: '#131722' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: '#363a45' },
                horzLines: { color: '#363a45' },
            },
            width: this.container.clientWidth,
            height: this.container.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        // Create candlestick series
        this.candlestickSeries = this.chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        console.log(`Setting ${candlestickData.length} candlestick data points`);
        
        // Set data
        this.candlestickSeries.setData(candlestickData);

        // Add SMA lines directly
        this.addBuiltInIndicators();
        
        // Fit content to show all data
        this.chart.timeScale().fitContent();

        // Handle resize
        window.addEventListener('resize', () => {
            this.chart.applyOptions({
                width: this.container.clientWidth,
                height: this.container.clientHeight,
            });
        });

        // Initialize UI event handlers
        this.initializeUIHandlers();

        // Run the default script on load
        setTimeout(() => {
            const editor = document.getElementById('pine-editor') as HTMLTextAreaElement;
            if (editor) {
                console.log("Running initial Pine Script...");
                this.runPineScript(editor.value);
            }
        }, 1000);
    }

    private addBuiltInIndicators() {
        // Add SMA 20
        const sma20Series = this.chart.addSeries(LineSeries, {
            color: '#2962FF',
            lineWidth: 2,
            title: 'SMA 20',
            lastValueVisible: true,
            priceLineVisible: true,
        });
        sma20Series.setData(sma20Data);
        this.indicatorSeries.set('SMA 20', sma20Series);
        
        // Add SMA 50
        const sma50Series = this.chart.addSeries(LineSeries, {
            color: '#2ECC40',
            lineWidth: 2,
            title: 'SMA 50',
            lastValueVisible: true,
            priceLineVisible: true,
        });
        sma50Series.setData(sma50Data);
        this.indicatorSeries.set('SMA 50', sma50Series);
        
        // Add SMA 200
        const sma200Series = this.chart.addSeries(LineSeries, {
            color: '#FF4136',
            lineWidth: 2,
            title: 'SMA 200',
            lastValueVisible: true,
            priceLineVisible: true,
        });
        sma200Series.setData(sma200Data);
        this.indicatorSeries.set('SMA 200', sma200Series);
        
        console.log("Built-in indicators added successfully");
    }

    private initializeUIHandlers() {
        const runButton = document.getElementById('run-script') as HTMLButtonElement;
        const clearButton = document.getElementById('clear-indicators') as HTMLButtonElement;
        const saveButton = document.getElementById('save-script') as HTMLButtonElement;
        const editor = document.getElementById('pine-editor') as HTMLTextAreaElement;
        const errorMessage = document.getElementById('error-message') as HTMLDivElement;

        if (runButton) {
            runButton.addEventListener('click', () => {
                try {
                    console.log("Run button clicked");
                    this.runPineScript(editor.value);
                    errorMessage.style.display = 'none';
                } catch (error) {
                    errorMessage.textContent = error instanceof Error ? error.message : 'Unknown error occurred';
                    errorMessage.style.display = 'block';
                }
            });
        }

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                console.log("Clear button clicked");
                this.clearIndicators();
                // Re-add built-in indicators after clearing
                this.addBuiltInIndicators();
            });
        }

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                // Save the current script to localStorage
                localStorage.setItem('savedPineScript', editor.value);
                alert('Script saved successfully!');
            });
        }

        // Load saved script if exists
        const savedScript = localStorage.getItem('savedPineScript');
        if (savedScript && editor) {
            editor.value = savedScript;
        }
    }

    private runPineScript(script: string) {
        try {
            console.log("Running Pine Script:", script);
            
            // Clear existing indicators
            this.clearIndicators();
            
            // Add built-in indicators first
            this.addBuiltInIndicators();

            // Parse and create new indicators
            const indicators = this.pineScriptParser.parseScript(script, candlestickData);
            console.log(`Parsed ${indicators.length} indicators`);
            
            if (indicators.length === 0) {
                console.warn("No indicators were parsed from the script");
                return;
            }
            
            for (const indicator of indicators) {
                // Skip built-in indicators if already added
                if (this.indicatorSeries.has(indicator.name)) {
                    console.log(`Skipping already added indicator: ${indicator.name}`);
                    continue;
                }
                
                console.log(`Adding indicator ${indicator.name} with color ${indicator.color}`);
                
                if (!indicator.data || indicator.data.length === 0) {
                    console.warn(`No data points for indicator ${indicator.name}`);
                    continue;
                }
                
                const series = this.chart.addSeries(LineSeries, {
                    color: indicator.color,
                    lineWidth: 2,
                    title: indicator.name,
                    lastValueVisible: true,
                    priceLineVisible: true,
                });

                console.log(`Setting ${indicator.data.length} data points for ${indicator.name}`);
                console.log(`First data point: ${JSON.stringify(indicator.data[0])}`);
                console.log(`Last data point: ${JSON.stringify(indicator.data[indicator.data.length - 1])}`);
                
                series.setData(indicator.data);
                this.indicatorSeries.set(indicator.name, series);
                this.pineScriptParser.addIndicator(indicator);
            }
            
            // Make sure the chart is updated
            this.chart.timeScale().fitContent();
            
            console.log("Indicators applied successfully");
        } catch (error) {
            console.error("Error running Pine Script:", error);
            throw error;
        }
    }

    private clearIndicators() {
        console.log(`Clearing ${this.indicatorSeries.size} indicators`);
        // Remove all indicator series from the chart
        for (const [name, series] of this.indicatorSeries.entries()) {
            console.log(`Removing indicator: ${name}`);
            this.chart.removeSeries(series);
        }
        this.indicatorSeries.clear();
        this.pineScriptParser.clearIndicators();
    }

    // Method to update data
    public updateData(data: CandlestickData[]) {
        this.candlestickSeries.setData(data);
        // Update all indicators with new data
        const editor = document.getElementById('pine-editor') as HTMLTextAreaElement;
        if (editor) {
            this.runPineScript(editor.value);
        }
    }

    // Method to destroy chart
    public destroy() {
        this.chart.remove();
    }
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing chart...');
        const chart = new TradingChart('trading-chart');
        console.log('Chart initialized successfully');
    } catch (error) {
        console.error('Failed to initialize chart:', error);
    }
}); 