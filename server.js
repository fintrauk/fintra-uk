const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const useragent = require('express-useragent');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));
app.use(useragent.express());

// Data storage files
const DATA_DIR = path.join(__dirname, 'data');
const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');
const LOAN_LEADS_FILE = path.join(DATA_DIR, 'loan_leads.json');
const DEBT_LEADS_FILE = path.join(DATA_DIR, 'debt_leads.json');
const CONTACT_LEADS_FILE = path.join(DATA_DIR, 'contact_leads.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '7984391495:AAGenWfVsv_glo9TVLJUJlbq0HUVIvHEYPU';

// Store for tracking last update ID for polling
let lastUpdateId = 0;

// List of known crawler/bot user agents to filter
const CRAWLER_PATTERNS = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'sogou', 'exabot', 'facebot', 'ia_archiver',
    'crawler', 'spider', 'bot', 'crawl', 'APIs-Google',
    'AdsBot', 'Googlebot', 'mediapartners', 'Google-Read-Aloud',
    'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot',
    'uptimerobot', 'pingdom', 'gtmetrix', 'lighthouse', 'pagespeed',
    'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'playwright'
];

// Initialize data directory and files
function initializeDataFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    const files = [VISITORS_FILE, LOAN_LEADS_FILE, DEBT_LEADS_FILE, CONTACT_LEADS_FILE, EVENTS_FILE, SUBSCRIBERS_FILE];
    files.forEach(file => {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify([], null, 2));
        }
    });
}

initializeDataFiles();

// Helper functions
function readJSONFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeJSONFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Check if request is from a crawler/bot
function isCrawler(userAgent) {
    if (!userAgent) return true;
    const ua = userAgent.toLowerCase();
    return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern.toLowerCase()));
}

// Get location from IP (basic)
async function getLocationFromIP(ip) {
    try {
        if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
            return { city: 'Local', country: 'Development', region: 'Local' };
        }
        const response = await axios.get(`http://ip-api.com/json/${ip}?fields=city,country,regionName`, { timeout: 3000 });
        return {
            city: response.data.city || 'Unknown',
            country: response.data.country || 'Unknown',
            region: response.data.regionName || 'Unknown'
        };
    } catch (error) {
        return { city: 'Unknown', country: 'Unknown', region: 'Unknown' };
    }
}

// Send Telegram notification to all subscribers
async function sendTelegramNotification(message) {
    const subscribers = readJSONFile(SUBSCRIBERS_FILE);
    
    if (subscribers.length === 0) {
        console.log('📱 Telegram notification (no subscribers):', message.substring(0, 50) + '...');
        return;
    }
    
    for (const subscriber of subscribers) {
        try {
            const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            await axios.post(url, {
                chat_id: subscriber.chatId,
                text: message,
                parse_mode: 'HTML'
            });
        } catch (error) {
            console.error(`❌ Failed to notify ${subscriber.chatId}:`, error.message);
            // If user blocked the bot, remove them from subscribers
            if (error.response && error.response.data && error.response.data.error_code === 403) {
                const updatedSubscribers = subscribers.filter(s => s.chatId !== subscriber.chatId);
                writeJSONFile(SUBSCRIBERS_FILE, updatedSubscribers);
                console.log(`🗑️ Removed blocked user: ${subscriber.chatId}`);
            }
        }
    }
    console.log(`✅ Telegram notification sent to ${subscribers.length} subscriber(s)`);
}

// Send message to a single user
async function sendTelegramMessage(chatId, message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });
        return true;
    } catch (error) {
        console.error('❌ Telegram message failed:', error.message);
        return false;
    }
}

// Add a subscriber
function addSubscriber(chatId, username, firstName) {
    const subscribers = readJSONFile(SUBSCRIBERS_FILE);
    const exists = subscribers.find(s => s.chatId === chatId);
    
    if (!exists) {
        subscribers.push({
            chatId,
            username: username || 'Unknown',
            firstName: firstName || 'Unknown',
            subscribedAt: new Date().toISOString()
        });
        writeJSONFile(SUBSCRIBERS_FILE, subscribers);
        return true;
    }
    return false;
}

