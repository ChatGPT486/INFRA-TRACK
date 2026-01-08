// script.js - Complete Interactive Dashboard Functionality

// ===== GLOBAL VARIABLES & INITIALIZATION =====
let currentFilter = 'all';
let currentDateRange = 'today';
let autoRefreshInterval;
let chartInstance = null;
let reportsData = JSON.parse(localStorage.getItem('infraReports')) || [];

// DOM Elements
const contentArea = document.getElementById('contentArea');
const navLinks = document.querySelectorAll('.nav-link');
const dateButtons = document.querySelectorAll('.date-btn');
const filterButtons = document.querySelectorAll('.filter-btn');
const statCards = document.querySelectorAll('.stat-card');
const actionCards = document.querySelectorAll('.action-card');
const activityItems = document.querySelectorAll('.activity-item');
const backToTop = document.getElementById('backToTop');
const notificationContainer = document.getElementById('notificationContainer');
const viewAllActivity = document.getElementById('viewAllActivity');
const exportBtn = document.getElementById('exportBtn');
const printBtn = document.getElementById('printBtn');
const shareBtn = document.getElementById('shareBtn');
const chartRange = document.getElementById('chartRange');
const refreshChart = document.getElementById('refreshChart');
const autoRefresh = document.getElementById('autoRefresh');
const performanceChart = document.getElementById('performanceChart');
const reportForm = document.getElementById('reportForm');
const cancelReport = document.getElementById('cancelReport');
const togglePanel = document.getElementById('togglePanel');
const panelBody = document.getElementById('panelBody');
const recentReportsList = document.getElementById('recentReportsList');

// ===== DATA GENERATION & SIMULATION =====
const serviceData = {
    power: {
        name: "Power",
        color: "#f59e0b",
        icon: "fa-bolt",
        reliability: 87,
        trend: 2.5,
        activeOutages: 23,
        avgDuration: "2.4h",
        reportsToday: 1247
    },
    water: {
        name: "Water",
        color: "#3b82f6",
        icon: "fa-tint",
        reliability: 79,
        trend: -1.8,
        activeOutages: 15,
        avgDuration: "5.8h",
        reportsToday: 892
    },
    internet: {
        name: "Internet",
        color: "#10b981",
        icon: "fa-wifi",
        reliability: 92,
        trend: 3.1,
        activeIssues: 8,
        avgDuration: "1.2h",
        reportsToday: 654
    },
    roads: {
        name: "Roads",
        color: "#8b5cf6",
        icon: "fa-road",
        reliability: 75,
        trend: 0.5,
        activeIssues: 12,
        avgDuration: "3.4h",
        reportsToday: 543
    }
};

const regions = [
    { id: 'bastos', name: 'Bastos', color: '#3B82F6' },
    { id: 'melen', name: 'Melen', color: '#10B981' },
    { id: 'ngousso', name: 'Ngousso', color: '#F59E0B' },
    { id: 'essos', name: 'Essos', color: '#EF4444' },
    { id: 'mokolo', name: 'Mokolo', color: '#8B5CF6' }
];

