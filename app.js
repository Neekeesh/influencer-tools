// Creator data
const creatorsData = [
    {
        id: 1,
        name: "Kim Kardashian",
        username: "@kimkardashian",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kim",
        badge: "Aspirational",
        country: "United States",
        language: "English",
        instagram: "353.8M",
        tiktok: "12.4M",
        twitter: "75.2M",
        totalAudience: "441.4M",
        engagementRate: "0.37%",
        avgViews: "15.9M",
        brandFitScore: 87,
        sponsorshipDensity: "54.46%",
        categories: ["Fashion", "Beauty", "Lifestyle", "Lingerie & Intimates", "Luxury"]
    },
    {
        id: 2,
        name: "Charli D'Amelio",
        username: "@charlidamelio",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charli",
        badge: "Gen-Z Icon",
        country: "United States",
        language: "English",
        instagram: "55.2M",
        tiktok: "155.3M",
        twitter: "5.8M",
        totalAudience: "216.3M",
        engagementRate: "2.8%",
        avgViews: "8.2M",
        brandFitScore: 92,
        sponsorshipDensity: "38.2%",
        categories: ["Dance", "Lifestyle", "Fashion", "Entertainment"]
    },
    {
        id: 3,
        name: "MrBeast",
        username: "@mrbeast",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=MrBeast",
        badge: "Mega Creator",
        country: "United States",
        language: "English",
        instagram: "58.7M",
        tiktok: "98.4M",
        twitter: "31.2M",
        totalAudience: "188.3M",
        engagementRate: "4.2%",
        avgViews: "125M",
        brandFitScore: 94,
        sponsorshipDensity: "22.1%",
        categories: ["Entertainment", "Philanthropy", "Gaming", "Challenges"]
    },
    {
        id: 4,
        name: "Addison Rae",
        username: "@addisonraee",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Addison",
        badge: "Rising Star",
        country: "United States",
        language: "English",
        instagram: "38.6M",
        tiktok: "88.7M",
        twitter: "4.9M",
        totalAudience: "132.2M",
        engagementRate: "3.1%",
        avgViews: "4.5M",
        brandFitScore: 88,
        sponsorshipDensity: "41.5%",
        categories: ["Dance", "Beauty", "Fashion", "Music"]
    },
    {
        id: 5,
        name: "Khaby Lame",
        username: "@khaby.lame",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Khaby",
        badge: "Global Sensation",
        country: "Italy",
        language: "Italian, English",
        instagram: "80.8M",
        tiktok: "162.4M",
        twitter: "1.2M",
        totalAudience: "244.4M",
        engagementRate: "5.8%",
        avgViews: "45M",
        brandFitScore: 96,
        sponsorshipDensity: "18.3%",
        categories: ["Comedy", "Entertainment", "Lifestyle"]
    }
];

let selectedCreator = null;

// DOM Elements
const searchInput = document.getElementById('creator-search');
const searchDropdown = document.getElementById('search-dropdown');
const searchView = document.getElementById('search-view');
const loadingOverlay = document.getElementById('loading-overlay');
const reportView = document.getElementById('report-view');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    setupTabs();
    setupHeaderActions();
    initializeTabContent();
});

// Search Functionality
function setupSearch() {
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('focus', handleSearch);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchDropdown.classList.add('hidden');
        }
    });
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (query.length === 0) {
        renderCreatorResults(creatorsData);
    } else {
        const filtered = creatorsData.filter(creator =>
            creator.name.toLowerCase().includes(query) ||
            creator.username.toLowerCase().includes(query) ||
            creator.categories.some(cat => cat.toLowerCase().includes(query))
        );
        renderCreatorResults(filtered);
    }

    searchDropdown.classList.remove('hidden');
}

function renderCreatorResults(creators) {
    if (creators.length === 0) {
        searchDropdown.innerHTML = `
            <div style="padding: 24px; text-align: center; color: var(--gray-500);">
                No creators found matching your search
            </div>
        `;
        return;
    }

    searchDropdown.innerHTML = creators.map(creator => `
        <div class="creator-result" data-id="${creator.id}">
            <img src="${creator.avatar}" alt="${creator.name}" class="result-avatar">
            <div class="result-info">
                <div class="result-name-row">
                    <span class="result-name">${creator.name}</span>
                    <span class="result-username">${creator.username}</span>
                </div>
                <div class="result-platforms">
                    <span class="platform-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="2"></rect>
                            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"></circle>
                        </svg>
                        ${creator.instagram}
                    </span>
                    <span class="platform-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        ${creator.tiktok}
                    </span>
                </div>
            </div>
            <div class="result-metrics">
                <span class="metric-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    ${creator.engagementRate} ER
                </span>
                <span class="metric-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    ${creator.avgViews} views
                </span>
            </div>
            <button class="btn-get-report" onclick="requestReport(${creator.id})">Get Full Report</button>
        </div>
    `).join('');
}

// Report Request
function requestReport(creatorId) {
    selectedCreator = creatorsData.find(c => c.id === creatorId);
    if (!selectedCreator) return;

    searchDropdown.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');

    startLoadingAnimation();
}

function startLoadingAnimation() {
    const steps = loadingOverlay.querySelectorAll('.progress-step');
    const progressBar = document.getElementById('loading-progress');
    let currentStep = 0;

    const stepDurations = [800, 1200, 1000, 600];
    const totalDuration = stepDurations.reduce((a, b) => a + b, 0);
    let elapsed = 0;

    function processStep() {
        if (currentStep >= steps.length) {
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                showReport();
            }, 300);
            return;
        }

        // Update previous step to completed
        if (currentStep > 0) {
            steps[currentStep - 1].classList.remove('active');
            steps[currentStep - 1].classList.add('completed');
            steps[currentStep - 1].querySelector('.step-status').textContent = 'Complete';
        }

        // Set current step to active
        steps[currentStep].classList.add('active');
        steps[currentStep].querySelector('.step-status').textContent = 'In progress...';

        // Update progress bar
        elapsed += stepDurations[currentStep];
        progressBar.style.width = `${(elapsed / totalDuration) * 100}%`;

        currentStep++;
        setTimeout(processStep, stepDurations[currentStep - 1]);
    }

    // Reset all steps
    steps.forEach(step => {
        step.classList.remove('active', 'completed');
        step.querySelector('.step-status').textContent = 'Pending';
    });
    progressBar.style.width = '0%';

    setTimeout(processStep, 300);
}

function showReport() {
    searchView.classList.remove('active');
    reportView.classList.remove('hidden');
    reportView.classList.add('active');

    populateReportData();
}

function populateReportData() {
    if (!selectedCreator) return;

    // Populate header info
    document.getElementById('creator-avatar').src = selectedCreator.avatar;
    document.getElementById('creator-name').textContent = selectedCreator.name;
    document.getElementById('creator-username').textContent = selectedCreator.username;
    document.getElementById('creator-badge').textContent = selectedCreator.badge;
    document.getElementById('creator-country').textContent = selectedCreator.country;
    document.getElementById('creator-language').textContent = selectedCreator.language;
    document.getElementById('instagram-followers').textContent = selectedCreator.instagram;
    document.getElementById('tiktok-followers').textContent = selectedCreator.tiktok;
    document.getElementById('twitter-followers').textContent = selectedCreator.twitter;
    document.getElementById('brand-fit-score').textContent = selectedCreator.brandFitScore;
    document.getElementById('total-audience').textContent = selectedCreator.totalAudience;
    document.getElementById('sponsorship-density').textContent = selectedCreator.sponsorshipDensity;

    // Update category tags
    const tagsContainer = document.getElementById('category-tags');
    tagsContainer.innerHTML = selectedCreator.categories.map(cat =>
        `<span class="tag">${cat}</span>`
    ).join('');

    // Update score ring
    const scoreRing = document.querySelector('.score-fill');
    const dashOffset = 314 - (selectedCreator.brandFitScore / 100) * 314;
    scoreRing.setAttribute('stroke-dashoffset', dashOffset);
}

