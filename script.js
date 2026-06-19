(function() {
    'use strict';

    // ===== ตัวแปรหลัก =====
    let currentEmaPeriods = { p1: 20, p2: 50, p3: 200 };
    let currentTicker = '';
    let currentInterval = '3M';
    let globalPrevClose = 0;
    let globalCachedHigh14 = 0, globalCachedLow14 = 0;
    let finnhubApiKey = 'd8mtvrpr01qp7ubns9ggd8mtvrpr01qp7ubns9h0';
    let dailyRefreshInterval = null;
    let audioCtx = null;
    let beepAllowed = false;
    let audioInitialized = false;

    let ws = null;
    let wsConnected = false;
    let lastRealTimePrice = null;
    let notificationRequested = false;

    const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwedpW60H2YRM5vX01rvaygtt03MDq7cdV-YY0C4pkpjFSDsl8HXuTBUjFRINMnpaj3/exec';

    // ===== S&P 500 Stocks =====
    const HEATMAP_DATA = {
        'Technology': ['AAPL', 'MSFT', 'NVDA', 'AVGO', 'ORCL', 'CRM', 'ADBE', 'AMD', 'INTC', 'IBM', 'TXN', 'QCOM', 'CSCO', 'PLTR', 'SNOW', 'PANW', 'NOW', 'FTNT', 'ANET', 'CDNS', 'SNPS', 'ADI', 'AMAT', 'LRCX', 'KLAC', 'MRVL', 'NXPI', 'MPWR', 'MCHP', 'ON', 'STX', 'WDC', 'HPQ', 'DELL', 'SMCI', 'TER', 'SWKS', 'QRVO', 'ALGM', 'CRUS', 'SYNA'],
        'Financials': ['JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'AXP', 'SPGI', 'C', 'PGR', 'BLK', 'SCHW', 'KKR', 'CME', 'MCO', 'ICE', 'FISV', 'TFC', 'USB', 'PNC', 'COF', 'TRV', 'AIG', 'MSCI', 'NDAQ', 'BRO', 'AJG', 'MKTX', 'CM', 'FCNCA', 'RF', 'HBAN', 'CFG', 'KEY', 'FITB', 'MTB', 'NTRS', 'BEN', 'IVZ', 'JEF', 'LAZ', 'EVR', 'PJT'],
        'Healthcare': ['JNJ', 'UNH', 'LLY', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'ISRG', 'DHR', 'AMGN', 'SYK', 'CVS', 'CI', 'ELV', 'VRTX', 'REGN', 'BDX', 'BSX', 'ZTS', 'HUM', 'GILD', 'MDT', 'EW', 'BIIB', 'ALNY', 'ILMN', 'DXCM', 'DVA', 'IQV', 'ICLR', 'CRL', 'MRNA', 'NVAX', 'BMRN', 'INCY', 'EXEL', 'UTHR', 'ALKS', 'CPRX', 'VEEV', 'CERN', 'ABC', 'CAH', 'MCK'],
        'Consumer Discretionary': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX', 'LOW', 'TGT', 'TJX', 'ROST', 'BKNG', 'MAR', 'HLT', 'DHI', 'LEN', 'NVR', 'PHM', 'CMG', 'YUM', 'DRI', 'DPZ', 'RCL', 'NCLH', 'CCL', 'DIS', 'CMCSA', 'NFLX', 'FOXA', 'LYV', 'LVS', 'MGM', 'CZR', 'WYNN', 'MTN', 'VICI', 'EAT', 'BJ', 'DG', 'DLTR', 'URBN', 'GPS', 'KSS', 'M', 'JWN', 'TOL'],
        'Consumer Staples': ['PG', 'COST', 'WMT', 'KO', 'PEP', 'PM', 'MO', 'MDLZ', 'CL', 'EL', 'STZ', 'MNST', 'KMB', 'GIS', 'K', 'CAG', 'SJM', 'HRL', 'TSN', 'CPB', 'LW', 'TAP', 'SAM', 'BF.B', 'BUD', 'STZ', 'MNST', 'KDP', 'WBA', 'CVS', 'SYY', 'KR', 'ACI', 'USFD', 'PFGC', 'CASY', 'ANDE', 'HOG'],
        'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PSX', 'VLO', 'MPC', 'MRO', 'HAL', 'DVN', 'OXY', 'FANG', 'PXD', 'CTRA', 'EQT', 'TRGP', 'WMB', 'KMI', 'OKE', 'EPD', 'ET', 'PAA', 'MPLX', 'SU', 'CVE', 'IMO', 'TECK', 'BTU', 'ARCH', 'AMR', 'NOV', 'HP', 'PTEN', 'CHK', 'APA', 'MUR', 'COP', 'RRC', 'SWN', 'AR', 'CNX', 'OVV', 'HES', 'MRO'],
        'Industrials': ['GE', 'BA', 'CAT', 'RTX', 'HON', 'UPS', 'FDX', 'UNP', 'CSX', 'NSC', 'DE', 'MMM', 'EMR', 'TMO', 'DHR', 'AMET', 'PH', 'AOS', 'FERG', 'IR', 'ROP', 'PWR', 'XYL', 'WAB', 'AJG', 'URI', 'HEI', 'HWM', 'TXT', 'GD', 'NOC', 'LMT', 'LHX', 'HII', 'RHI', 'PAYC', 'JCI', 'TT', 'CARR', 'ABT', 'ITW', 'EFX', 'CTAS', 'EXPD'],
        'Utilities': ['NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'SRE', 'PEG', 'ED', 'DTE', 'FE', 'EIX', 'ES', 'WEC', 'PPL', 'AEE', 'CMS', 'CNP', 'EVRG', 'LNT', 'NI', 'OGE', 'PNW', 'POR', 'UGI', 'AES', 'NGG', 'AYI', 'ALB', 'ETR', 'HE', 'HNL', 'MDU', 'NWE', 'PNY', 'SJW'],
        'Real Estate': ['AMT', 'PLD', 'EQIX', 'O', 'WELL', 'AVB', 'EQR', 'VTR', 'ARE', 'INVH', 'SUI', 'MAA', 'ESS', 'KIM', 'UDR', 'EXR', 'PSA', 'ADC', 'BRX', 'BXP', 'CPT', 'CUBE', 'DLR', 'DOC', 'EGP', 'EPRT', 'FRT', 'HR', 'IRM', 'KRC', 'MPW', 'NNN', 'OHI', 'REG', 'REXR', 'SBAC', 'SLG', 'SPG', 'STAG', 'VNO', 'WY', 'CIGI', 'CBRE', 'JLL'],
        'Communication Services': ['GOOGL', 'META', 'VZ', 'T', 'TMUS', 'CMCSA', 'CHTR', 'ATVI', 'EA', 'TTWO', 'WBD', 'PARA', 'FOXA', 'LYV', 'MTCH', 'TKO', 'NWS', 'IAC', 'SIRI', 'VIAC', 'BIDU', 'BILI', 'DASH', 'PINS', 'SNAP', 'ROKU', 'RBLX', 'U', 'ZM', 'DOCU', 'ETSY', 'SPOT', 'YELP', 'Z', 'ZG']
    };

    let globalStockData = [];
    let alerts = [];

    // ============================================================
    //  TAB NAVIGATION (เหลือ 4 แท็บ)
    // ============================================================
    function initTabs() {
        const btns = document.querySelectorAll('.tab-btn');
        const contents = {
            dashboard: document.getElementById('tabDashboard'),
            heatmap: document.getElementById('tabHeatmap'),
            market: document.getElementById('tabMarket'),
            signals: document.getElementById('tabSignals')
        };
        btns.forEach(btn => {
            btn.addEventListener('click', function() {
                btns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const tab = this.getAttribute('data-tab');
                Object.keys(contents).forEach(key => {
                    contents[key].classList.toggle('active', key === tab);
                });
                if (tab === 'market') fetchMarketOverview();
                if (tab === 'signals') generateTradingSignals();
            });
        });
    }

    // ============================================================
    //  1. ALERT SYSTEM + STATUS BAR NOTIFICATION
    // ============================================================
    function requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('เบราว์เซอร์นี้ไม่รองรับ Notification API');
            return;
        }
        if (Notification.permission === 'granted') {
            console.log('ได้รับอนุญาตแล้ว');
            return;
        }
        if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(function(permission) {
                if (permission === 'granted') {
                    console.log('อนุญาตให้แจ้งเตือนแล้ว');
                    try {
                        new Notification('🔔 StockNest พร้อมแจ้งเตือน', {
                            body: 'ระบบจะแจ้งเตือนเมื่อราคามาเป้าหมาย',
                            icon: '📈'
                        });
                    } catch(e) {}
                } else {
                    console.log('ไม่อนุญาตให้แจ้งเตือน');
                }
            });
        }
    }

    function showNotification(msg) {
        // 1. Toast (ในเว็บ)
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#2563eb; color:#fff; padding:14px 24px; border-radius:16px; font-weight:600; z-index:9999; box-shadow:0 8px 30px rgba(0,0,0,0.5); max-width:90%; text-align:center; animation:slideUp 0.3s ease;';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // 2. Status Bar Notification
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification('📊 StockNest Alert', {
                    body: msg,
                    icon: '📈',
                    vibrate: [200, 100, 200]
                });
                setTimeout(() => notification.close(), 8000);
            } catch(e) {}
        }
    }

    function loadAlerts() {
        const stored = localStorage.getItem('stockNestAlerts');
        alerts = stored ? JSON.parse(stored) : [];
        renderAlerts();
    }
    function saveAlerts() {
        localStorage.setItem('stockNestAlerts', JSON.stringify(alerts));
        renderAlerts();
    }
    function addAlert(ticker, price, condition) {
        if (!ticker || !price) return alert('กรุณากรอกหุ้นและราคา');
        const id = Date.now();
        alerts.push({ id, ticker: ticker.toUpperCase(), price: parseFloat(price), condition });
        saveAlerts();
        updateAlertBadge();
    }
    function removeAlert(id) {
        alerts = alerts.filter(a => a.id !== id);
        saveAlerts();
        updateAlertBadge();
    }
    function renderAlerts() {
        const container = document.getElementById('alertList');
        if (!container) return;
        if (alerts.length === 0) {
            container.innerHTML = '<span style="color:#64748b; font-size:12px;">ยังไม่มีรายการแจ้งเตือน</span>';
            return;
        }
        container.innerHTML = alerts.map(a => `
            <div class="alert-item">
                <span class="ticker">${a.ticker}</span>
                <span class="cond">${a.condition === '>=' ? 'ขึ้นถึง' : 'ลงถึง'}</span>
                <span class="price">$${a.price.toFixed(2)}</span>
                <span class="alert-remove" data-id="${a.id}">✖</span>
            </div>
        `).join('');
        container.querySelectorAll('.alert-remove').forEach(el => {
            el.addEventListener('click', () => removeAlert(parseInt(el.dataset.id)));
        });
    }
    function updateAlertBadge() {
        const badge = document.getElementById('alertBadge');
        if (badge) badge.textContent = `${alerts.length} รายการ`;
    }
    function checkAlerts(price, ticker) {
        if (!price || !ticker) return;
        const matched = alerts.filter(a => a.ticker === ticker);
        matched.forEach(a => {
            let triggered = false;
            if (a.condition === '>=' && price >= a.price) triggered = true;
            if (a.condition === '<=' && price <= a.price) triggered = true;
            if (triggered) {
                playAlertBeep();
                const msg = `🚨 ${ticker} ราคา $${price.toFixed(2)} ${a.condition === '>=' ? 'ขึ้นถึง' : 'ลงถึง'} เป้าหมาย $${a.price.toFixed(2)}`;
                showNotification(msg);
                removeAlert(a.id);
            }
        });
    }

    // ✅ ทดสอบเสียง + ขออนุญาต Status Bar
    function testAlertSound() {
        function doTest() {
            enableAudio();
            playAlertBeep();
            showNotification('🔊 ทดสอบแจ้งเตือน! ระบบพร้อมทำงาน');
            setTimeout(() => {
                if (alerts && alerts.length > 0) {
                    const a = alerts[0];
                    showNotification(`🔔 ทดสอบ: ${a.ticker} $${a.price.toFixed(2)} ${a.condition === '>=' ? '↑ ขึ้นถึง' : '↓ ลงถึง'} เป้าหมาย (จำลอง)`);
                } else {
                    showNotification('🔔 ทดสอบ: NVDA $120.00 ↑ ขึ้นถึงเป้าหมาย (ตัวอย่าง)');
                }
                playAlertBeep();
            }, 800);
        }

        if (!('Notification' in window)) {
            alert('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
            return;
        }

        if (Notification.permission === 'granted') {
            doTest();
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(function(permission) {
                if (permission === 'granted') {
                    doTest();
                    notificationRequested = true;
                } else {
                    alert('⚠️ กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์ (คลิกปุ่มอนุญาต)');
                }
            });
        } else {
            alert('🔕 การแจ้งเตือนถูกบล็อกแล้ว กรุณาไปตั้งค่าเบราว์เซอร์เพื่ออนุญาต');
        }
    }

    // ============================================================
    //  2. MARKET OVERVIEW
    // ============================================================
    async function fetchMarketOverview() {
        const indices = [
            { id: 'spx', symbol: '^GSPC', label: 'S&P 500', priceEl: 'idx-spx', chgEl: 'idx-spx-chg' },
            { id: 'ixic', symbol: '^IXIC', label: 'NASDAQ', priceEl: 'idx-ixic', chgEl: 'idx-ixic-chg' },
            { id: 'dji', symbol: '^DJI', label: 'Dow Jones', priceEl: 'idx-dji', chgEl: 'idx-dji-chg' }
        ];
        for (let idx of indices) {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${idx.symbol}?interval=1m&range=1d`;
                const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const res = await fetch(proxy);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const chart = data.chart.result[0];
                if (!chart) continue;
                const meta = chart.meta;
                const quotes = chart.indicators.quote[0];
                const closes = quotes.close;
                let latest = null;
                for (let i=closes.length-1; i>=0; i--) {
                    if (closes[i] !== null) { latest = closes[i]; break; }
                }
                if (latest) {
                    const prevClose = meta.previousClose || latest;
                    const change = latest - prevClose;
                    const pct = (change/prevClose)*100;
                    document.getElementById(idx.priceEl).textContent = `$${latest.toFixed(2)}`;
                    const chgEl = document.getElementById(idx.chgEl);
                    chgEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;
                    chgEl.style.color = change >= 0 ? '#4ade80' : '#f87171';
                } else {
                    document.getElementById(idx.priceEl).textContent = 'N/A';
                    document.getElementById(idx.chgEl).textContent = 'ไม่พบข้อมูล';
                }
            } catch(e) {
                console.log('Index error', idx.symbol, e);
                document.getElementById(idx.priceEl).textContent = 'Error';
                document.getElementById(idx.chgEl).textContent = '—';
            }
        }
        updateTopMovers();
    }

    function updateTopMovers() {
        const gainers = document.getElementById('topGainers');
        const losers = document.getElementById('topLosers');
        if (!globalStockData || globalStockData.length === 0) {
            gainers.textContent = 'ยังไม่มีข้อมูล (กรุณาค้นหาหุ้นก่อน)';
            losers.textContent = 'ยังไม่มีข้อมูล (กรุณาค้นหาหุ้นก่อน)';
            return;
        }
        const sorted = [...globalStockData].filter(s => s.pct !== undefined).sort((a,b) => b.pct - a.pct);
        const top5 = sorted.slice(0,5);
        const bottom5 = sorted.slice(-5).reverse();
        gainers.innerHTML = top5.map(s => `<div>${s.symbol} <span style="color:#4ade80;">+${s.pct.toFixed(2)}%</span></div>`).join('');
        losers.innerHTML = bottom5.map(s => `<div>${s.symbol} <span style="color:#f87171;">${s.pct.toFixed(2)}%</span></div>`).join('');
    }

    // ============================================================
    //  3. TRADING SIGNALS
    // ============================================================
    async function generateTradingSignals() {
        const container = document.getElementById('signalsContainer');
        if (!container) return;
        container.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">⏳ กำลังวิเคราะห์สัญญาณ...</div>';

        let watchlist = [...favorites];
        if (currentTicker && !watchlist.includes(currentTicker)) watchlist.push(currentTicker);
        if (watchlist.length === 0) watchlist = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN'];
        watchlist = watchlist.slice(0, 10);

        let signals = [];
        for (let sym of watchlist) {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=6mo`;
                const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const res = await fetch(proxy);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const chart = data.chart.result[0];
                if (!chart) continue;
                const quotes = chart.indicators.quote[0];
                const closes = quotes.close.filter(c => c !== null);
                if (closes.length < 50) continue;
                const currentPrice = closes[closes.length-1];
                const rsi = calculateRSI(14, closes);
                const ema20 = getEMASeries(20, closes);
                const ema50 = getEMASeries(50, closes);
                const lastEma20 = ema20[ema20.length-1];
                const lastEma50 = ema50[ema50.length-1];
                const prevEma20 = ema20[ema20.length-2] || 0;
                const prevEma50 = ema50[ema50.length-2] || 0;
                let signal = 'NEUTRAL';
                let signalText = '➖ กลาง';
                let color = 'signal-neutral';

                if (rsi < 30 && currentPrice > lastEma50) {
                    signal = 'STRONG_BUY';
                    signalText = '🔥 STRONG BUY (RSI Oversold + ราคาเหนือ EMA50)';
                    color = 'signal-strong-buy';
                } else if (rsi > 70 && currentPrice < lastEma50) {
                    signal = 'STRONG_SELL';
                    signalText = '🔥 STRONG SELL (RSI Overbought + ราคาต่ำกว่า EMA50)';
                    color = 'signal-strong-sell';
                } else if (prevEma20 <= prevEma50 && lastEma20 > lastEma50) {
                    signal = 'BUY';
                    signalText = '📈 BUY (Golden Cross EMA20 > EMA50)';
                    color = 'signal-buy';
                } else if (prevEma20 >= prevEma50 && lastEma20 < lastEma50) {
                    signal = 'SELL';
                    signalText = '📉 SELL (Death Cross EMA20 < EMA50)';
                    color = 'signal-sell';
                } else if (rsi < 40) {
                    signalText = '🟢 โซนสะสม (RSI ต่ำ)';
                    color = 'signal-buy';
                } else if (rsi > 60) {
                    signalText = '🟡 โซนขาย (RSI สูง)';
                    color = 'signal-sell';
                }

                signals.push({
                    symbol: sym,
                    price: currentPrice,
                    rsi: rsi,
                    signal: signal,
                    signalText: signalText,
                    color: color,
                    ema20: lastEma20,
                    ema50: lastEma50
                });
                await new Promise(r => setTimeout(r, 200));
            } catch(e) { console.log('Signal error', sym, e); }
        }

        if (signals.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">⚠️ ไม่สามารถวิเคราะห์สัญญาณได้ กรุณาลองใหม่</div>';
            return;
        }

        const order = { 'STRONG_BUY': 0, 'BUY': 1, 'NEUTRAL': 2, 'SELL': 3, 'STRONG_SELL': 4 };
        signals.sort((a,b) => (order[a.signal] || 5) - (order[b.signal] || 5));

        container.innerHTML = signals.map(s => `
            <div class="signal-card" style="border-left-color: ${s.color.includes('buy') ? '#4ade80' : s.color.includes('sell') ? '#f87171' : '#facc15'};">
                <div class="info">
                    <div class="ticker">${s.symbol}</div>
                    <div class="detail">RSI: ${s.rsi.toFixed(1)} | ราคา: $${s.price.toFixed(2)} | EMA20: $${s.ema20.toFixed(2)} | EMA50: $${s.ema50.toFixed(2)}</div>
                </div>
                <div class="signal-badge ${s.color}">${s.signalText}</div>
            </div>
        `).join('');
    }

    // ============================================================
    //  UTILITY FUNCTIONS (EMA, RSI, Audio)
    // ============================================================
    function getEMASeries(period, prices) {
        if (!prices.length) return [];
        const k = 2 / (period + 1);
        let ema = [prices[0]];
        for (let i = 1; i < prices.length; i++) ema.push(prices[i] * k + ema[i-1] * (1 - k));
        return ema;
    }
    function calculateRSI(period, prices) {
        if (prices.length < period + 1) return 50;
        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            let diff = prices[i] - prices[i-1];
            if (diff >= 0) gains += diff; else losses -= diff;
        }
        let avgGain = gains / period, avgLoss = losses / period;
        if (avgLoss === 0) return 100;
        return 100 - 100 / (1 + avgGain / avgLoss);
    }

    function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        function beep(duration = 200, frequency = 880, volume = 0.3) {
            if (!audioCtx || !beepAllowed) return;
            const now = audioCtx.currentTime;
            const oscillator = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            oscillator.connect(gain);
            gain.connect(audioCtx.destination);
            oscillator.frequency.value = frequency;
            gain.gain.value = volume;
            oscillator.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, now + duration / 1000);
            oscillator.stop(now + duration / 1000);
        }
        window.beep = beep;
    }
    function enableAudio() {
        if (!audioCtx) initAudio();
        if (audioCtx && !beepAllowed) {
            audioCtx.resume().then(() => { beepAllowed = true; }).catch(e => console.log("Audio resume failed", e));
        }
    }
    function playAlertBeep() { if (!beepAllowed) return; if (window.beep) window.beep(300, 880, 0.4); }
    function setupAudioOnFirstClick() {
        if (audioInitialized) return;
        const handler = () => {
            enableAudio();
            document.removeEventListener('click', handler);
            document.removeEventListener('touchstart', handler);
            audioInitialized = true;
        };
        document.addEventListener('click', handler);
        document.addEventListener('touchstart', handler);
    }

    // ============================================================
    //  MARKET STATUS (Dashboard)
    // ============================================================
    function updateMarketStatus(price, rsi, ema1, ema2, ema3, support, resistance) {
        const rsiStatusEl = document.getElementById('rsiStatus');
        if (rsiStatusEl) {
            let status = 'neutral', text = 'กลางๆ';
            if (rsi >= 70) { status = 'overbought'; text = 'ซื้อมากเกินไป (Overbought)'; }
            else if (rsi <= 30) { status = 'oversold'; text = 'ขายมากเกินไป (Oversold)'; }
            else { status = 'neutral'; text = `${rsi.toFixed(1)} (กลางๆ)`; }
            rsiStatusEl.className = `status-value ${status}`;
            rsiStatusEl.textContent = text;
        }
        const trendStatusEl = document.getElementById('trendStatus');
        if (trendStatusEl) {
            let status = 'neutral', text = 'กลางๆ';
            if (price > ema1 && price > ema2 && price > ema3) { status = 'bullish'; text = '🚀 Bullish (ขาขึ้น)'; }
            else if (price < ema1 && price < ema2 && price < ema3) { status = 'bearish'; text = '📉 Bearish (ขาลง)'; }
            else { status = 'neutral'; text = '↔️ ผสม (Sideways)'; }
            trendStatusEl.className = `status-value ${status}`;
            trendStatusEl.textContent = text;
        }
        const srStatusEl = document.getElementById('srStatus');
        if (srStatusEl) {
            const tolerance = (resistance - support) * 0.05;
            let status = 'mid-range', text = 'กลางๆ';
            if (Math.abs(price - resistance) <= tolerance) { status = 'near-resistance'; text = '🔼 ใกล้แนวต้าน'; }
            else if (Math.abs(price - support) <= tolerance) { status = 'near-support'; text = '🔽 ใกล้แนวรับ'; }
            else { status = 'mid-range'; text = '↔️ กลางๆ'; }
            srStatusEl.className = `status-value ${status}`;
            srStatusEl.textContent = text;
        }
    }

    // ============================================================
    //  WEBSOCKET (Real-time + Alert Check)
    // ============================================================
    function connectFinnhubWebSocket() {
        if (!finnhubApiKey) return;
        if (ws && ws.readyState === WebSocket.OPEN) return;
        ws = new WebSocket(`wss://ws.finnhub.io?token=${finnhubApiKey}`);
        ws.onopen = () => {
            console.log("Finnhub WebSocket เปิดแล้ว");
            wsConnected = true;
            if (currentTicker) ws.send(JSON.stringify({ type: "subscribe", symbol: currentTicker }));
        };
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "trade" && data.data && data.data.length) {
                const latestTrade = data.data[0];
                const price = latestTrade.p;
                const symbol = latestTrade.s;
                updateRealTimePrice(price, symbol);
            }
        };
        ws.onerror = (err) => console.error("WebSocket error", err);
        ws.onclose = () => {
            console.log("WebSocket ปิด, จะ reconnect ใน 5 วินาที");
            wsConnected = false;
            setTimeout(connectFinnhubWebSocket, 5000);
        };
    }
    function disconnectWebSocket() { if (ws && ws.readyState === WebSocket.OPEN) ws.close(); ws = null; wsConnected = false; }
    function subscribeTicker(ticker) { if (ws && ws.readyState === WebSocket.OPEN && ticker) ws.send(JSON.stringify({ type: "subscribe", symbol: ticker })); }
    function unsubscribeTicker(ticker) { if (ws && ws.readyState === WebSocket.OPEN && ticker) ws.send(JSON.stringify({ type: "unsubscribe", symbol: ticker })); }

    function updateRealTimePrice(price, ticker) {
        if (!ticker) return;
        lastRealTimePrice = price;
        const priceEl = document.getElementById('w-live-price');
        if (priceEl && ticker === currentTicker) priceEl.innerText = `$${price.toFixed(2)}`;
        if (globalPrevClose !== 0 && ticker === currentTicker) {
            const change = price - globalPrevClose;
            const pct = (change / globalPrevClose) * 100;
            const changeEl = document.getElementById('w-change');
            if (changeEl) {
                changeEl.innerText = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;
                changeEl.className = `webull-change ${change >= 0 ? 'c-up' : 'c-down'}`;
            }
        }
        checkAlerts(price, ticker);
        if (ticker === currentTicker && globalCachedHigh14 && globalCachedLow14) {
            const tolerance = globalCachedHigh14 * 0.005;
            if (Math.abs(price - globalCachedHigh14) <= tolerance || Math.abs(price - globalCachedLow14) <= tolerance) {
                playAlertBeep();
                const msg = `⚠️ ${currentTicker} ราคา ${price.toFixed(2)} แตะแนว${Math.abs(price - globalCachedHigh14) <= tolerance ? 'ต้าน' : 'รับ'}!`;
                showNotification(msg);
            }
        }
        const rsiEl = document.getElementById('rsiStatus');
        const rsi = rsiEl ? parseFloat(rsiEl.textContent.replace(/[^0-9.]/g, '')) : 50;
        if (globalCachedHigh14 && globalCachedLow14 && ticker === currentTicker) {
            updateMarketStatus(price, isNaN(rsi) ? 50 : rsi, 0, 0, 0, globalCachedLow14, globalCachedHigh14);
        }
    }

    // ============================================================
    //  DAILY FUNDAMENTALS (Dashboard)
    // ============================================================
    async function updateDailyFundamentals() {
        if (!currentTicker) return;
        const timestampSpan = document.getElementById('refreshTimestamp');
        if (timestampSpan) timestampSpan.innerText = '⏳ กำลังอัปเดตข้อมูล...';
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${currentTicker}?interval=1d&range=2y`;
        const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        try {
            const res = await fetch(proxy);
            const data = await res.json();
            const chart = data.chart.result[0];
            if (!chart) throw new Error('ไม่พบข้อมูลหุ้น');
            const meta = chart.meta;
            const quotes = chart.indicators.quote[0];
            const timestamps = chart.timestamp;
            const opens = quotes.open, highs = quotes.high, lows = quotes.low, closes = quotes.close;
            let cleanCloses = [], cleanHighs = [], cleanLows = [];
            for (let i = 0; i < closes.length; i++) {
                if (timestamps[i] && opens[i] && highs[i] && lows[i] && closes[i]) {
                    cleanCloses.push(closes[i]);
                    cleanHighs.push(highs[i]);
                    cleanLows.push(lows[i]);
                }
            }
            const latestClose = cleanCloses[cleanCloses.length - 1];
            const latestHigh = highs[highs.length - 1];
            const latestLow = lows[lows.length - 1];
            const latestOpen = opens[opens.length - 1];
            const prevClose = meta.previousClose || latestClose;
            globalPrevClose = prevClose;
            const high14 = Math.max(...cleanHighs.slice(-14));
            const low14 = Math.min(...cleanLows.slice(-14));
            globalCachedHigh14 = high14;
            globalCachedLow14 = low14;
            const pp = (latestHigh + latestLow + latestClose) / 3;
            const r1 = 2 * pp - latestLow, s1 = 2 * pp - latestHigh;
            const r2 = pp + (latestHigh - latestLow), s2 = pp - (latestHigh - latestLow);
            const ema1 = getEMASeries(currentEmaPeriods.p1, cleanCloses);
            const ema2 = getEMASeries(currentEmaPeriods.p2, cleanCloses);
            const ema3 = getEMASeries(currentEmaPeriods.p3, cleanCloses);
            const currentEma1 = ema1[ema1.length - 1];
            const currentEma2 = ema2[ema2.length - 1];
            const currentEma3 = ema3[ema3.length - 1];
            const rsi = calculateRSI(14, cleanCloses);
            let longDcaLower = Math.min(currentEma3, low14);
            let longDcaUpper = currentEma3 * 1.02;
            if (latestClose < currentEma3) { longDcaLower = low14 * 0.97; longDcaUpper = currentEma3; }

            const extDiv = document.getElementById('w-ext-container');
            if (meta) {
                let extPrice = null, extLabel = "";
                if (meta.postMarketPrice) { extPrice = meta.postMarketPrice; extLabel = "After Hours:"; }
                else if (meta.preMarketPrice) { extPrice = meta.preMarketPrice; extLabel = "Pre-Market:"; }
                else if (meta.extendedMarketPrice) { extPrice = meta.extendedMarketPrice; extLabel = "Extended Hours:"; }
                if (extPrice !== null && extPrice !== undefined) {
                    const extChange = extPrice - latestClose;
                    const extPct = (extChange / latestClose) * 100;
                    document.getElementById('w-ext-label').innerText = extLabel;
                    document.getElementById('w-ext-price').innerText = `$${extPrice.toFixed(2)}`;
                    const extEl = document.getElementById('w-ext-change');
                    extEl.innerText = `${extChange >= 0 ? '+' : ''}${extChange.toFixed(2)} (${extChange >= 0 ? '+' : ''}${extPct.toFixed(2)}%)`;
                    extEl.className = `ext-change ${extChange >= 0 ? 'c-up' : 'c-down'}`;
                    extDiv.style.display = 'flex';
                } else { extDiv.style.display = 'none'; }
            } else { extDiv.style.display = 'none'; }

            document.getElementById('w-high').innerText = latestHigh.toFixed(2);
            document.getElementById('w-low').innerText = latestLow.toFixed(2);
            document.getElementById('w-open').innerText = latestOpen.toFixed(2);
            document.getElementById('w-prev-close').innerText = prevClose.toFixed(2);
            document.getElementById('v-h14').innerText = `$${high14.toFixed(2)}`;
            document.getElementById('v-l14').innerText = `$${low14.toFixed(2)}`;
            document.getElementById('v-r2').innerText = `$${r2.toFixed(2)}`;
            document.getElementById('v-r1').innerText = `$${r1.toFixed(2)}`;
            document.getElementById('v-pp').innerText = `$${pp.toFixed(2)}`;
            document.getElementById('v-s1').innerText = `$${s1.toFixed(2)}`;
            document.getElementById('v-s2').innerText = `$${s2.toFixed(2)}`;
            document.getElementById('v-longDcaZone').innerText = `$${longDcaLower.toFixed(2)} - $${longDcaUpper.toFixed(2)}`;

            updateDCAStatus(latestClose, currentEma1, currentEma3);
            updateEmaDisplay({ ema1: currentEma1, ema2: currentEma2, ema3: currentEma3 });
            updateMarketStatus(latestClose, rsi, currentEma1, currentEma2, currentEma3, low14, high14);

            if (timestampSpan) timestampSpan.innerText = `อัปเดตล่าสุด: ${new Date().toLocaleTimeString()}`;
        } catch (err) {
            console.error("Daily update error:", err);
            if (timestampSpan) timestampSpan.innerText = 'อัปเดตข้อมูลล้มเหลว';
        }
    }
    function startDailyRefresh(seconds = 60) {
        if (dailyRefreshInterval) clearInterval(dailyRefreshInterval);
        updateDailyFundamentals();
        dailyRefreshInterval = setInterval(updateDailyFundamentals, seconds * 1000);
    }
    function stopDailyRefresh() { if (dailyRefreshInterval) { clearInterval(dailyRefreshInterval); dailyRefreshInterval = null; } }

    // ============================================================
    //  NEWS & TRANSLATION
    // ============================================================
    function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }
    async function translateText(text, targetLang = 'th') {
        if (!text) return '';
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        try { const res = await fetch(url); const data = await res.json(); return data[0]?.[0]?.[0] || text; } catch (e) { console.error('Translation error:', e); return text; }
    }
    let isTranslated = false;
    async function translateAllNews() {
        const btn = document.getElementById('translateNewsBtn');
        const newsItems = document.querySelectorAll('.news-item');
        if (!newsItems.length) return;
        if (!isTranslated) {
            btn.textContent = '🔄 แสดงต้นฉบับ'; btn.disabled = true;
            for (let item of newsItems) {
                const headlineEl = item.querySelector('.news-headline');
                const summaryEl = item.querySelector('.news-summary');
                const originalHeadline = headlineEl.getAttribute('data-original') || headlineEl.innerText;
                const originalSummary = summaryEl.getAttribute('data-original') || summaryEl.innerText;
                if (!headlineEl.hasAttribute('data-original')) {
                    headlineEl.setAttribute('data-original', originalHeadline);
                    summaryEl.setAttribute('data-original', originalSummary);
                }
                headlineEl.innerText = await translateText(originalHeadline);
                summaryEl.innerText = await translateText(originalSummary);
            }
            btn.disabled = false; isTranslated = true;
        } else {
            btn.textContent = '🌐 แปลข่าวเป็นไทย';
            for (let item of newsItems) {
                const headlineEl = item.querySelector('.news-headline');
                const summaryEl = item.querySelector('.news-summary');
                headlineEl.innerText = headlineEl.getAttribute('data-original') || headlineEl.innerText;
                summaryEl.innerText = summaryEl.getAttribute('data-original') || summaryEl.innerText;
            }
            isTranslated = false;
        }
    }
    function getFinnhubApiKey() {
        if (finnhubApiKey && finnhubApiKey.length > 10) return true;
        let key = prompt('🔑 ใส่ Finnhub API Key (สมัครฟรีที่ finnhub.io/register)\nKey จะถูกบันทึกในเครื่องคุณ');
        if (key && key.length > 10) { finnhubApiKey = key; localStorage.setItem('finnhubApiKey', key); return true; }
        return false;
    }
    async function fetchNews(ticker) {
        const newsContainer = document.getElementById('newsContainer');
        if (!newsContainer) return;
        if (!finnhubApiKey) {
            newsContainer.innerHTML = `
                <div style="text-align:center; padding:20px; color:#94a3b8;">
                    ⚠️ ใส่ Finnhub API Key เพื่อดูข่าว
                    <br/><br/>
                    <button onclick="changeFinnhubApiKey()" style="padding:6px 16px; border-radius:10px; border:none; background:#2563eb; color:#fff; font-weight:600; cursor:pointer; font-size:12px;">
                        🔑 ใส่ Key
                    </button>
                </div>
            `;
            return;
        }
        newsContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">📰 กำลังโหลดข่าว...</div>';
        const today = new Date();
        const weekAgo = new Date(Date.now() - 7 * 24 * 3600000);
        const fromDate = weekAgo.toISOString().split('T')[0];
        const toDate = today.toISOString().split('T')[0];
        const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${finnhubApiKey}`;
        try {
            const res = await fetch(url);
            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch(e) {
                newsContainer.innerHTML = `
                    <div style="text-align:center; padding:20px; color:#f87171;">
                        ❌ API Key หมดอายุ กรุณาเปลี่ยน Key
                        <br/><br/>
                        <button onclick="changeFinnhubApiKey()" style="padding:6px 16px; border-radius:10px; border:none; background:#2563eb; color:#fff; font-weight:600; cursor:pointer; font-size:12px;">
                            🔑 เปลี่ยน Key
                        </button>
                    </div>
                `;
                return;
            }
            if (!data || data.length === 0) {
                newsContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">📭 ไม่มีข่าวล่าสุดของหุ้นนี้</div>';
                return;
            }
            newsContainer.innerHTML = '';
            data.slice(0, 5).forEach(article => {
                const date = new Date(article.datetime * 1000);
                const summaryText = article.summary || '';
                const newsItem = document.createElement('a');
                newsItem.href = article.url; newsItem.target = '_blank'; newsItem.className = 'news-item';
                newsItem.innerHTML = `
                    <div class="news-header">
                        <span class="news-source">${escapeHtml(article.source || 'News')}</span>
                        <span class="news-date">${date.toLocaleDateString()}</span>
                    </div>
                    <div class="news-headline" data-original="${escapeHtml(article.headline)}">${escapeHtml(article.headline)}</div>
                    <div class="news-summary" data-original="${escapeHtml(summaryText)}">${escapeHtml(summaryText)}</div>
                `;
                newsContainer.appendChild(newsItem);
            });
            if (isTranslated) { const btn = document.getElementById('translateNewsBtn'); if (btn) btn.textContent = '🌐 แปลข่าวเป็นไทย'; isTranslated = false; }
        } catch (err) {
            newsContainer.innerHTML = `
                <div style="text-align:center; padding:20px; color:#f87171;">
                    ❌ โหลดข่าวไม่สำเร็จ: ${err.message}
                    <br/><br/>
                    <button onclick="changeFinnhubApiKey()" style="padding:6px 16px; border-radius:10px; border:none; background:#2563eb; color:#fff; font-weight:600; cursor:pointer; font-size:12px;">
                        🔑 เปลี่ยน Key
                    </button>
                </div>
            `;
            console.error('News error:', err);
        }
    }

    // ===== เปลี่ยน Finnhub API Key =====
    function changeFinnhubApiKey() {
        const newKey = prompt('🔑 ใส่ Finnhub API Key ใหม่ (สมัครฟรีที่ finnhub.io/register)\nKey ปัจจุบัน: ' + finnhubApiKey);
        if (newKey && newKey.length > 10) {
            finnhubApiKey = newKey;
            localStorage.setItem('finnhubApiKey', newKey);
            alert('✅ เปลี่ยน API Key สำเร็จ!');
            if (currentTicker) fetchNews(currentTicker);
            return true;
        } else if (newKey !== null) {
            alert('⚠️ API Key ต้องมีความยาวมากกว่า 10 ตัวอักษร');
        }
        return false;
    }

    // ============================================================
    //  CORE FUNCTIONS (Dashboard)
    // ============================================================
    function syncFavoritesToBackend() {
        if (!BACKEND_URL || BACKEND_URL.includes('你的部署ID')) return;
        const favList = JSON.stringify(favorites);
        fetch(`${BACKEND_URL}?setFavorites=${encodeURIComponent(favList)}`, { mode: 'no-cors' }).catch(e => console.log('Sync favorites error:', e));
    }
    function syncEmaToBackend(p1, p2, p3) {
        if (!BACKEND_URL || BACKEND_URL.includes('你的部署ID')) return;
        fetch(`${BACKEND_URL}?setEma=${p1},${p2},${p3}`, { mode: 'no-cors' }).catch(e => console.log('Sync EMA error:', e));
    }
    function loadTradingView(ticker, interval) {
        const container = document.getElementById('tradingviewWidget');
        if (!container) return;
        const iframe = document.createElement('iframe');
        iframe.src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(ticker)}&interval=${interval}&theme=dark&style=1&studies=RSI%2CMACD`;
        iframe.style.cssText = 'width:100%; height:100%; border:none; background:#131622;';
        container.innerHTML = '';
        container.appendChild(iframe);
    }
    function updateTradingViewChart() { if (currentTicker) loadTradingView(currentTicker, currentInterval); }
    function setTimeframe(interval) { currentInterval = interval; updateTradingViewChart(); }
    function updateEmaDisplay(values) {
        document.getElementById('emaHeader').innerHTML = `<span class="ind-label">EMA</span>
            <span class="c-ema20" style="color:#e67e22;">${currentEmaPeriods.p1}:<span id="top-ema1">${values.ema1.toFixed(2)}</span></span>
            <span class="c-ema50" style="color:#f1c40f;">${currentEmaPeriods.p2}:<span id="top-ema2">${values.ema2.toFixed(2)}</span></span>
            <span class="c-ema200" style="color:#9b59b6;">${currentEmaPeriods.p3}:<span id="top-ema3">${values.ema3.toFixed(2)}</span></span>`;
        const container = document.getElementById('emaProCardsContainer');
        if (!container) return;
        const periods = [currentEmaPeriods.p1, currentEmaPeriods.p2, currentEmaPeriods.p3];
        const vals = [values.ema1, values.ema2, values.ema3];
        const spread = (globalCachedHigh14 && globalCachedLow14) ? (globalCachedHigh14 - globalCachedLow14) / 4 : 1;
        container.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const buy = vals[i] - (spread * (i === 0 ? 0.2 : i === 1 ? 0.4 : 0.6));
            const sell = vals[i] + (spread * (i === 0 ? 0.5 : i === 1 ? 0.8 : 1.0));
            container.innerHTML += `<div class="ema-pro-card"><div class="ema-pro-header badge-${[20,50,200][i]}">🟧 เส้น EMA ${periods[i]}</div><div>ราคาเส้นปัจจุบัน: <span class="exact-p">$${vals[i].toFixed(2)}</span></div><div class="ema-pro-action"><div class="act-box buy"><span class="act-label">ดักซื้อเมื่อย่อตัว</span><strong>$${buy.toFixed(2)}</strong></div><div class="act-box sell"><span class="act-label">เป้าขายทำกำไร</span><strong>$${sell.toFixed(2)}</strong></div></div></div>`;
        }
    }
    function updateDCAStatus(price, shortEma, longEma) {
        const badge = document.getElementById('v-dcaBadge');
        const desc = document.getElementById('v-dcaDesc');
        badge.classList.remove('bg-good-dca', 'bg-normal-dca', 'bg-risk-dca');
        if (price > shortEma && price > longEma) {
            badge.innerText = "🟢 DCA โซนได้เปรียบ (Strong Uptrend)";
            badge.classList.add('bg-good-dca');
            desc.innerText = "หุ้นอยู่บนเทรนด์ขาขึ้นที่แข็งแกร่ง เหมาะสะสม";
        } else if (price <= shortEma && price >= longEma) {
            badge.innerText = "🟡 DCA โซนลดราคา (Buy the Dip)";
            badge.classList.add('bg-normal-dca');
            desc.innerText = "ราคาย่อตัวหลุดเส้นระยะสั้น แต่ภาพใหญ่ยังดี";
        } else {
            badge.innerText = "🔴 ชะลอหรือแบ่งไม้เล็ก (Downtrend Risk)";
            badge.classList.add('bg-risk-dca');
            desc.innerText = "ราคาหลุด EMA 200 เสี่ยงติดดอยยาว";
        }
    }

    async function fetchStockDataAndUpdateUI() {
        const input = document.getElementById('tickerInput');
        const loading = document.getElementById('loading');
        const resultBox = document.getElementById('resultBox');
        const ticker = input.value.toUpperCase().trim();
        if (!ticker) {
            loading.style.display = 'block';
            loading.innerHTML = '⚠️ กรุณาพิมพ์ชื่อหุ้นก่อน (เช่น NVDA, TSLA, AAPL)';
            loading.style.color = '#f97316';
            resultBox.style.display = 'none';
            return;
        }
        updateFavoriteStar(ticker);
        loading.style.display = 'block';
        loading.innerHTML = 'กำลังโหลดข้อมูล...';
        loading.style.color = '#94a3b8';
        resultBox.style.display = 'none';

        const proxy = `https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`)}`;
        try {
            const res = await fetch(proxy);
            const data = await res.json();
            const chart = data.chart.result[0];
            if (!chart) throw new Error('ไม่พบข้อมูลหุ้น');
            const meta = chart.meta;
            const quotes = chart.indicators.quote[0];
            const closes = quotes.close;
            let latestClose = null;
            for (let i = closes.length - 1; i >= 0; i--) {
                if (closes[i] !== null && closes[i] !== undefined) {
                    latestClose = closes[i];
                    break;
                }
            }
            if (!latestClose) throw new Error('ไม่พบราคาปัจจุบัน');
            const prevClose = meta.previousClose || latestClose;
            globalPrevClose = prevClose;
            const change = latestClose - prevClose;
            const pct = (change / prevClose) * 100;

            document.getElementById('w-ticker').innerText = ticker;
            document.getElementById('w-live-price').innerText = `$${latestClose.toFixed(2)}`;
            const changeEl = document.getElementById('w-change');
            changeEl.innerText = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;
            changeEl.className = `webull-change ${change >= 0 ? 'c-up' : 'c-down'}`;

            await updateDailyFundamentals();

            currentTicker = ticker;
            localStorage.setItem('stockNestLastTicker', ticker);

            updateTradingViewChart();
            loading.style.display = 'none';
            resultBox.style.display = 'block';
            fetchNews(ticker);

            if (!finnhubApiKey) getFinnhubApiKey();
            if (finnhubApiKey) {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    unsubscribeTicker(ticker);
                    subscribeTicker(ticker);
                } else {
                    connectFinnhubWebSocket();
                    setTimeout(() => subscribeTicker(ticker), 1000);
                }
            }
            startDailyRefresh(60);
        } catch (err) {
            loading.style.display = 'none';
            alert('ข้อผิดพลาด: ' + err.message);
        }
    }

    // ============================================================
    //  FAVORITES
    // ============================================================
    let favorites = [];
    function loadFavorites() {
        let stored = localStorage.getItem('stockNestFavorites');
        favorites = stored ? JSON.parse(stored) : [];
        renderFavorites();
        syncFavoritesToBackend();
    }
    function saveFav() { localStorage.setItem('stockNestFavorites', JSON.stringify(favorites)); }
    function renderFavorites() {
        const container = document.getElementById('favoritesList');
        if (!container) return;
        if (!favorites.length) { container.innerHTML = '<span style="color:#64748b; font-size:11px;">⭐ กด★ เพื่อเพิ่มหุ้นโปรด</span>'; return; }
        container.innerHTML = '';
        favorites.forEach(t => {
            const div = document.createElement('div');
            div.className = 'fav-item';
            div.innerHTML = `<span class="fav-ticker">${t}</span><span class="fav-remove" data-ticker="${t}">✖</span>`;
            div.querySelector('.fav-ticker').onclick = () => { document.getElementById('tickerInput').value = t; fetchStockDataAndUpdateUI(); };
            div.querySelector('.fav-remove').onclick = (e) => {
                e.stopPropagation();
                favorites = favorites.filter(f => f !== t);
                saveFav();
                renderFavorites();
                updateFavoriteStar(document.getElementById('tickerInput').value.trim().toUpperCase());
                syncFavoritesToBackend();
            };
            container.appendChild(div);
        });
    }
    function addFavorite(ticker) { if (!ticker || favorites.includes(ticker)) return; favorites.push(ticker); saveFav(); renderFavorites(); updateFavoriteStar(ticker); syncFavoritesToBackend(); }
    function removeFavorite(ticker) { favorites = favorites.filter(t => t !== ticker); saveFav(); renderFavorites(); updateFavoriteStar(document.getElementById('tickerInput').value.trim().toUpperCase()); syncFavoritesToBackend(); }
    function toggleFavorite(ticker) { favorites.includes(ticker) ? removeFavorite(ticker) : addFavorite(ticker); }
    function updateFavoriteStar(ticker) {
        const star = document.getElementById('favStarBtn');
        if (!star) return;
        star.textContent = favorites.includes(ticker) ? '★' : '☆';
        star.style.color = favorites.includes(ticker) ? '#facc15' : '#7e869c';
    }

    function loadEmaPeriods() {
        const stored = localStorage.getItem('stockNestEmaPeriods');
        if (stored) try { let p = JSON.parse(stored); if (p.p1 && p.p2 && p.p3) currentEmaPeriods = p; } catch (e) {}
        document.getElementById('emaPeriod1').value = currentEmaPeriods.p1;
        document.getElementById('emaPeriod2').value = currentEmaPeriods.p2;
        document.getElementById('emaPeriod3').value = currentEmaPeriods.p3;
        syncEmaToBackend(currentEmaPeriods.p1, currentEmaPeriods.p2, currentEmaPeriods.p3);
    }
    function saveEmaPeriods() { localStorage.setItem('stockNestEmaPeriods', JSON.stringify(currentEmaPeriods)); }

    // ============================================================
    //  INIT
    // ============================================================
    function initApp() {
        initTabs();

        // Alert Events
        document.getElementById('addAlertBtn')?.addEventListener('click', function() {
            if (!notificationRequested && Notification.permission === 'default') {
                Notification.requestPermission();
                notificationRequested = true;
            }
            const ticker = document.getElementById('alertTicker').value.trim().toUpperCase();
            const price = document.getElementById('alertPrice').value;
            const condition = document.getElementById('alertCondition').value;
            if (!ticker || !price) return alert('กรุณากรอกหุ้นและราคา');
            addAlert(ticker, price, condition);
            document.getElementById('alertTicker').value = '';
            document.getElementById('alertPrice').value = '';
        });

        document.getElementById('testAlertBtn')?.addEventListener('click', testAlertSound);

        // Refresh Buttons
        document.getElementById('refreshMarketBtn')?.addEventListener('click', fetchMarketOverview);
        document.getElementById('refreshSignalsBtn')?.addEventListener('click', generateTradingSignals);

        loadAlerts();
        updateAlertBadge();

        // Search
        document.getElementById('searchBtn').addEventListener('click', function() {
            if (!notificationRequested && Notification.permission === 'default') {
                Notification.requestPermission();
                notificationRequested = true;
            }
            fetchStockDataAndUpdateUI();
        });
        const input = document.getElementById('tickerInput');
        input.addEventListener('keypress', e => { if (e.key === 'Enter') fetchStockDataAndUpdateUI(); });
        input.addEventListener('input', () => updateFavoriteStar(input.value.trim().toUpperCase()));
        document.getElementById('favStarBtn').addEventListener('click', () => { const t = input.value.trim().toUpperCase(); if (t) toggleFavorite(t); });
        document.getElementById('applyEmaBtn').addEventListener('click', () => {
            const p1 = parseInt(document.getElementById('emaPeriod1').value, 10);
            const p2 = parseInt(document.getElementById('emaPeriod2').value, 10);
            const p3 = parseInt(document.getElementById('emaPeriod3').value, 10);
            if (isNaN(p1) || isNaN(p2) || isNaN(p3)) return alert('กรุณากรอกตัวเลข');
            if (p1 < 1 || p1 > 200 || p2 < 1 || p2 > 200 || p3 < 1 || p3 > 200) return alert('ค่า EMA ต้องอยู่ระหว่าง 1-200');
            currentEmaPeriods = { p1, p2, p3 };
            saveEmaPeriods();
            fetchStockDataAndUpdateUI();
            syncEmaToBackend(p1, p2, p3);
        });
        loadFavorites();
        loadEmaPeriods();
        updateFavoriteStar(input.value.trim().toUpperCase());
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                setTimeframe(this.getAttribute('data-interval'));
            });
        });
        const translateBtn = document.getElementById('translateNewsBtn');
        if (translateBtn) translateBtn.addEventListener('click', translateAllNews);
        setupAudioOnFirstClick();

        const hasVisited = sessionStorage.getItem('stockNestHasVisited');
        window.addEventListener('pageshow', function(event) {
            if (!hasVisited) { console.log('ครั้งแรกใน session - ไม่โหลดอัตโนมัติ'); return; }
            let isBackForward = false;
            try {
                if (performance.navigation) { isBackForward = (performance.navigation.type === 2); }
                else if (performance.getEntriesByType) {
                    const navEntries = performance.getEntriesByType('navigation');
                    if (navEntries.length > 0) isBackForward = (navEntries[0].type === 'back_forward');
                }
            } catch (e) { isBackForward = event.persisted; }
            if (isBackForward) {
                const lastTicker = localStorage.getItem('stockNestLastTicker');
                if (lastTicker && !currentTicker) {
                    const inputField = document.getElementById('tickerInput');
                    if (inputField) { inputField.value = lastTicker; fetchStockDataAndUpdateUI(); }
                }
            }
        });

        setTimeout(() => {
            sessionStorage.setItem('stockNestHasVisited', 'true');
        }, 100);

        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = '🔍 กรุณาพิมพ์ชื่อหุ้น (เช่น NVDA, TSLA, AAPL) แล้วกด Enter';
            loadingDiv.style.color = '#94a3b8';
            loadingDiv.style.display = 'block';
        }
        const resultBox = document.getElementById('resultBox');
        if (resultBox) resultBox.style.display = 'none';
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
    else initApp();
})();