// Remove a subscriber
function removeSubscriber(chatId) {
    const subscribers = readJSONFile(SUBSCRIBERS_FILE);
    const filtered = subscribers.filter(s => s.chatId !== chatId);
    
    if (filtered.length !== subscribers.length) {
        writeJSONFile(SUBSCRIBERS_FILE, filtered);
        return true;
    }
    return false;
}

// Poll for Telegram bot updates (handle /start, /stop commands)
async function pollTelegramUpdates() {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
        const response = await axios.get(url, { timeout: 35000 });
        
        const updates = response.data.result || [];
        
        for (const update of updates) {
            lastUpdateId = update.update_id;
            
            if (update.message && update.message.text) {
                const chatId = update.message.chat.id;
                const text = update.message.text.toLowerCase();
                const username = update.message.from.username;
                const firstName = update.message.from.first_name;
                
                if (text === '/start' || text === '/subscribe') {
                    const isNew = addSubscriber(chatId, username, firstName);
                    if (isNew) {
                        await sendTelegramMessage(chatId, 
                            `✅ <b>Welcome to Fintra UK Notifications!</b>\n\n` +
                            `You are now subscribed to receive real-time alerts for:\n` +
                            `👁 New website visitors\n` +
                            `📝 Form submissions\n` +
                            `🖱 Button clicks\n\n` +
                            `Use /stop to unsubscribe.`
                        );
                        console.log(`✅ New subscriber: ${firstName} (@${username}) - ${chatId}`);
                    } else {
                        await sendTelegramMessage(chatId, `ℹ️ You are already subscribed! Use /stop to unsubscribe.`);
                    }
                } else if (text === '/stop' || text === '/unsubscribe') {
                    const removed = removeSubscriber(chatId);
                    if (removed) {
                        await sendTelegramMessage(chatId, `👋 You have been unsubscribed from Fintra UK notifications.\n\nUse /start to subscribe again.`);
                        console.log(`🗑️ Unsubscribed: ${firstName} (@${username}) - ${chatId}`);
                    } else {
                        await sendTelegramMessage(chatId, `ℹ️ You are not currently subscribed. Use /start to subscribe.`);
                    }
                } else if (text === '/status') {
                    const subscribers = readJSONFile(SUBSCRIBERS_FILE);
                    const visitors = readJSONFile(VISITORS_FILE);
                    const loanLeads = readJSONFile(LOAN_LEADS_FILE);
                    const debtLeads = readJSONFile(DEBT_LEADS_FILE);
                    const contactLeads = readJSONFile(CONTACT_LEADS_FILE);
                    
                    await sendTelegramMessage(chatId,
                        `📊 <b>Fintra UK Dashboard Status</b>\n\n` +
                        `👥 Total Visitors: ${visitors.length}\n` +
                        `💰 Loan Applications: ${loanLeads.length}\n` +
                        `📋 Debt Consultations: ${debtLeads.length}\n` +
                        `📞 Contact Requests: ${contactLeads.length}\n` +
                        `🔔 Active Subscribers: ${subscribers.length}`
                    );
                } else if (text === '/help') {
                    await sendTelegramMessage(chatId,
                        `🤖 <b>Fintra UK Bot Commands</b>\n\n` +
                        `/start - Subscribe to notifications\n` +
                        `/stop - Unsubscribe from notifications\n` +
                        `/status - View current statistics\n` +
                        `/help - Show this help message`
                    );
                }
            }
        }
    } catch (error) {
        if (error.code !== 'ECONNABORTED') {
            console.error('Telegram polling error:', error.message);
        }
    }
    
    // Continue polling
    setTimeout(pollTelegramUpdates, 1000);
}