// Tab Functionality
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Update button states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

// Header Actions
function setupHeaderActions() {
    document.getElementById('btn-favorite').addEventListener('click', () => {
        const btn = document.getElementById('btn-favorite');
        btn.classList.toggle('favorited');
        const svg = btn.querySelector('svg');
        if (btn.classList.contains('favorited')) {
            svg.setAttribute('fill', 'currentColor');
            btn.style.color = '#f59e0b';
        } else {
            svg.setAttribute('fill', 'none');
            btn.style.color = '';
        }
    });

    document.getElementById('btn-share').addEventListener('click', () => {
        alert('Share link copied to clipboard!');
    });

    document.getElementById('btn-export').addEventListener('click', () => {
        alert('PDF export started. Your report will download shortly.');
    });
}

// Initialize Tab Content
function initializeTabContent() {
    initAudienceTab();
    initEngagementTab();
    initSponsorshipTab();
    initContentTab();
    initBrandSafetyTab();
    initValueTab();
}

function initAudienceTab() {
    const container = document.getElementById('tab-audience');
    container.innerHTML = `
        <div class="overview-grid">
            <div class="overview-left">
                <div class="card">
                    <h3>Audience Geography</h3>
                    <div class="geo-chart">
                        <div class="geo-bar-container">
                            <div class="geo-bar" style="width: 100%;">
                                <span class="geo-segment us" style="width: 30.6%;"></span>
                                <span class="geo-segment br" style="width: 6%;"></span>
                                <span class="geo-segment in" style="width: 4.3%;"></span>
                                <span class="geo-segment uk" style="width: 3.3%;"></span>
                                <span class="geo-segment fr" style="width: 3%;"></span>
                                <span class="geo-segment other" style="width: 52.8%;"></span>
                            </div>
                        </div>
                    </div>
                    <div class="geo-list">
                        <div class="geo-item"><span class="geo-dot us"></span> United States <span class="geo-percent">30.6%</span></div>
                        <div class="geo-item"><span class="geo-dot br"></span> Brazil <span class="geo-percent">6%</span></div>
                        <div class="geo-item"><span class="geo-dot in"></span> India <span class="geo-percent">4.3%</span></div>
                        <div class="geo-item"><span class="geo-dot uk"></span> United Kingdom <span class="geo-percent">3.3%</span></div>
                        <div class="geo-item"><span class="geo-dot fr"></span> France <span class="geo-percent">3%</span></div>
                        <div class="geo-item"><span class="geo-dot ca"></span> Canada <span class="geo-percent">2.3%</span></div>
                        <div class="geo-item"><span class="geo-dot it"></span> Italy <span class="geo-percent">2.3%</span></div>
                        <div class="geo-item"><span class="geo-dot mx"></span> Mexico <span class="geo-percent">2.1%</span></div>
                        <div class="geo-item"><span class="geo-dot" style="background: #0ea5e9;"></span> Germany <span class="geo-percent">2.0%</span></div>
                        <div class="geo-item"><span class="geo-dot" style="background: #8b5cf6;"></span> Australia <span class="geo-percent">1.8%</span></div>
                    </div>
                </div>

                <div class="card audience-type">
                    <h3>Audience Type</h3>
                    <div class="donut-chart-container">
                        <svg class="donut-chart" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" stroke-width="30" stroke-dasharray="359.2 502.4" stroke-dashoffset="0" transform="rotate(-90 100 100)"/>
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#3b82f6" stroke-width="30" stroke-dasharray="67.9 502.4" stroke-dashoffset="-359.2" transform="rotate(-90 100 100)"/>
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#f59e0b" stroke-width="30" stroke-dasharray="68.4 502.4" stroke-dashoffset="-427.1" transform="rotate(-90 100 100)"/>
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#6366f1" stroke-width="30" stroke-dasharray="8 502.4" stroke-dashoffset="-495.5" transform="rotate(-90 100 100)"/>
                        </svg>
                        <div class="donut-center">
                            <span class="donut-label">Real People</span>
                            <span class="donut-value">71.3%</span>
                        </div>
                    </div>
                    <div class="audience-legend">
                        <div class="legend-item"><span class="legend-dot" style="background: #10b981;"></span> Real People <span>71.3%</span></div>
                        <div class="legend-item"><span class="legend-dot" style="background: #3b82f6;"></span> Mass Followers <span>13.5%</span></div>
                        <div class="legend-item"><span class="legend-dot" style="background: #f59e0b;"></span> Suspicious <span>13.6%</span></div>
                        <div class="legend-item"><span class="legend-dot" style="background: #6366f1;"></span> Influencers <span>1.6%</span></div>
                    </div>
                </div>

                <div class="card">
                    <h3>Audience Credibility</h3>
                    <div class="use-case-bars">
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Authentic Engagement</span>
                                <span class="use-case-value">73%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 73%; background: #10b981;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Comment Quality</span>
                                <span class="use-case-value">68%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 68%; background: #10b981;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Follower Growth Authenticity</span>
                                <span class="use-case-value">81%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 81%; background: #10b981;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Bot Detection Score</span>
                                <span class="use-case-value">86%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 86%; background: #10b981;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="overview-right">
                <div class="card demographics">
                    <h3>Age & Gender Demographics</h3>
                    <div class="demographics-chart">
                        <div class="demo-bars">
                            <div class="demo-group">
                                <div class="demo-bars-container">
                                    <div class="demo-bar male" style="height: 5%;"></div>
                                    <div class="demo-bar female" style="height: 8%;"></div>
                                </div>
                                <span class="demo-label">13-17</span>
                            </div>
                            <div class="demo-group">
                                <div class="demo-bars-container">
                                    <div class="demo-bar male" style="height: 18%;"></div>
                                    <div class="demo-bar female" style="height: 28%;"></div>
                                </div>
                                <span class="demo-label">18-24</span>
                            </div>
                            <div class="demo-group">
                                <div class="demo-bars-container">
                                    <div class="demo-bar male" style="height: 25%;"></div>
                                    <div class="demo-bar female" style="height: 40%;"></div>
                                </div>
                                <span class="demo-label">25-34</span>
                            </div>
                            <div class="demo-group">
                                <div class="demo-bars-container">
                                    <div class="demo-bar male" style="height: 15%;"></div>
                                    <div class="demo-bar female" style="height: 22%;"></div>
                                </div>
                                <span class="demo-label">35-44</span>
                            </div>
                            <div class="demo-group">
                                <div class="demo-bars-container">
                                    <div class="demo-bar male" style="height: 8%;"></div>
                                    <div class="demo-bar female" style="height: 12%;"></div>
                                </div>
                                <span class="demo-label">45-54</span>
                            </div>
                            <div class="demo-group">
                                <div class="demo-bars-container">
                                    <div class="demo-bar male" style="height: 4%;"></div>
                                    <div class="demo-bar female" style="height: 6%;"></div>
                                </div>
                                <span class="demo-label">55-64</span>
                            </div>
                            <div class="demo-group">
                                <div class="demo-bars-container">
                                    <div class="demo-bar male" style="height: 2%;"></div>
                                    <div class="demo-bar female" style="height: 3%;"></div>
                                </div>
                                <span class="demo-label">65+</span>
                            </div>
                        </div>
                        <div class="demo-legend">
                            <span class="demo-legend-item"><span class="demo-dot male"></span> Male 38.5%</span>
                            <span class="demo-legend-item"><span class="demo-dot female"></span> Female 61.5%</span>
                        </div>
                    </div>
                </div>

                <div class="card interests">
                    <h3>Audience Interests</h3>
                    <div class="interests-grid">
                        <div class="interest-item">
                            <span class="interest-name">Fashion</span>
                            <div class="interest-bar">
                                <div class="interest-fill" style="width: 79%;"></div>
                            </div>
                            <span class="interest-value">79%</span>
                        </div>
                        <div class="interest-item">
                            <span class="interest-name">Beauty</span>
                            <div class="interest-bar">
                                <div class="interest-fill" style="width: 65%;"></div>
                            </div>
                            <span class="interest-value">65%</span>
                        </div>
                        <div class="interest-item">
                            <span class="interest-name">Modeling</span>
                            <div class="interest-bar">
                                <div class="interest-fill" style="width: 53%;"></div>
                            </div>
                            <span class="interest-value">53%</span>
                        </div>
                        <div class="interest-item">
                            <span class="interest-name">Traveling</span>
                            <div class="interest-bar">
                                <div class="interest-fill" style="width: 51%;"></div>
                            </div>
                            <span class="interest-value">51%</span>
                        </div>
                        <div class="interest-item">
                            <span class="interest-name">Luxury</span>
                            <div class="interest-bar">
                                <div class="interest-fill" style="width: 45%;"></div>
                            </div>
                            <span class="interest-value">45%</span>
                        </div>
                        <div class="interest-item">
                            <span class="interest-name">Film & TV</span>
                            <div class="interest-bar">
                                <div class="interest-fill" style="width: 42%;"></div>
                            </div>
                            <span class="interest-value">42%</span>
                        </div>
                        <div class="interest-item">
                            <span class="interest-name">Makeup</span>
                            <div class="interest-bar">
                                <div class="interest-fill" style="width: 39%;"></div>
                            </div>
                            <span class="interest-value">39%</span>
                        </div>
                        <div class="interest-item">
                            <span class="interest-name">Dance</span>
                            <div class="interest-bar">
                                <div class="interest-fill" style="width: 38%;"></div>
                            </div>
                            <span class="interest-value">38%</span>
                        </div>
                        <div class="interest-item">
                            <span class="interest-name">Entertainment</span>
                            <div class="interest-bar">
                                <div class="interest-fill" style="width: 37%;"></div>
                            </div>
                            <span class="interest-value">37%</span>
                        </div>
                        <div class="interest-item">
                            <span class="interest-name">Fitness</span>
                            <div class="interest-bar">
                                <div class="interest-fill" style="width: 34%;"></div>
                            </div>
                            <span class="interest-value">34%</span>
                        </div>
                    </div>
                </div>

                <div class="card income">
                    <h3>Audience Yearly Household Income</h3>
                    <div class="income-bars">
                        <div class="income-item">
                            <span class="income-label">$0K - $5K</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 17.4%;"></div>
                            </div>
                            <span class="income-value">17.4%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">$5K - $10K</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 13.9%;"></div>
                            </div>
                            <span class="income-value">13.9%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">$10K - $25K</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 19.5%;"></div>
                            </div>
                            <span class="income-value">19.5%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">$25K - $50K</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 15.3%;"></div>
                            </div>
                            <span class="income-value">15.3%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">$50K - $75K</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 10.7%;"></div>
                            </div>
                            <span class="income-value">10.7%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">$75K - $100K</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 7.6%;"></div>
                            </div>
                            <span class="income-value">7.6%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">$100K - $150K</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 8.7%;"></div>
                            </div>
                            <span class="income-value">8.7%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">$150K - $200K</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 3.9%;"></div>
                            </div>
                            <span class="income-value">3.9%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">$200K+</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 3.1%;"></div>
                            </div>
                            <span class="income-value">3.1%</span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Audience Language Distribution</h3>
                    <div class="income-bars">
                        <div class="income-item">
                            <span class="income-label">English</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 68%;"></div>
                            </div>
                            <span class="income-value">68%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">Spanish</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 12%;"></div>
                            </div>
                            <span class="income-value">12%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">Portuguese</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 8%;"></div>
                            </div>
                            <span class="income-value">8%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">French</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 5%;"></div>
                            </div>
                            <span class="income-value">5%</span>
                        </div>
                        <div class="income-item">
                            <span class="income-label">Other</span>
                            <div class="income-bar">
                                <div class="income-fill" style="width: 7%;"></div>
                            </div>
                            <span class="income-value">7%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initEngagementTab() {
    const container = document.getElementById('tab-engagement');
    container.innerHTML = `
        <div class="kpi-row" style="margin-bottom: 24px;">
            <div class="kpi-card">
                <div class="kpi-icon likes">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                </div>
                <div class="kpi-content">
                    <span class="kpi-label">Avg. Likes</span>
                    <span class="kpi-value">1.3M</span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon comments">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <div class="kpi-content">
                    <span class="kpi-label">Avg. Comments</span>
                    <span class="kpi-value">4.5K</span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon views">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </div>
                <div class="kpi-content">
                    <span class="kpi-label">Avg. Views</span>
                    <span class="kpi-value">15.9M</span>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon authentic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                </div>
                <div class="kpi-content">
                    <span class="kpi-label">Authentic Engagement</span>
                    <span class="kpi-value">948.6K</span>
                    <span class="kpi-sub">per post</span>
                </div>
            </div>
        </div>

        <div class="overview-grid">
            <div class="overview-left">
                <div class="card engagement-rate">
                    <h3>Engagement Rate</h3>
                    <div class="engagement-display">
                        <span class="engagement-value">0.37%</span>
                        <span class="engagement-label">Average, compared to other 1M+ followers accounts</span>
                    </div>
                    <div class="engagement-meter">
                        <div class="meter-bar">
                            <div class="meter-fill" style="width: 50%;"></div>
                            <div class="meter-marker" style="left: 50%;"></div>
                        </div>
                        <div class="meter-labels">
                            <span>Low</span>
                            <span class="meter-status">Average</span>
                            <span>Excellent</span>
                        </div>
                    </div>
                </div>

                <div class="card comment-quality">
                    <h3>Comment Quality Analysis</h3>
                    <div class="quality-metrics">
                        <div class="quality-item">
                            <span class="quality-label">Comment Depth</span>
                            <span class="quality-value badge">Short</span>
                        </div>
                        <div class="quality-item">
                            <span class="quality-label">Question Density</span>
                            <div class="quality-bar">
                                <div class="quality-fill" style="width: 12%;"></div>
                            </div>
                            <span class="quality-value">12%</span>
                        </div>
                        <div class="quality-item">
                            <span class="quality-label">Creator Reply Rate</span>
                            <div class="quality-bar">
                                <div class="quality-fill low" style="width: 5%;"></div>
                            </div>
                            <span class="quality-value">0.5%</span>
                        </div>
                        <div class="quality-item">
                            <span class="quality-label">Positive Sentiment</span>
                            <div class="quality-bar">
                                <div class="quality-fill" style="width: 74%;"></div>
                            </div>
                            <span class="quality-value">74%</span>
                        </div>
                    </div>
                </div>

                <div class="card engagement-stability">
                    <h3>Engagement Stability</h3>
                    <div class="stability-score">
                        <div class="stability-circle">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" stroke-width="8" stroke-dasharray="183 251" stroke-linecap="round" transform="rotate(-90 50 50)"/>
                            </svg>
                            <span class="stability-value">73%</span>
                        </div>
                        <div class="stability-info">
                            <strong>Good Stability</strong>
                            <p>Engagement variance between posts is within normal range</p>
                        </div>
                    </div>
                    <div class="stability-metric">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        <span>Likes spread: <strong>27%</strong> (similar accounts: 178%)</span>
                    </div>
                </div>
            </div>

            <div class="overview-right">
                <div class="card">
                    <h3>Engagement Rate History</h3>
                    <div class="line-chart" style="height: 200px;">
                        <svg viewBox="0 0 400 150" preserveAspectRatio="none" style="width: 100%; height: 100%;">
                            <defs>
                                <linearGradient id="engGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.3" />
                                    <stop offset="100%" style="stop-color:#10b981;stop-opacity:0" />
                                </linearGradient>
                            </defs>
                            <polyline fill="url(#engGradient)" stroke="none" points="0,150 0,120 57,115 114,105 171,95 228,80 285,85 342,70 400,65 400,150"/>
                            <polyline fill="none" stroke="#10b981" stroke-width="2" points="0,120 57,115 114,105 171,95 228,80 285,85 342,70 400,65"/>
                            <circle cx="0" cy="120" r="4" fill="#10b981"/>
                            <circle cx="57" cy="115" r="4" fill="#10b981"/>
                            <circle cx="114" cy="105" r="4" fill="#10b981"/>
                            <circle cx="171" cy="95" r="4" fill="#10b981"/>
                            <circle cx="228" cy="80" r="4" fill="#10b981"/>
                            <circle cx="285" cy="85" r="4" fill="#10b981"/>
                            <circle cx="342" cy="70" r="4" fill="#10b981"/>
                            <circle cx="400" cy="65" r="4" fill="#10b981"/>
                        </svg>
                        <div class="chart-labels">
                            <span>Jun 2023</span>
                            <span>Sep 2023</span>
                            <span>Dec 2023</span>
                            <span>Mar 2024</span>
                            <span>Jun 2024</span>
                            <span>Sep 2024</span>
                            <span>Dec 2024</span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Engagement by Content Type</h3>
                    <div class="use-case-bars">
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Reels/Short Videos</span>
                                <span class="use-case-value">2.1%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 85%; background: #10b981;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Carousel Posts</span>
                                <span class="use-case-value">0.8%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 55%; background: #3b82f6;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Single Images</span>
                                <span class="use-case-value">0.4%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 35%; background: #f59e0b;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Stories</span>
                                <span class="use-case-value">0.2%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 20%; background: #8b5cf6;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Best Posting Times</h3>
                    <div class="posting-grid" style="margin-bottom: 16px;">
                        ${generatePostingHeatmap()}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--gray-500);">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                    <div style="margin-top: 16px; display: flex; gap: 16px; font-size: 13px; color: var(--gray-600);">
                        <span>Peak hours: <strong>9 AM - 12 PM EST</strong></span>
                        <span>Best days: <strong>Wednesday, Saturday</strong></span>
                    </div>
                </div>

                <div class="card">
                    <h3>Engagement Comparison</h3>
                    <div class="comparison-bars">
                        <div class="comparison-item">
                            <div class="comparison-label">
                                <span>vs. Category Average</span>
                                <span style="color: var(--primary);">+15%</span>
                            </div>
                            <div class="comparison-bar-track">
                                <div class="comparison-bar-fill" style="width: 65%; background: var(--primary);"></div>
                            </div>
                        </div>
                        <div class="comparison-item">
                            <div class="comparison-label">
                                <span>vs. Similar Audience Size</span>
                                <span style="color: var(--warning);">-8%</span>
                            </div>
                            <div class="comparison-bar-track">
                                <div class="comparison-bar-fill" style="width: 42%; background: var(--warning);"></div>
                            </div>
                        </div>
                        <div class="comparison-item">
                            <div class="comparison-label">
                                <span>vs. Industry Benchmark</span>
                                <span style="color: var(--primary);">+22%</span>
                            </div>
                            <div class="comparison-bar-track">
                                <div class="comparison-bar-fill" style="width: 72%; background: var(--primary);"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generatePostingHeatmap() {
    const hours = 24;
    const days = 7;
    let html = '';
    for (let h = 0; h < hours; h++) {
        for (let d = 0; d < days; d++) {
            const intensity = Math.random();
            let cls = '';
            if (intensity > 0.7) cls = 'active-high';
            else if (intensity > 0.4) cls = 'active-medium';
            else if (intensity > 0.2) cls = 'active-low';
            html += `<div class="posting-day ${cls}"></div>`;
        }
    }
    return html;
}