const statusTypes = [
    { id: 'critical', name: 'Critical', color: '#EF4444', icon: '🔥' },
    { id: 'high', name: 'High', color: '#F59E0B', icon: '⚠️' },
    { id: 'medium', name: 'Medium', color: '#3B82F6', icon: 'ℹ️' },
    { id: 'low', name: 'Low', color: '#10B981', icon: '📗' }
];

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-text">${message}</span>
        </div>
        <button class="notification-close">×</button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Add styles dynamically
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                background: var(--bg-card);
                border-left: 4px solid;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 4px 12px var(--shadow-color);
                animation: slideIn 0.3s ease-out;
                margin-bottom: 0.5rem;
                border-color: var(--accent-color);
            }
            
            .notification-success { border-color: #10B981; }
            .notification-error { border-color: #EF4444; }
            .notification-warning { border-color: #F59E0B; }
            .notification-info { border-color: #3B82F6; }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .notification-icon {
                font-size: 1.2rem;
            }
            
            .notification-text {
                color: var(--text-primary);
                font-weight: 500;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0 0.5rem;
                transition: color 0.3s;
            }
            
            .notification-close:hover {
                color: var(--danger-color);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto remove
    const removeNotification = () => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    };
    
    notification.querySelector('.notification-close').addEventListener('click', removeNotification);
    
    if (duration > 0) {
        setTimeout(removeNotification, duration);
    }
    
    return notification;
}

// ===== NAVIGATION & ROUTING =====
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active state
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        const linkId = link.id;
        
        // Show loading animation
        contentArea.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading ${link.textContent}...</p>
            </div>
        `;
        
        // Add loading styles
        if (!document.querySelector('#loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    gap: 1rem;
                }
                
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--accent-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Simulate loading delay and load content
        setTimeout(() => {
            switch(linkId) {
                case 'detailedLink':
                    loadDetailedAnalysis();
                    break;
                case 'trendsLink':
                    loadTrendsView();
                    break;
                case 'comparisonsLink':
                    loadComparisonsView();
                    break;
                default:
                    loadMainDashboard();
            }
        }, 800);
    });
});

function loadMainDashboard() {
    // Content is already loaded by default
    location.reload(); // For simplicity, reload the page
}

function loadDetailedAnalysis() {
    contentArea.innerHTML = `
        <div class="detailed-analysis-view">
            <div class="view-header">
                <h1><i class="fas fa-chart-bar"></i> Detailed Analysis</h1>
                <p>In-depth analytics and breakdown by service type</p>
            </div>
            
            <div class="analysis-grid">
                <div class="analysis-card">
                    <div class="analysis-card-header">
                        <h3><i class="fas fa-bolt"></i> Power Infrastructure</h3>
                        <span class="trend-up">+2.5% this month</span>
                    </div>
                    <div class="analysis-chart" id="powerAnalysisChart"></div>
                    <div class="analysis-stats">
                        <div class="stat-item">
                            <span class="stat-label">Uptime</span>
                            <span class="stat-value">87.2%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Response Time</span>
                            <span class="stat-value">2.4h</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Satisfaction</span>
                            <span class="stat-value">85%</span>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-card">
                    <div class="analysis-card-header">
                        <h3><i class="fas fa-tint"></i> Water Infrastructure</h3>
                        <span class="trend-down">-1.8% this month</span>
                    </div>
                    <div class="analysis-chart" id="waterAnalysisChart"></div>
                    <div class="analysis-stats">
                        <div class="stat-item">
                            <span class="stat-label">Availability</span>
                            <span class="stat-value">79.1%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Quality Score</span>
                            <span class="stat-value">8.2/10</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Satisfaction</span>
                            <span class="stat-value">82%</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="back-to-dashboard">
                <button id="backToDashboard" class="btn-primary">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
        </div>
    `;
    
    // Initialize analysis charts
    setTimeout(() => {
        initializeAnalysisCharts();
    }, 100);
    
    document.getElementById('backToDashboard').addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        document.getElementById('reportsLink').classList.add('active');
        loadMainDashboard();
    });
}

function loadTrendsView() {
    contentArea.innerHTML = `
        <div class="trends-view">
            <div class="view-header">
                <h1><i class="fas fa-chart-area"></i> Trends & Patterns</h1>
                <p>Historical trends and pattern analysis</p>
            </div>
            
            <div class="trends-controls">
                <div class="time-period">
                    <h4>Time Period</h4>
                    <div class="period-buttons">
                        <button class="period-btn active" data-period="3m">3 Months</button>
                        <button class="period-btn" data-period="6m">6 Months</button>
                        <button class="period-btn" data-period="1y">1 Year</button>
                        <button class="period-btn" data-period="2y">2 Years</button>
                    </div>
                </div>
                
                <div class="service-selector">
                    <h4>Services</h4>
                    <div class="service-checkboxes">
                        <label><input type="checkbox" checked> Power</label>
                        <label><input type="checkbox" checked> Water</label>
                        <label><input type="checkbox" checked> Internet</label>
                        <label><input type="checkbox"> Roads</label>
                    </div>
                </div>
            </div>
            
            <div class="trends-chart-container">
                <canvas id="trendsChart"></canvas>
            </div>
            
            <div class="trends-insights">
                <h3><i class="fas fa-lightbulb"></i> Key Insights</h3>
                <div class="insights-grid">
                    <div class="insight-card">
                        <div class="insight-icon">📈</div>
                        <h4>Steady Improvement</h4>
                        <p>Overall infrastructure score has improved by 12% over the past year</p>
                    </div>
                    <div class="insight-card">
                        <div class="insight-icon">⚡</div>
                        <h4>Power Surge</h4>
                        <p>Power reliability shows consistent improvement with 98% uptime in Q4</p>
                    </div>
                    <div class="insight-card">
                        <div class="insight-icon">💧</div>
                        <h4>Water Challenges</h4>
                        <p>Water services show seasonal patterns with higher outages during dry months</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize trends chart
    setTimeout(() => {
        initializeTrendsChart();
    }, 100);
}

function loadComparisonsView() {
    contentArea.innerHTML = `
        <div class="comparisons-view">
            <div class="view-header">
                <h1><i class="fas fa-balance-scale"></i> Regional Comparisons</h1>
                <p>Compare infrastructure performance across regions</p>
            </div>
            
            <div class="comparison-controls">
                <div class="region-selector">
                    <h4>Select Regions</h4>
                    <div class="region-checkboxes">
                        ${regions.map(region => `
                            <label class="region-checkbox">
                                <input type="checkbox" value="${region.id}" checked>
                                <span class="region-dot" style="background: ${region.color}"></span>
                                ${region.name}
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div class="metric-selector">
                    <h4>Comparison Metric</h4>
                    <select id="comparisonMetric">
                        <option value="reliability">Reliability Score</option>
                        <option value="response">Response Time</option>
                        <option value="satisfaction">User Satisfaction</option>
                        <option value="outages">Outage Frequency</option>
                    </select>
                </div>
            </div>
            
            <div class="comparison-chart-container">
                <canvas id="comparisonChart"></canvas>
            </div>
            
            <div class="comparison-table">
                <h3><i class="fas fa-table"></i> Performance Comparison</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Region</th>
                            <th>Power</th>
                            <th>Water</th>
                            <th>Internet</th>
                            <th>Overall Score</th>
                            <th>Rank</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${regions.map((region, index) => `
                            <tr>
                                <td><span class="region-dot" style="background: ${region.color}"></span> ${region.name}</td>
                                <td>${85 + Math.floor(Math.random() * 10)}%</td>
                                <td>${75 + Math.floor(Math.random() * 15)}%</td>
                                <td>${88 + Math.floor(Math.random() * 8)}%</td>
                                <td>${80 + Math.floor(Math.random() * 15)}/100</td>
                                <td><span class="rank-badge">#${index + 1}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Initialize comparison chart
    setTimeout(() => {
        initializeComparisonChart();
    }, 100);
}

// ===== DATE FILTER FUNCTIONALITY =====
dateButtons.forEach(button => {
    button.addEventListener('click', () => {
        dateButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentDateRange = button.dataset.range;
        
        // Show notification
        let rangeText = '';
        switch(currentDateRange) {
            case 'today': rangeText = 'Today'; break;
            case 'yesterday': rangeText = 'Yesterday'; break;
            case 'week': rangeText = 'Last 7 Days'; break;
            case 'month': rangeText = 'This Month'; break;
            case 'custom': rangeText = 'Custom Range'; break;
        }
        
        showNotification(`Filtering data for ${rangeText}`, 'info');
        
        // Update stats based on date range
        updateStatsForDateRange();
    });
});

function updateStatsForDateRange() {
    // Simulate data updates based on date range
    statCards.forEach(card => {
        const service = card.dataset.section;
        if (service === 'overall') return;
        
        const data = serviceData[service];
        const valueElement = card.querySelector('.stat-value');
        const trendElement = card.querySelector('.stat-trend');
        const reportsElement = card.querySelector('.detail-item:last-child .detail-value');
        
        // Generate variation based on date range
        let variation = 0;
        switch(currentDateRange) {
            case 'today':
                variation = (Math.random() * 3) - 1.5;
                break;
            case 'yesterday':
                variation = (Math.random() * 4) - 2;
                break;
            case 'week':
                variation = (Math.random() * 5) - 2.5;
                break;
            case 'month':
                variation = (Math.random() * 8) - 4;
                break;
        }
        
        const newValue = Math.max(50, Math.min(99, data.reliability + variation));
        const newTrend = (Math.random() * 5) - 2.5;
        const newReports = Math.floor(data.reportsToday * (0.8 + Math.random() * 0.4));
        
        // Animate value change
        animateValueChange(valueElement, parseFloat(valueElement.textContent), newValue);
        
        // Update trend
        const isUp = newTrend > 0;
        trendElement.innerHTML = `<i class="fas fa-arrow-${isUp ? 'up' : 'down'}"></i> ${Math.abs(newTrend).toFixed(1)}%`;
        trendElement.className = `stat-trend ${isUp ? 'trend-up' : 'trend-down'}`;
        
        // Update reports
        reportsElement.textContent = newReports.toLocaleString();
    });
}

function animateValueChange(element, start, end) {
    const duration = 1000;
    const startTime = Date.now();
    
    const updateValue = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = start + (end - start) * easeOutQuart;
        
        element.textContent = `${Math.round(current)}%`;
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    };
    
    requestAnimationFrame(updateValue);
}

// ===== SERVICE FILTER FUNCTIONALITY =====
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.service;
        
        // Filter stat cards
        statCards.forEach(card => {
            const service = card.dataset.section;
            
            if (currentFilter === 'all' || service === 'overall') {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            } else if (service === currentFilter) {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
                // Add highlight effect
                card.style.boxShadow = '0 0 0 3px rgba(49, 130, 206, 0.3), 0 8px 30px var(--shadow-color)';
                setTimeout(() => {
                    card.style.boxShadow = '';
                }, 1000);
            } else {
                card.style.opacity = '0.5';
                card.style.transform = 'scale(0.95)';
            }
        });
        
        showNotification(`Showing ${currentFilter === 'all' ? 'all services' : serviceData[currentFilter].name} data`, 'info');
    });
});

// ===== STAT CARD INTERACTIONS =====
statCards.forEach(card => {
    card.addEventListener('click', () => {
        const section = card.dataset.section;
        
        if (section === 'overall') {
            showNotification('Opening overall infrastructure analysis...', 'info');
            // In a real app, this would open a detailed modal
            openDetailedModal(section);
        } else {
            const service = serviceData[section];
            showNotification(`Opening detailed analysis for ${service.name} infrastructure`, 'info');
            openDetailedModal(section);
        }
    });
});

function openDetailedModal(service) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const serviceDataObj = service === 'overall' ? {
        name: 'Overall Infrastructure',
        color: '#ec4899',
        icon: 'fa-star'
    } : serviceData[service];
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header" style="border-bottom-color: ${serviceDataObj.color}">
                <h2>
                    <i class="fas ${serviceDataObj.icon}" style="color: ${serviceDataObj.color}"></i>
                    ${serviceDataObj.name} Detailed Analysis
                </h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-chart" id="modalChart"></div>
                <div class="modal-stats">
                    <div class="modal-stat">
                        <span class="modal-stat-label">Current Status</span>
                        <span class="modal-stat-value" style="color: ${serviceDataObj.color}">
                            ${service === 'overall' ? '86/100' : serviceDataObj.reliability + '%'}
                        </span>
                    </div>
                    <div class="modal-stat">
                        <span class="modal-stat-label">24h Trend</span>
                        <span class="modal-stat-value">
                            ${service === 'overall' ? '+5.2%' : (serviceDataObj.trend > 0 ? '+' : '') + serviceDataObj.trend + '%'}
                        </span>
                    </div>
                    <div class="modal-stat">
                        <span class="modal-stat-label">Active Issues</span>
                        <span class="modal-stat-value">
                            ${service === 'overall' ? '46' : serviceDataObj.activeOutages || serviceDataObj.activeIssues}
                        </span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary">View Historical Data</button>
                    <button class="btn-primary">Generate Report</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles
    if (!document.querySelector('#modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease-out;
            }
            
            .modal-content {
                background: var(--bg-card);
                border-radius: 12px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease-out;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .modal-header {
                padding: 1.5rem 2rem;
                border-bottom: 3px solid;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h2 {
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .modal-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 2rem;
                cursor: pointer;
                line-height: 1;
                transition: color 0.3s;
            }
            
            .modal-close:hover {
                color: var(--danger-color);
            }
            
            .modal-body {
                padding: 2rem;
            }
            
            .modal-chart {
                height: 200px;
                background: var(--bg-secondary);
                border-radius: 8px;
                margin-bottom: 2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-secondary);
            }
            
            .modal-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .modal-stat {
                text-align: center;
                padding: 1rem;
                background: var(--bg-secondary);
                border-radius: 8px;
            }
            
            .modal-stat-label {
                display: block;
                font-size: 0.9rem;
                color: var(--text-secondary);
                margin-bottom: 0.5rem;
            }
            
            .modal-stat-value {
                display: block;
                font-size: 1.8rem;
                font-weight: 700;
                color: white;
            }
            
            .modal-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }
            
            .btn-primary, .btn-secondary {
                padding: 0.8rem 1.5rem;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                border: none;
            }
            
            .btn-primary {
                background: var(--accent-color);
                color: white;
            }
            
            .btn-primary:hover {
                background: var(--accent-light);
                transform: translateY(-2px);
            }
            
            .btn-secondary {
                background: var(--bg-secondary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
            }
            
            .btn-secondary:hover {
                background: var(--bg-card-hover);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(30px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Close modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.style.animation = 'fadeOut 0.3s ease-in forwards';
        modal.querySelector('.modal-content').style.animation = 'slideDown 0.3s ease-in forwards';
        
        if (!document.querySelector('#modal-out-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-out-styles';
            style.textContent = `
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                
                @keyframes slideDown {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(30px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => modal.remove(), 300);
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.querySelector('.modal-close').click();
        }
    });
}

// ===== ACTION CARDS FUNCTIONALITY =====
actionCards.forEach(card => {
    card.addEventListener('click', () => {
        const action = card.dataset.action;
        
        switch(action) {
            case 'export':
                showNotification('Preparing export options...', 'info');
                openExportModal();
                break;
            case 'compare':
                showNotification('Opening region comparison tool...', 'info');
                document.getElementById('comparisonsLink').click();
                break;
            case 'alerts':
                showNotification('Opening alert settings...', 'info');
                openAlertSettings();
                break;
            case 'schedule':
                showNotification('Opening report scheduler...', 'info');
                openScheduler();
                break;
        }
    });
});

function openExportModal() {
    showNotification('Export modal would open here with format options', 'info');
    // In a full implementation, this would open a modal with export options
}

// ===== ACTIVITY ITEMS INTERACTIONS =====
activityItems.forEach(item => {
    item.addEventListener('click', () => {
        const id = item.dataset.id;
        showNotification(`Opening activity details #${id}...`, 'info');
        // In a real app, this would show detailed activity info
    });
});

viewAllActivity?.addEventListener('click', (e) => {
    e.preventDefault();
    showNotification('Opening activity log...', 'info');
});

// ===== REPORT SUBMISSION FUNCTIONALITY =====
reportForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const report = {
        id: Date.now(),
        serviceType: document.getElementById('serviceType').value,
        reportStatus: document.getElementById('reportStatus').value,
        region: document.getElementById('region').value,
        severity: document.getElementById('severity').value,
        description: document.getElementById('description').value,
        duration: document.getElementById('duration').value || '0',
        affectedUsers: document.getElementById('affectedUsers').value || '0',
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // Validate
    if (!report.serviceType || !report.reportStatus || !report.region || !report.severity || !report.description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Add to storage
    reportsData.unshift(report);
    localStorage.setItem('infraReports', JSON.stringify(reportsData));
    
    // Clear form
    reportForm.reset();
    
    // Show success message
    showNotification('Report submitted successfully!', 'success');
    
    // Update recent reports list
    updateRecentReports();
    
    // Simulate updating stats
    simulateReportImpact(report);
});

function updateRecentReports() {
    if (!recentReportsList) return;
    
    const recent = reportsData.slice(0, 5);
    recentReportsList.innerHTML = recent.map(report => `
        <div class="recent-report-item">
            <div class="report-service">
                <i class="fas ${serviceData[report.serviceType]?.icon || 'fa-question'}"></i>
                ${report.serviceType.charAt(0).toUpperCase() + report.serviceType.slice(1)}
            </div>
            <div class="report-info">
                <div class="report-region">${report.region}</div>
                <div class="report-time">${new Date(report.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
            <div class="report-severity severity-${report.severity}">
                ${report.severity}
            </div>
        </div>
    `).join('');
}

function simulateReportImpact(report) {
    // Update relevant stat card
    const statCard = document.querySelector(`.stat-card[data-section="${report.serviceType}"]`);
    if (statCard) {
        const valueElement = statCard.querySelector('.stat-value');
        const currentValue = parseInt(valueElement.textContent);
        const newValue = Math.max(50, currentValue - (report.severity === 'critical' ? 3 : 1));
        
        animateValueChange(valueElement, currentValue, newValue);
    }
}

cancelReport?.addEventListener('click', () => {
    reportForm.reset();
    showNotification('Report form cleared', 'info');
});

// ===== CHART FUNCTIONALITY =====
function initializePerformanceChart() {
    if (!performanceChart) return;
    
    const ctx = performanceChart.getContext('2d');
    
    // Generate time labels based on selected range
    const generateTimeLabels = (range) => {
        switch(range) {
            case '1h': return Array.from({length: 12}, (_, i) => `${i * 5}m ago`);
            case '6h': return ['6h ago', '5h ago', '4h ago', '3h ago', '2h ago', '1h ago', 'Now'];
            case '12h': return ['12h ago', '10h ago', '8h ago', '6h ago', '4h ago', '2h ago', 'Now'];
            case '24h': return ['24h ago', '20h ago', '16h ago', '12h ago', '8h ago', '4h ago', 'Now'];
            case '7d': return ['7d ago', '6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];
            default: return ['6h ago', '5h ago', '4h ago', '3h ago', '2h ago', '1h ago', 'Now'];
        }
    };
    
    const generateData = (base, variation) => {
        return generateTimeLabels(chartRange.value).map(() => 
            Math.max(50, Math.min(100, base + (Math.random() * variation * 2 - variation)))
        );
    };
    
    const data = {
        labels: generateTimeLabels(chartRange.value),
        datasets: [
            {
                label: 'Power Reliability',
                data: generateData(87, 8),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            },
            {
                label: 'Water Availability',
                data: generateData(79, 12),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            },
            {
                label: 'Internet Speed',
                data: generateData(92, 5),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            },
            {
                label: 'Overall Score',
                data: generateData(86, 6),
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }
        ]
    };
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f7fafc',
                    bodyColor: '#cbd5e0',
                    borderColor: '#2d3748',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#cbd5e0'
                    }
                },
                y: {
                    min: 50,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#cbd5e0',
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
    
    // Update stats
    updateChartStats();
}

function updateChartStats() {
    const currentAvg = document.getElementById('currentAvg');
    const peakToday = document.getElementById('peakToday');
    const lowestToday = document.getElementById('lowestToday');
    
    if (currentAvg && peakToday && lowestToday) {
        const avg = 85 + Math.random() * 3;
        const peak = 90 + Math.random() * 5;
        const low = 75 + Math.random() * 5;
        
        currentAvg.textContent = `${avg.toFixed(1)}%`;
        peakToday.textContent = `${peak.toFixed(1)}%`;
        lowestToday.textContent = `${low.toFixed(1)}%`;
    }
}

chartRange?.addEventListener('change', () => {
    initializePerformanceChart();
    showNotification(`Chart updated to show ${chartRange.options[chartRange.selectedIndex].text}`, 'info');
});

refreshChart?.addEventListener('click', () => {
    initializePerformanceChart();
    showNotification('Chart refreshed with latest data', 'success');
});

autoRefresh?.addEventListener('change', (e) => {
    if (e.target.checked) {
        autoRefreshInterval = setInterval(() => {
            initializePerformanceChart();
            showNotification('Chart auto-refreshed', 'info', 2000);
        }, 30000);
        showNotification('Auto-refresh enabled (every 30s)', 'success');
    } else {
        clearInterval(autoRefreshInterval);
        showNotification('Auto-refresh disabled', 'info');
    }
});

// ===== PANEL TOGGLE =====
togglePanel?.addEventListener('click', () => {
    panelBody.classList.toggle('collapsed');
    const icon = togglePanel.querySelector('i');
    icon.classList.toggle('fa-chevron-up');
    icon.classList.toggle('fa-chevron-down');
});

// ===== ACTION BUTTONS =====
exportBtn?.addEventListener('click', () => {
    showNotification('Exporting PDF report...', 'info');
    // Simulate export process
    setTimeout(() => {
        showNotification('PDF report exported successfully!', 'success');
    }, 1500);
});

printBtn?.addEventListener('click', () => {
    showNotification('Opening print preview...', 'info');
    setTimeout(() => {
        window.print();
    }, 500);
});

shareBtn?.addEventListener('click', () => {
    showNotification('Opening share options...', 'info');
    // In a real app, this would open a share dialog
});

// ===== BACK TO TOP FUNCTIONALITY =====
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

backToTop?.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ===== ADDITIONAL CHART FUNCTIONS =====
function initializeAnalysisCharts() {
    // These would initialize the detailed analysis charts
    setTimeout(() => {
        const powerChart = document.getElementById('powerAnalysisChart');
        const waterChart = document.getElementById('waterAnalysisChart');
        
        if (powerChart) {
            powerChart.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Power analysis chart would appear here</p>
                </div>
            `;
        }
        
        if (waterChart) {
            waterChart.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Water analysis chart would appear here</p>
                </div>
            `;
        }
    }, 100);
}

function initializeTrendsChart() {
    const canvas = document.getElementById('trendsChart');
    if (!canvas) return;
    
    // Similar to initializePerformanceChart but for trends
    setTimeout(() => {
        canvas.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Historical trends chart would appear here</p>
                <p style="font-size: 0.9rem; margin-top: 1rem;">Showing 12-month trend analysis</p>
            </div>
        `;
    }, 100);
}

function initializeComparisonChart() {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    
    setTimeout(() => {
        canvas.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Regional comparison chart would appear here</p>
                <p style="font-size: 0.9rem; margin-top: 1rem;">Comparing ${regions.length} regions</p>
            </div>
        `;
    }, 100);
}

// ===== INITIALIZE ON LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('InfraTrack Global Dashboard initialized');
    
    // Initialize performance chart
    initializePerformanceChart();
    
    // Update recent reports
    updateRecentReports();
    
    // Add sample data if empty
    if (reportsData.length === 0) {
        reportsData = [
            {
                id: 1,
                serviceType: 'power',
                reportStatus: 'outage',
                region: 'bastos',
                severity: 'critical',
                description: 'Power outage affecting 500+ households',
                duration: '2.5',
                affectedUsers: '500',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                status: 'investigating'
            },
            {
                id: 2,
                serviceType: 'water',
                reportStatus: 'restored',
                region: 'melen',
                severity: 'medium',
                description: 'Water pressure restored after maintenance',
                duration: '4',
                affectedUsers: '200',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                status: 'resolved'
            }
        ];
        localStorage.setItem('infraReports', JSON.stringify(reportsData));
        updateRecentReports();
    }
    
    // Add welcome notification
    setTimeout(() => {
        showNotification('Welcome to InfraTrack Global Dashboard!', 'success');
        showNotification('Real-time data is being loaded...', 'info', 3000);
    }, 1000);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl + E for export
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportBtn?.click();
            showNotification('Export shortcut activated', 'info', 2000);
        }
        
        // Ctrl + P for print
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            printBtn?.click();
            showNotification('Print shortcut activated', 'info', 2000);
        }
        
        // Esc to close modals
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => {
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) closeBtn.click();
            });
        }
    });
    
    // Add network status monitoring (simulated)
    simulateNetworkStatus();
});

