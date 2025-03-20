# Tiny TradingView

A lightweight trading chart application built with TypeScript and TradingView's Lightweight Charts library.

## Features

- Real-time price chart
- Responsive design
- Dark theme
- TypeScript support
- Modern development setup with Webpack

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tiny-tradingview.git
cd tiny-tradingview
```

2. Install dependencies:
```bash
npm install
```

### Development

To start the development server:

```bash
npm start
```

This will start the development server at `http://localhost:9000`.

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
tiny-tradingview/
├── src/
│   ├── js/
│   │   └── index.ts      # Main chart implementation
│   ├── css/              # Styles (if needed)
│   ├── assets/           # Static assets
│   └── index.html        # HTML template
├── dist/                 # Production build
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
├── webpack.config.js     # Webpack configuration
└── README.md            # This file
```

## Customization

### Chart Configuration

You can customize the chart appearance by modifying the options in `src/js/index.ts`:

```typescript
this.chart = createChart(this.container, {
    layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
    },
    grid: {
        vertLines: { color: '#363a45' },
        horzLines: { color: '#363a45' },
    },
    // ... other options
});
```

### Data Source

Currently, the chart uses sample data. To use real data, modify the `updateData` method in the `TradingChart` class to fetch data from your preferred API.

## License

This project is licensed under the ISC License. 