function initSponsorshipTab() {
    const container = document.getElementById('tab-sponsorship');
    container.innerHTML = `
        <div class="metrics-row" style="margin-bottom: 24px;">
            <div class="mini-metric">
                <span class="mini-label">Branded Content</span>
                <span class="mini-value">54.46%</span>
                <span class="mini-percent" style="color: var(--warning);">High</span>
            </div>
            <div class="mini-metric">
                <span class="mini-label">Ad Frequency</span>
                <span class="mini-value">1 in 2</span>
                <span class="mini-percent">posts are sponsored</span>
            </div>
            <div class="mini-metric">
                <span class="mini-label">Avg. Ad Performance</span>
                <span class="mini-value">-12%</span>
                <span class="mini-percent">vs organic</span>
            </div>
            <div class="mini-metric">
                <span class="mini-label">Brand Partners</span>
                <span class="mini-value">47</span>
                <span class="mini-percent">in last 12 months</span>
            </div>
        </div>

        <div class="overview-grid">
            <div class="overview-left">
                <div class="card">
                    <h3>Ad vs Organic Performance</h3>
                    <div class="comparison-bars">
                        <div class="comparison-item">
                            <div class="comparison-label">
                                <span>Engagement Rate</span>
                            </div>
                            <div class="comparison-bar-group">
                                <div class="comparison-bar-row">
                                    <span class="comparison-bar-label">Ads</span>
                                    <div class="comparison-bar-track">
                                        <div class="comparison-bar-fill ad" style="width: 42%;"></div>
                                    </div>
                                    <span style="font-size: 12px; width: 40px;">0.32%</span>
                                </div>
                                <div class="comparison-bar-row">
                                    <span class="comparison-bar-label">Organic</span>
                                    <div class="comparison-bar-track">
                                        <div class="comparison-bar-fill organic" style="width: 55%;"></div>
                                    </div>
                                    <span style="font-size: 12px; width: 40px;">0.42%</span>
                                </div>
                            </div>
                        </div>
                        <div class="comparison-item">
                            <div class="comparison-label">
                                <span>Average Likes</span>
                            </div>
                            <div class="comparison-bar-group">
                                <div class="comparison-bar-row">
                                    <span class="comparison-bar-label">Ads</span>
                                    <div class="comparison-bar-track">
                                        <div class="comparison-bar-fill ad" style="width: 48%;"></div>
                                    </div>
                                    <span style="font-size: 12px; width: 40px;">1.1M</span>
                                </div>
                                <div class="comparison-bar-row">
                                    <span class="comparison-bar-label">Organic</span>
                                    <div class="comparison-bar-track">
                                        <div class="comparison-bar-fill organic" style="width: 62%;"></div>
                                    </div>
                                    <span style="font-size: 12px; width: 40px;">1.5M</span>
                                </div>
                            </div>
                        </div>
                        <div class="comparison-item">
                            <div class="comparison-label">
                                <span>Comments</span>
                            </div>
                            <div class="comparison-bar-group">
                                <div class="comparison-bar-row">
                                    <span class="comparison-bar-label">Ads</span>
                                    <div class="comparison-bar-track">
                                        <div class="comparison-bar-fill ad" style="width: 38%;"></div>
                                    </div>
                                    <span style="font-size: 12px; width: 40px;">3.2K</span>
                                </div>
                                <div class="comparison-bar-row">
                                    <span class="comparison-bar-label">Organic</span>
                                    <div class="comparison-bar-track">
                                        <div class="comparison-bar-fill organic" style="width: 58%;"></div>
                                    </div>
                                    <span style="font-size: 12px; width: 40px;">5.8K</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Category Saturation</h3>
                    <div class="saturation-bars">
                        <div class="saturation-item">
                            <span class="saturation-label">Fashion</span>
                            <div class="saturation-bar">
                                <div class="saturation-fill high" style="width: 78%;"></div>
                            </div>
                            <span class="saturation-value">78%</span>
                        </div>
                        <div class="saturation-item">
                            <span class="saturation-label">Beauty</span>
                            <div class="saturation-bar">
                                <div class="saturation-fill high" style="width: 65%;"></div>
                            </div>
                            <span class="saturation-value">65%</span>
                        </div>
                        <div class="saturation-item">
                            <span class="saturation-label">Luxury</span>
                            <div class="saturation-bar">
                                <div class="saturation-fill medium" style="width: 52%;"></div>
                            </div>
                            <span class="saturation-value">52%</span>
                        </div>
                        <div class="saturation-item">
                            <span class="saturation-label">Fitness</span>
                            <div class="saturation-bar">
                                <div class="saturation-fill low" style="width: 28%;"></div>
                            </div>
                            <span class="saturation-value">28%</span>
                        </div>
                        <div class="saturation-item">
                            <span class="saturation-label">Tech</span>
                            <div class="saturation-bar">
                                <div class="saturation-fill low" style="width: 15%;"></div>
                            </div>
                            <span class="saturation-value">15%</span>
                        </div>
                        <div class="saturation-item">
                            <span class="saturation-label">Food & Bev</span>
                            <div class="saturation-bar">
                                <div class="saturation-fill low" style="width: 12%;"></div>
                            </div>
                            <span class="saturation-value">12%</span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Suspected Hidden Placements</h3>
                    <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 8px; color: #92400e; margin-bottom: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <strong>8 posts flagged</strong>
                        </div>
                        <p style="font-size: 13px; color: #92400e;">Posts that may contain undisclosed brand partnerships based on visual and context analysis.</p>
                    </div>
                    <table class="brand-mentions-table">
                        <thead>
                            <tr>
                                <th>Post</th>
                                <th>Suspected Brand</th>
                                <th>Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Dec 15, 2024</td>
                                <td>Luxury Watch Brand</td>
                                <td><span class="status-badge suspected">High</span></td>
                            </tr>
                            <tr>
                                <td>Nov 28, 2024</td>
                                <td>Skincare Product</td>
                                <td><span class="status-badge suspected">Medium</span></td>
                            </tr>
                            <tr>
                                <td>Nov 12, 2024</td>
                                <td>Designer Handbag</td>
                                <td><span class="status-badge suspected">High</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="overview-right">
                <div class="card">
                    <h3>Detected Brand Mentions</h3>
                    <table class="brand-mentions-table">
                        <thead>
                            <tr>
                                <th>Brand</th>
                                <th>Posts</th>
                                <th>Avg. Engagement</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="brand-logo">SK</div>
                                        SKIMS
                                    </div>
                                </td>
                                <td>42</td>
                                <td>1.8M</td>
                                <td><span class="status-badge disclosed">Disclosed</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="brand-logo">BB</div>
                                        Balenciaga
                                    </div>
                                </td>
                                <td>18</td>
                                <td>2.1M</td>
                                <td><span class="status-badge disclosed">Disclosed</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="brand-logo">D&G</div>
                                        Dolce & Gabbana
                                    </div>
                                </td>
                                <td>12</td>
                                <td>1.5M</td>
                                <td><span class="status-badge disclosed">Disclosed</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="brand-logo">BM</div>
                                        Beats by Dre
                                    </div>
                                </td>
                                <td>8</td>
                                <td>1.2M</td>
                                <td><span class="status-badge disclosed">Disclosed</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="brand-logo">CF</div>
                                        Calvin Klein
                                    </div>
                                </td>
                                <td>6</td>
                                <td>1.4M</td>
                                <td><span class="status-badge disclosed">Disclosed</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="brand-logo">FT</div>
                                        Fendi
                                    </div>
                                </td>
                                <td>5</td>
                                <td>1.3M</td>
                                <td><span class="status-badge suspected">Suspected</span></td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="brand-logo">PR</div>
                                        Prada
                                    </div>
                                </td>
                                <td>4</td>
                                <td>1.6M</td>
                                <td><span class="status-badge disclosed">Disclosed</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="card">
                    <h3>Sponsorship Timeline</h3>
                    <div class="line-chart" style="height: 150px;">
                        <svg viewBox="0 0 400 120" preserveAspectRatio="none" style="width: 100%; height: 100%;">
                            <rect x="15" y="80" width="30" height="40" fill="#3b82f6" rx="4"/>
                            <rect x="60" y="60" width="30" height="60" fill="#3b82f6" rx="4"/>
                            <rect x="105" y="70" width="30" height="50" fill="#3b82f6" rx="4"/>
                            <rect x="150" y="50" width="30" height="70" fill="#3b82f6" rx="4"/>
                            <rect x="195" y="40" width="30" height="80" fill="#3b82f6" rx="4"/>
                            <rect x="240" y="30" width="30" height="90" fill="#3b82f6" rx="4"/>
                            <rect x="285" y="45" width="30" height="75" fill="#3b82f6" rx="4"/>
                            <rect x="330" y="35" width="30" height="85" fill="#3b82f6" rx="4"/>
                        </svg>
                        <div class="chart-labels">
                            <span>May</span>
                            <span>Jun</span>
                            <span>Jul</span>
                            <span>Aug</span>
                            <span>Sep</span>
                            <span>Oct</span>
                            <span>Nov</span>
                            <span>Dec</span>
                        </div>
                    </div>
                    <p style="font-size: 13px; color: var(--gray-500); margin-top: 12px;">Showing branded posts per month over the last 8 months</p>
                </div>

                <div class="card">
                    <h3>Exclusivity Conflicts</h3>
                    <div style="background: var(--gray-50); padding: 16px; border-radius: 8px;">
                        <p style="font-size: 14px; color: var(--gray-700); margin-bottom: 12px;">
                            <strong>Potential conflicts detected:</strong>
                        </p>
                        <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px;">
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--gray-600);">
                                <span style="color: var(--warning);">!</span>
                                Multiple luxury fashion brands promoted within 30 days
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--gray-600);">
                                <span style="color: var(--warning);">!</span>
                                Competing skincare brands featured in same month
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initContentTab() {
    const container = document.getElementById('tab-content');
    container.innerHTML = `
        <div class="overview-grid">
            <div class="overview-left">
                <div class="card">
                    <h3>Content Format Mix</h3>
                    <div class="donut-chart-container">
                        <svg class="donut-chart" viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" stroke-width="30" stroke-dasharray="201.6 502.4" stroke-dashoffset="0" transform="rotate(-90 100 100)"/>
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#3b82f6" stroke-width="30" stroke-dasharray="150.7 502.4" stroke-dashoffset="-201.6" transform="rotate(-90 100 100)"/>
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#f59e0b" stroke-width="30" stroke-dasharray="100.5 502.4" stroke-dashoffset="-352.3" transform="rotate(-90 100 100)"/>
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#8b5cf6" stroke-width="30" stroke-dasharray="50 502.4" stroke-dashoffset="-452.8" transform="rotate(-90 100 100)"/>
                        </svg>
                        <div class="donut-center">
                            <span class="donut-label">Top Format</span>
                            <span class="donut-value" style="font-size: 18px;">Reels</span>
                        </div>
                    </div>
                    <div class="audience-legend">
                        <div class="legend-item"><span class="legend-dot" style="background: #10b981;"></span> Reels <span>40%</span></div>
                        <div class="legend-item"><span class="legend-dot" style="background: #3b82f6;"></span> Carousels <span>30%</span></div>
                        <div class="legend-item"><span class="legend-dot" style="background: #f59e0b;"></span> Single Images <span>20%</span></div>
                        <div class="legend-item"><span class="legend-dot" style="background: #8b5cf6;"></span> Stories <span>10%</span></div>
                    </div>
                </div>

                <div class="card">
                    <h3>Posting Behavior</h3>
                    <div class="use-case-bars">
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Posts per Week</span>
                                <span class="use-case-value">4.2</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 60%; background: #10b981;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Stories per Day</span>
                                <span class="use-case-value">8.5</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 85%; background: #3b82f6;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Avg. Caption Length</span>
                                <span class="use-case-value">127 chars</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 45%; background: #f59e0b;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Hashtags per Post</span>
                                <span class="use-case-value">3.2</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 32%; background: #8b5cf6;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Visual Style Fingerprint</h3>
                    <div class="visual-grid">
                        <div class="visual-item">
                            <div class="visual-color" style="background: linear-gradient(135deg, #fde68a, #fbbf24);"></div>
                            <span class="visual-label">Warm Tones</span>
                        </div>
                        <div class="visual-item">
                            <div class="visual-color" style="background: linear-gradient(135deg, #f5f5f4, #a8a29e);"></div>
                            <span class="visual-label">Neutral</span>
                        </div>
                        <div class="visual-item">
                            <div class="visual-color" style="background: linear-gradient(135deg, #fecaca, #f87171);"></div>
                            <span class="visual-label">Pink/Red</span>
                        </div>
                        <div class="visual-item">
                            <div class="visual-color" style="background: linear-gradient(135deg, #1e293b, #475569);"></div>
                            <span class="visual-label">Dark/Moody</span>
                        </div>
                    </div>
                    <div style="margin-top: 16px;">
                        <h4 style="font-size: 14px; color: var(--gray-700); margin-bottom: 8px;">Style Keywords</h4>
                        <div class="category-tags">
                            <span class="tag">High Contrast</span>
                            <span class="tag">Professional Lighting</span>
                            <span class="tag">Luxury Aesthetic</span>
                            <span class="tag">Minimalist</span>
                            <span class="tag">Editorial</span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Tone & Personality Indicators</h3>
                    <div class="tone-grid">
                        <div class="tone-item">
                            <span class="tone-label">Aspirational</span>
                            <span class="tone-value">92%</span>
                        </div>
                        <div class="tone-item">
                            <span class="tone-label">Confident</span>
                            <span class="tone-value">88%</span>
                        </div>
                        <div class="tone-item">
                            <span class="tone-label">Glamorous</span>
                            <span class="tone-value">85%</span>
                        </div>
                        <div class="tone-item">
                            <span class="tone-label">Relatable</span>
                            <span class="tone-value">62%</span>
                        </div>
                        <div class="tone-item">
                            <span class="tone-label">Humorous</span>
                            <span class="tone-value">34%</span>
                        </div>
                        <div class="tone-item">
                            <span class="tone-label">Educational</span>
                            <span class="tone-value">28%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="overview-right">
                <div class="card">
                    <h3>Recent Content</h3>
                    <div class="content-grid">
                        ${generateContentCards()}
                    </div>
                </div>

                <div class="card">
                    <h3>Top Performing Content Themes</h3>
                    <div class="use-case-bars">
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Behind-the-scenes</span>
                                <span class="use-case-value">2.8% ER</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 95%; background: #10b981;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Family moments</span>
                                <span class="use-case-value">2.4% ER</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 85%; background: #10b981;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Fashion showcases</span>
                                <span class="use-case-value">1.8% ER</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 70%; background: #3b82f6;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Product reveals</span>
                                <span class="use-case-value">1.2% ER</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 55%; background: #f59e0b;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Travel content</span>
                                <span class="use-case-value">1.1% ER</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 50%; background: #f59e0b;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Content Calendar Consistency</h3>
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 16px;">
                        ${generateCalendarGrid()}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--gray-500);">
                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>
                    <div style="margin-top: 16px; padding: 12px; background: var(--gray-50); border-radius: 8px;">
                        <strong style="font-size: 14px; color: var(--gray-700);">Consistency Score: 87%</strong>
                        <p style="font-size: 13px; color: var(--gray-500); margin-top: 4px;">Posts regularly with predictable schedule</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateContentCards() {
    const contentTypes = ['Reel', 'Carousel', 'Photo', 'Reel', 'Photo', 'Carousel'];
    const icons = ['▶', '◫', '□', '▶', '□', '◫'];
    const likes = ['2.1M', '1.8M', '1.5M', '2.4M', '1.2M', '1.9M'];
    const comments = ['12.4K', '8.2K', '6.1K', '15.2K', '4.8K', '9.1K'];

    return contentTypes.map((type, i) => `
        <div class="content-card">
            <div class="content-thumbnail">${icons[i]}</div>
            <div class="content-details">
                <div class="content-type">${type} • ${['2 days', '4 days', '1 week', '1 week', '2 weeks', '2 weeks'][i]} ago</div>
                <div class="content-metrics">
                    <span class="content-metric">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        ${likes[i]}
                    </span>
                    <span class="content-metric">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${comments[i]}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

function generateCalendarGrid() {
    let html = '';
    for (let i = 0; i < 35; i++) {
        const hasPost = Math.random() > 0.3;
        const intensity = hasPost ? (Math.random() > 0.5 ? 'active-high' : 'active-medium') : '';
        html += `<div class="posting-day ${intensity}" style="aspect-ratio: 1; border-radius: 4px;"></div>`;
    }
    return html;
}

function initBrandSafetyTab() {
    const container = document.getElementById('tab-brand-safety');
    container.innerHTML = `
        <div class="risk-banner medium">
            <h3 style="display: flex; align-items: center; gap: 8px; color: #92400e;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Medium Risk Profile
            </h3>
            <p style="color: #92400e; font-size: 14px; margin-top: 8px;">
                This creator has some brand safety considerations that should be reviewed before partnership. Overall risk level is manageable with proper vetting.
            </p>
        </div>

        <div class="overview-grid">
            <div class="overview-left">
                <div class="card">
                    <h3>Content Risk Categories</h3>
                    <div class="risk-categories">
                        <div class="risk-category">
                            <strong>Political Content</strong>
                            <div class="risk-level">
                                <span class="risk-indicator medium"></span>
                                <span>Medium Risk</span>
                            </div>
                            <p style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">Occasional political commentary detected</p>
                        </div>
                        <div class="risk-category">
                            <strong>Adult Content</strong>
                            <div class="risk-level">
                                <span class="risk-indicator low"></span>
                                <span>Low Risk</span>
                            </div>
                            <p style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">Within platform guidelines</p>
                        </div>
                        <div class="risk-category">
                            <strong>Controversial Topics</strong>
                            <div class="risk-level">
                                <span class="risk-indicator medium"></span>
                                <span>Medium Risk</span>
                            </div>
                            <p style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">Past statements on social issues</p>
                        </div>
                        <div class="risk-category">
                            <strong>Violence/Harmful</strong>
                            <div class="risk-level">
                                <span class="risk-indicator low"></span>
                                <span>Low Risk</span>
                            </div>
                            <p style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">No concerning content detected</p>
                        </div>
                        <div class="risk-category">
                            <strong>Misinformation</strong>
                            <div class="risk-level">
                                <span class="risk-indicator low"></span>
                                <span>Low Risk</span>
                            </div>
                            <p style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">No fact-check flags</p>
                        </div>
                        <div class="risk-category">
                            <strong>Brand Conflicts</strong>
                            <div class="risk-level">
                                <span class="risk-indicator medium"></span>
                                <span>Medium Risk</span>
                            </div>
                            <p style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">Works with competing brands</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Historical Incidents</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="padding: 12px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <strong style="font-size: 14px; color: #92400e;">March 2024</strong>
                            <p style="font-size: 13px; color: #92400e; margin-top: 4px;">Controversial statement about beauty standards received media coverage</p>
                        </div>
                        <div style="padding: 12px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <strong style="font-size: 14px; color: #92400e;">November 2023</strong>
                            <p style="font-size: 13px; color: #92400e; margin-top: 4px;">Political endorsement post generated mixed reactions</p>
                        </div>
                        <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; border-left: 4px solid var(--gray-300);">
                            <strong style="font-size: 14px; color: var(--gray-700);">August 2023</strong>
                            <p style="font-size: 13px; color: var(--gray-600); margin-top: 4px;">Minor PR issue resolved quickly - no lasting impact</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="overview-right">
                <div class="card">
                    <h3>Comment Sentiment Breakdown</h3>
                    <div class="sentiment-bars">
                        <div class="sentiment-segment positive" style="width: 74%;">74%</div>
                        <div class="sentiment-segment neutral" style="width: 18%;">18%</div>
                        <div class="sentiment-segment negative" style="width: 8%;">8%</div>
                    </div>
                    <div class="sentiment-legend">
                        <span class="sentiment-item"><span class="sentiment-dot positive"></span> Positive (74%)</span>
                        <span class="sentiment-item"><span class="sentiment-dot neutral"></span> Neutral (18%)</span>
                        <span class="sentiment-item"><span class="sentiment-dot negative"></span> Negative (8%)</span>
                    </div>
                    <div style="margin-top: 16px; padding: 12px; background: var(--gray-50); border-radius: 8px;">
                        <p style="font-size: 13px; color: var(--gray-600);">
                            <strong>Top negative themes:</strong> Perceived inauthenticity, over-commercialization, political views
                        </p>
                    </div>
                </div>

                <div class="card">
                    <h3>Tone & Audience Risks</h3>
                    <div class="use-case-bars">
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Toxic Comments Rate</span>
                                <span class="use-case-value">4.2%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 42%; background: #f59e0b;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Bot Engagement</span>
                                <span class="use-case-value">13.6%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 68%; background: #ef4444;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Spam Comments</span>
                                <span class="use-case-value">8.1%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 40%; background: #f59e0b;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Hate Speech Detection</span>
                                <span class="use-case-value">1.2%</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 12%; background: #10b981;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Association Network</h3>
                    <div style="margin-bottom: 16px;">
                        <p style="font-size: 13px; color: var(--gray-500); margin-bottom: 12px;">Frequently mentioned alongside:</p>
                        <div class="category-tags">
                            <span class="tag">Kylie Jenner</span>
                            <span class="tag">Khloe Kardashian</span>
                            <span class="tag">Kanye West</span>
                            <span class="tag">Pete Davidson</span>
                            <span class="tag">Travis Scott</span>
                        </div>
                    </div>
                    <div style="padding: 12px; background: #fef3c7; border-radius: 8px;">
                        <p style="font-size: 13px; color: #92400e;">
                            <strong>Note:</strong> Some associated individuals have their own brand safety considerations
                        </p>
                    </div>
                </div>

                <div class="card">
                    <h3>Platform Standing</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                        <div style="text-align: center; padding: 16px; background: var(--gray-50); border-radius: 8px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" style="margin: 0 auto 8px;">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <strong style="display: block; font-size: 14px; color: var(--gray-700);">Instagram</strong>
                            <span style="font-size: 12px; color: #10b981;">Good Standing</span>
                        </div>
                        <div style="text-align: center; padding: 16px; background: var(--gray-50); border-radius: 8px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" style="margin: 0 auto 8px;">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <strong style="display: block; font-size: 14px; color: var(--gray-700);">TikTok</strong>
                            <span style="font-size: 12px; color: #10b981;">Good Standing</span>
                        </div>
                        <div style="text-align: center; padding: 16px; background: var(--gray-50); border-radius: 8px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" style="margin: 0 auto 8px;">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <strong style="display: block; font-size: 14px; color: var(--gray-700);">X/Twitter</strong>
                            <span style="font-size: 12px; color: #10b981;">Good Standing</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initValueTab() {
    const container = document.getElementById('tab-value');
    container.innerHTML = `
        <div class="pricing-grid" style="margin-bottom: 24px;">
            <div class="pricing-card">
                <h4>Instagram Feed Post</h4>
                <div class="pricing-range">$850K - $1.2M</div>
                <div class="pricing-note">Per post, estimated</div>
            </div>
            <div class="pricing-card">
                <h4>Instagram Story</h4>
                <div class="pricing-range">$350K - $500K</div>
                <div class="pricing-note">Per story set</div>
            </div>
            <div class="pricing-card">
                <h4>Instagram Reel</h4>
                <div class="pricing-range">$1M - $1.5M</div>
                <div class="pricing-note">Per reel</div>
            </div>
            <div class="pricing-card">
                <h4>TikTok Video</h4>
                <div class="pricing-range">$500K - $750K</div>
                <div class="pricing-note">Per video</div>
            </div>
        </div>

        <div class="value-metrics-grid">
            <div class="value-metric-card">
                <h4>Cost Per Engagement</h4>
                <div class="value">$0.65</div>
                <div class="description">Based on average engagement and estimated pricing</div>
            </div>
            <div class="value-metric-card">
                <h4>Earned Media Value</h4>
                <div class="value">$4.2M</div>
                <div class="description">Per post, based on reach and engagement</div>
            </div>
            <div class="value-metric-card">
                <h4>ROI Multiplier</h4>
                <div class="value">3.5x</div>
                <div class="description">Average return on influencer spend</div>
            </div>
        </div>

        <div class="overview-grid" style="margin-top: 24px;">
            <div class="overview-left">
                <div class="card">
                    <h3>Value Breakdown by Platform</h3>
                    <div class="use-case-bars">
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>Instagram</span>
                                <span class="use-case-value">$3.8M EMV/month</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 95%; background: #e4405f;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>TikTok</span>
                                <span class="use-case-value">$1.2M EMV/month</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 55%; background: #000000;"></div>
                            </div>
                        </div>
                        <div class="use-case-item">
                            <div class="use-case-label">
                                <span>X/Twitter</span>
                                <span class="use-case-value">$420K EMV/month</span>
                            </div>
                            <div class="progress-bar-bg">
                                <div class="progress-bar-fill" style="width: 25%; background: #1da1f2;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Pricing Comparison</h3>
                    <table class="brand-mentions-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>This Creator</th>
                                <th>Category Avg</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>CPM (Cost per 1K impressions)</td>
                                <td><strong>$2.85</strong></td>
                                <td>$4.20</td>
                            </tr>
                            <tr>
                                <td>CPE (Cost per engagement)</td>
                                <td><strong>$0.65</strong></td>
                                <td>$0.82</td>
                            </tr>
                            <tr>
                                <td>Cost per click (estimated)</td>
                                <td><strong>$8.50</strong></td>
                                <td>$12.30</td>
                            </tr>
                            <tr>
                                <td>Cost per conversion</td>
                                <td><strong>$45</strong></td>
                                <td>$68</td>
                            </tr>
                        </tbody>
                    </table>
                    <p style="font-size: 12px; color: var(--gray-500); margin-top: 12px;">
                        * Compared to other mega-influencers in Fashion & Beauty categories
                    </p>
                </div>

                <div class="card">
                    <h3>Budget Recommendations</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="padding: 16px; background: var(--primary-light); border-radius: 8px;">
                            <strong style="color: var(--primary-dark);">Awareness Campaign</strong>
                            <p style="font-size: 13px; color: var(--primary-dark); margin-top: 4px;">Recommended: 3 feed posts + 5 stories</p>
                            <p style="font-size: 18px; font-weight: 700; color: var(--primary-dark); margin-top: 8px;">$4.2M - $5.8M</p>
                        </div>
                        <div style="padding: 16px; background: #dbeafe; border-radius: 8px;">
                            <strong style="color: #1e40af;">Product Launch</strong>
                            <p style="font-size: 13px; color: #1e40af; margin-top: 4px;">Recommended: 2 reels + 1 feed + stories takeover</p>
                            <p style="font-size: 18px; font-weight: 700; color: #1e40af; margin-top: 8px;">$3.5M - $4.5M</p>
                        </div>
                        <div style="padding: 16px; background: #fef3c7; border-radius: 8px;">
                            <strong style="color: #92400e;">Brand Ambassador (Annual)</strong>
                            <p style="font-size: 13px; color: #92400e; margin-top: 4px;">12 months exclusive partnership</p>
                            <p style="font-size: 18px; font-weight: 700; color: #92400e; margin-top: 8px;">$15M - $25M</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="overview-right">
                <div class="card">
                    <h3>Historical Campaign Performance</h3>
                    <table class="brand-mentions-table">
                        <thead>
                            <tr>
                                <th>Brand</th>
                                <th>Type</th>
                                <th>ROI</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>SKIMS</td>
                                <td>Brand Owner</td>
                                <td><span style="color: var(--primary); font-weight: 600;">8.2x</span></td>
                            </tr>
                            <tr>
                                <td>Balenciaga</td>
                                <td>Ambassador</td>
                                <td><span style="color: var(--primary); font-weight: 600;">4.5x</span></td>
                            </tr>
                            <tr>
                                <td>Beats by Dre</td>
                                <td>Campaign</td>
                                <td><span style="color: var(--primary); font-weight: 600;">3.8x</span></td>
                            </tr>
                            <tr>
                                <td>Calvin Klein</td>
                                <td>Campaign</td>
                                <td><span style="color: var(--primary); font-weight: 600;">3.2x</span></td>
                            </tr>
                            <tr>
                                <td>T-Mobile</td>
                                <td>Campaign</td>
                                <td><span style="color: var(--warning); font-weight: 600;">2.1x</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="card">
                    <h3>Value Trend (12 Months)</h3>
                    <div class="line-chart" style="height: 150px;">
                        <svg viewBox="0 0 400 120" preserveAspectRatio="none" style="width: 100%; height: 100%;">
                            <defs>
                                <linearGradient id="valueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.3" />
                                    <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0" />
                                </linearGradient>
                            </defs>
                            <polyline fill="url(#valueGradient)" stroke="none" points="0,120 0,90 33,85 66,80 100,75 133,70 166,65 200,60 233,55 266,50 300,48 333,45 366,42 400,38 400,120"/>
                            <polyline fill="none" stroke="#3b82f6" stroke-width="2" points="0,90 33,85 66,80 100,75 133,70 166,65 200,60 233,55 266,50 300,48 333,45 366,42 400,38"/>
                        </svg>
                        <div class="chart-labels">
                            <span>Jan</span>
                            <span>Mar</span>
                            <span>May</span>
                            <span>Jul</span>
                            <span>Sep</span>
                            <span>Nov</span>
                            <span>Jan</span>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 16px; padding: 12px; background: var(--gray-50); border-radius: 8px;">
                        <div>
                            <span style="font-size: 12px; color: var(--gray-500);">12-Month Change</span>
                            <strong style="display: block; color: var(--primary);">+18.5%</strong>
                        </div>
                        <div>
                            <span style="font-size: 12px; color: var(--gray-500);">Projected (6 mo)</span>
                            <strong style="display: block; color: var(--gray-700);">+8.2%</strong>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Value Efficiency Score</h3>
                    <div class="stability-score">
                        <div class="stability-circle">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="8"/>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" stroke-width="8" stroke-dasharray="200 251" stroke-linecap="round" transform="rotate(-90 50 50)"/>
                            </svg>
                            <span class="stability-value">82</span>
                        </div>
                        <div class="stability-info">
                            <strong>Above Average Value</strong>
                            <p>Delivers strong ROI compared to similar creators at this price point</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Negotiation Insights</h3>
                    <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px;">
                        <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--gray-700);">
                            <span style="color: var(--primary); font-weight: 600;">+</span>
                            Bundle deals (3+ posts) typically receive 15-20% discount
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--gray-700);">
                            <span style="color: var(--primary); font-weight: 600;">+</span>
                            Long-term partnerships (6+ months) can reduce CPE by 25%
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--gray-700);">
                            <span style="color: var(--warning); font-weight: 600;">!</span>
                            Peak seasons (Fashion Week, holidays) may see 30% premium
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: var(--gray-700);">
                            <span style="color: var(--primary); font-weight: 600;">+</span>
                            Performance-based bonuses can align incentives
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}