function simulateNetworkStatus() {
    // Simulate real-time updates
    setInterval(() => {
        // Randomly update some stats
        const randomCard = statCards[Math.floor(Math.random() * statCards.length)];
        if (randomCard && !randomCard.classList.contains('overall')) {
            const valueElement = randomCard.querySelector('.stat-value');
            if (valueElement) {
                const current = parseInt(valueElement.textContent);
                const change = (Math.random() * 2) - 1; // -1 to +1
                const newValue = Math.max(50, Math.min(99, current + change));
                
                if (Math.abs(newValue - current) > 0.5) {
                    animateValueChange(valueElement, current, newValue);
                }
            }
        }
        
        // Occasionally show network alerts
        if (Math.random() > 0.9) {
            const services = ['power', 'water', 'internet'];
            const randomService = services[Math.floor(Math.random() * services.length)];
            const statuses = ['restored', 'outage', 'maintenance'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            showNotification(`${serviceData[randomService].name} service ${randomStatus} reported in ${regions[Math.floor(Math.random() * regions.length)].name}`, 
                           randomStatus === 'outage' ? 'warning' : 'info', 
                           5000);
        }
    }, 10000); // Every 10 seconds
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('Dashboard error:', e.error);
    showNotification('An error occurred. Please refresh the page.', 'error', 5000);
});