// Start Telegram polling
pollTelegramUpdates();
console.log('🤖 Telegram bot started - Users can /start to subscribe');

// Format date/time for UK
function formatUKDateTime(date) {
    return new Date(date).toLocaleString('en-GB', {
        timeZone: 'Europe/London',
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

// ==================== API ROUTES ====================

// Track visitor
app.post('/api/track/visitor', async (req, res) => {
    try {
        const userAgent = req.headers['user-agent'];
        
        // Filter out crawlers
        if (isCrawler(userAgent)) {
            return res.json({ success: true, filtered: true });
        }
        
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
        const location = await getLocationFromIP(ip.split(',')[0]);
        
        const visitor = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            ip: ip.split(',')[0],
            userAgent: userAgent,
            browser: req.useragent.browser,
            browserVersion: req.useragent.version,
            os: req.useragent.os,
            platform: req.useragent.platform,
            isMobile: req.useragent.isMobile,
            isDesktop: req.useragent.isDesktop,
            isTablet: req.useragent.isTablet,
            page: req.body.page || 'Unknown',
            referrer: req.body.referrer || 'Direct',
            utmSource: req.body.utmSource || null,
            utmMedium: req.body.utmMedium || null,
            utmCampaign: req.body.utmCampaign || null,
            location: location
        };
        
        const visitors = readJSONFile(VISITORS_FILE);
        visitors.push(visitor);
        writeJSONFile(VISITORS_FILE, visitors);
        
        // Send Telegram notification
        const deviceType = visitor.isMobile ? '📱 Mobile' : visitor.isTablet ? '📱 Tablet' : '💻 Desktop';
        const message = `
🌐 <b>New Visitor</b>

📍 <b>Location:</b> ${location.city}, ${location.country}
${deviceType}
🌐 <b>Browser:</b> ${visitor.browser} ${visitor.browserVersion}
💻 <b>OS:</b> ${visitor.os}
📄 <b>Page:</b> ${visitor.page}
🔗 <b>Referrer:</b> ${visitor.referrer}
${visitor.utmCampaign ? `📧 <b>Campaign:</b> ${visitor.utmCampaign}` : ''}
🕐 <b>Time:</b> ${formatUKDateTime(visitor.timestamp)}
        `.trim();
        
        await sendTelegramNotification(message);
        
        res.json({ success: true, visitorId: visitor.id });
    } catch (error) {
        console.error('Error tracking visitor:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Track button click
app.post('/api/track/click', async (req, res) => {
    try {
        const userAgent = req.headers['user-agent'];
        
        if (isCrawler(userAgent)) {
            return res.json({ success: true, filtered: true });
        }
        
        const { button, page, visitorId } = req.body;
        
        const event = {
            id: generateId(),
            type: 'click',
            timestamp: new Date().toISOString(),
            button: button,
            page: page,
            visitorId: visitorId
        };
        
        const events = readJSONFile(EVENTS_FILE);
        events.push(event);
        writeJSONFile(EVENTS_FILE, events);
        
        // Send Telegram notification
        const message = `
🖱️ <b>Button Click</b>

🔘 <b>Button:</b> ${button}
📄 <b>Page:</b> ${page}
🕐 <b>Time:</b> ${formatUKDateTime(event.timestamp)}
        `.trim();
        
        await sendTelegramNotification(message);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking click:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit loan application
app.post('/api/submit/loan', async (req, res) => {
    try {
        const lead = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            type: 'loan',
            ...req.body,
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown'
        };
        
        const leads = readJSONFile(LOAN_LEADS_FILE);
        leads.push(lead);
        writeJSONFile(LOAN_LEADS_FILE, leads);
        
        // Send Telegram notification
        const message = `
🎉 <b>NEW LOAN APPLICATION!</b>

👤 <b>Name:</b> ${lead.firstName} ${lead.lastName}
📧 <b>Email:</b> ${lead.email}
📞 <b>Phone:</b> ${lead.phone}
📍 <b>Location:</b> ${lead.city}, ${lead.postcode}
💼 <b>Employment:</b> ${lead.employmentStatus || 'N/A'}
💰 <b>Monthly Income:</b> £${lead.monthlyIncome || 'N/A'}
💷 <b>Loan Amount:</b> £${lead.requestedAmount || 'N/A'}
📝 <b>Purpose:</b> ${lead.loanPurpose || 'N/A'}
🕐 <b>Time:</b> ${formatUKDateTime(lead.timestamp)}

✅ Lead #${leads.length}
        `.trim();
        
        await sendTelegramNotification(message);
        
        res.json({ success: true, leadId: lead.id });
    } catch (error) {
        console.error('Error submitting loan application:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit debt management application
app.post('/api/submit/debt', async (req, res) => {
    try {
        const lead = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            type: 'debt_management',
            ...req.body,
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown'
        };
        
        const leads = readJSONFile(DEBT_LEADS_FILE);
        leads.push(lead);
        writeJSONFile(DEBT_LEADS_FILE, leads);
        
        // Send Telegram notification
        const message = `
🎉 <b>NEW DEBT MANAGEMENT LEAD!</b>

👤 <b>Name:</b> ${lead.firstName} ${lead.lastName}
📧 <b>Email:</b> ${lead.email}
📞 <b>Phone:</b> ${lead.phone}
📍 <b>Location:</b> ${lead.city}, ${lead.postcode}
💰 <b>Total Debt:</b> £${lead.totalDebt || 'N/A'}
👥 <b>Creditors:</b> ${lead.numCreditors || 'N/A'}
💼 <b>Employment:</b> ${lead.employmentStatus || 'N/A'}
💵 <b>Monthly Income:</b> £${lead.monthlyIncome || 'N/A'}
🕐 <b>Time:</b> ${formatUKDateTime(lead.timestamp)}

✅ Lead #${leads.length}
        `.trim();
        
        await sendTelegramNotification(message);
        
        res.json({ success: true, leadId: lead.id });
    } catch (error) {
        console.error('Error submitting debt application:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Submit contact form
app.post('/api/submit/contact', async (req, res) => {
    try {
        const lead = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            type: 'contact',
            ...req.body,
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown'
        };
        
        const leads = readJSONFile(CONTACT_LEADS_FILE);
        leads.push(lead);
        writeJSONFile(CONTACT_LEADS_FILE, leads);
        
        // Send Telegram notification
        const message = `
📬 <b>NEW CONTACT MESSAGE</b>

👤 <b>Name:</b> ${lead.name}
📧 <b>Email:</b> ${lead.email}
📞 <b>Phone:</b> ${lead.phone}
💬 <b>Message:</b> ${lead.message}
🕐 <b>Time:</b> ${formatUKDateTime(lead.timestamp)}
        `.trim();
        
        await sendTelegramNotification(message);
        
        res.json({ success: true, leadId: lead.id });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DASHBOARD API ====================

// Get dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
    try {
        const visitors = readJSONFile(VISITORS_FILE);
        const loanLeads = readJSONFile(LOAN_LEADS_FILE);
        const debtLeads = readJSONFile(DEBT_LEADS_FILE);
        const contactLeads = readJSONFile(CONTACT_LEADS_FILE);
        const events = readJSONFile(EVENTS_FILE);
        
        // Today's stats
        const today = new Date().toISOString().split('T')[0];
        const todayVisitors = visitors.filter(v => v.timestamp.startsWith(today)).length;
        const todayLoanLeads = loanLeads.filter(l => l.timestamp.startsWith(today)).length;
        const todayDebtLeads = debtLeads.filter(l => l.timestamp.startsWith(today)).length;
        
        res.json({
            totalVisitors: visitors.length,
            todayVisitors: todayVisitors,
            totalLoanLeads: loanLeads.length,
            todayLoanLeads: todayLoanLeads,
            totalDebtLeads: debtLeads.length,
            todayDebtLeads: todayDebtLeads,
            totalContactLeads: contactLeads.length,
            totalEvents: events.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get visitors
app.get('/api/dashboard/visitors', (req, res) => {
    try {
        const visitors = readJSONFile(VISITORS_FILE);
        res.json(visitors.reverse());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get loan leads
app.get('/api/dashboard/leads/loan', (req, res) => {
    try {
        const leads = readJSONFile(LOAN_LEADS_FILE);
        res.json(leads.reverse());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get debt leads
app.get('/api/dashboard/leads/debt', (req, res) => {
    try {
        const leads = readJSONFile(DEBT_LEADS_FILE);
        res.json(leads.reverse());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get contact leads
app.get('/api/dashboard/leads/contact', (req, res) => {
    try {
        const leads = readJSONFile(CONTACT_LEADS_FILE);
        res.json(leads.reverse());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get events
app.get('/api/dashboard/events', (req, res) => {
    try {
        const events = readJSONFile(EVENTS_FILE);
        res.json(events.reverse());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export data as CSV
app.get('/api/export/:type/csv', (req, res) => {
    try {
        const { type } = req.params;
        let data, filename;
        
        switch (type) {
            case 'visitors':
                data = readJSONFile(VISITORS_FILE);
                filename = 'visitors.csv';
                break;
            case 'loan':
                data = readJSONFile(LOAN_LEADS_FILE);
                filename = 'loan_leads.csv';
                break;
            case 'debt':
                data = readJSONFile(DEBT_LEADS_FILE);
                filename = 'debt_leads.csv';
                break;
            case 'contact':
                data = readJSONFile(CONTACT_LEADS_FILE);
                filename = 'contact_leads.csv';
                break;
            default:
                return res.status(400).json({ error: 'Invalid export type' });
        }
        
        if (data.length === 0) {
            return res.status(404).json({ error: 'No data to export' });
        }
        
        // Convert to CSV
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    let value = row[header];
                    if (typeof value === 'object') value = JSON.stringify(value);
                    if (typeof value === 'string' && value.includes(',')) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    return value || '';
                }).join(',')
            )
        ];
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(csvRows.join('\n'));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export data as TXT
app.get('/api/export/:type/txt', (req, res) => {
    try {
        const { type } = req.params;
        let data, filename;
        
        switch (type) {
            case 'visitors':
                data = readJSONFile(VISITORS_FILE);
                filename = 'visitors.txt';
                break;
            case 'loan':
                data = readJSONFile(LOAN_LEADS_FILE);
                filename = 'loan_leads.txt';
                break;
            case 'debt':
                data = readJSONFile(DEBT_LEADS_FILE);
                filename = 'debt_leads.txt';
                break;
            case 'contact':
                data = readJSONFile(CONTACT_LEADS_FILE);
                filename = 'contact_leads.txt';
                break;
            default:
                return res.status(400).json({ error: 'Invalid export type' });
        }
        
        if (data.length === 0) {
            return res.status(404).json({ error: 'No data to export' });
        }
        
        // Convert to formatted TXT
        const txtContent = data.map((item, index) => {
            const lines = [`=== Record ${index + 1} ===`];
            Object.entries(item).forEach(([key, value]) => {
                if (typeof value === 'object') value = JSON.stringify(value);
                lines.push(`${key}: ${value}`);
            });
            return lines.join('\n');
        }).join('\n\n');
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(txtContent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Fintra UK Server Running!                           ║
║                                                           ║
║   🌐 Website:    http://localhost:${PORT}                   ║
║   📊 Dashboard:  http://localhost:${PORT}/dashboard         ║
║                                                           ║
║   📁 Data stored in: ./data/                              ║
║                                                           ║
║   ⚙️  Configure Telegram Bot:                             ║
║      Edit TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID        ║
║      in server.js                                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