// Export for testing
window.infraDashboard = {
    showNotification,
    updateStatsForDateRange,
    initializePerformanceChart,
    getReports: () => reportsData
};
// Add this to your existing script.js

// ===== DROPDOWN MENU FUNCTIONALITY =====
const dropdownToggle = document.querySelector('.dropdown-toggle');
const dropdownMenu = document.querySelector('.dropdown-menu');
const liveMonitorLink = document.getElementById('liveMonitorLink');
const addReportLink = document.getElementById('addReportLink');
const liveMonitorSection = document.getElementById('live-monitor');
const addReportSection = document.getElementById('add-report');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuClose = document.getElementById('mobileMenuClose');

// Toggle dropdown menu
dropdownToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    dropdownMenu?.classList.remove('show');
});

// Handle live monitor link click
liveMonitorLink?.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Hide all sections first
    document.querySelectorAll('.hidden-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show live monitor section
    liveMonitorSection?.classList.add('active');
    
    // Scroll to section
    liveMonitorSection?.scrollIntoView({ behavior: 'smooth' });
    
    // Initialize chart if needed
    if (liveMonitorSection?.classList.contains('active')) {
        setTimeout(() => {
            initializePerformanceChart();
        }, 300);
    }
    
    showNotification('Live Performance Monitor opened', 'info');
});

// Handle add report link click
addReportLink?.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Hide all sections first
    document.querySelectorAll('.hidden-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show add report section
    addReportSection?.classList.add('active');
    
    // Scroll to section
    addReportSection?.scrollIntoView({ behavior: 'smooth' });
    
    // Update recent reports
    updateRecentReports();
    
    showNotification('Add New Report form opened', 'info');
});

// Mobile menu functionality
mobileMenuToggle?.addEventListener('click', () => {
    mobileMenu.classList.add('active');
});

mobileMenuClose?.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.mobile-menu-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        mobileMenu.classList.remove('active');
    }
});

// Add keyboard shortcut for opening live monitor (Ctrl+L)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        liveMonitorLink?.click();
    }
    
    // Ctrl+R for add report
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        addReportLink?.click();
    }
});

// Update the initialization to show/hide sections properly
document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization code ...
    
    // Ensure hidden sections are properly hidden on load
    document.querySelectorAll('.hidden-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Handle hash changes for direct links
    if (window.location.hash === '#live-monitor') {
        liveMonitorLink?.click();
    } else if (window.location.hash === '#add-report') {
        addReportLink?.click();
    }
    
    // Add window hash change listener
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#live-monitor') {
            liveMonitorLink?.click();
        } else if (window.location.hash === '#add-report') {
            addReportLink?.click();
        } else {
            // Hide all hidden sections when hash is removed
            document.querySelectorAll('.hidden-section').forEach(section => {
                section.classList.remove('active');
            });
        }
    });
});