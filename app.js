// Squad Tools - Creator Analytics Application
// Vanilla JavaScript - No frameworks

(function() {
    'use strict';

    // ===========================
    // Mock Data
    // ===========================

    const mockCreators = {
        'a': [
            { id: 1, name: 'Alex Rivera', handle: '@alexrivera', platform: 'instagram', followers: '2.4M', avatar: 'https://i.pravatar.cc/100?img=1' },
            { id: 2, name: 'Amanda Chen', handle: '@amandachen', platform: 'youtube', followers: '1.8M', avatar: 'https://i.pravatar.cc/100?img=5' },
            { id: 3, name: 'Andrew Blake', handle: '@andrewblake', platform: 'tiktok', followers: '5.2M', avatar: 'https://i.pravatar.cc/100?img=8' },
            { id: 4, name: 'Aria Johnson', handle: '@ariaj', platform: 'instagram', followers: '890K', avatar: 'https://i.pravatar.cc/100?img=9' }
        ],
        'b': [
            { id: 5, name: 'Blake Williams', handle: '@blakew', platform: 'youtube', followers: '3.1M', avatar: 'https://i.pravatar.cc/100?img=11' },
            { id: 6, name: 'Bella Martinez', handle: '@bellamartinez', platform: 'instagram', followers: '1.2M', avatar: 'https://i.pravatar.cc/100?img=20' },
            { id: 7, name: 'Brandon Lee', handle: '@brandonlee', platform: 'tiktok', followers: '4.5M', avatar: 'https://i.pravatar.cc/100?img=12' }
        ],
        'c': [
            { id: 8, name: 'Chloe Park', handle: '@chloepark', platform: 'instagram', followers: '2.8M', avatar: 'https://i.pravatar.cc/100?img=25' },
            { id: 9, name: 'Chris Thompson', handle: '@christhompson', platform: 'youtube', followers: '980K', avatar: 'https://i.pravatar.cc/100?img=14' },
            { id: 10, name: 'Cameron Davis', handle: '@camerond', platform: 'tiktok', followers: '6.7M', avatar: 'https://i.pravatar.cc/100?img=15' },
            { id: 11, name: 'Carla Santos', handle: '@carlasantos', platform: 'instagram', followers: '1.5M', avatar: 'https://i.pravatar.cc/100?img=26' }
        ],
        'd': [
            { id: 12, name: 'David Kim', handle: '@davidkim', platform: 'youtube', followers: '4.2M', avatar: 'https://i.pravatar.cc/100?img=17' },
            { id: 13, name: 'Diana Ross', handle: '@dianaross', platform: 'instagram', followers: '750K', avatar: 'https://i.pravatar.cc/100?img=27' },
            { id: 14, name: 'Derek Johnson', handle: '@derekj', platform: 'tiktok', followers: '2.1M', avatar: 'https://i.pravatar.cc/100?img=18' }
        ],
        'e': [
            { id: 15, name: 'Emma Wilson', handle: '@emmawilson', platform: 'instagram', followers: '3.5M', avatar: 'https://i.pravatar.cc/100?img=28' },
            { id: 16, name: 'Ethan Moore', handle: '@ethanmoore', platform: 'youtube', followers: '1.9M', avatar: 'https://i.pravatar.cc/100?img=52' },
            { id: 17, name: 'Elena Garcia', handle: '@elenag', platform: 'tiktok', followers: '8.3M', avatar: 'https://i.pravatar.cc/100?img=29' }
        ],
        'f': [
            { id: 18, name: 'Felix Brown', handle: '@felixbrown', platform: 'youtube', followers: '2.7M', avatar: 'https://i.pravatar.cc/100?img=53' },
            { id: 19, name: 'Fiona Adams', handle: '@fionaadams', platform: 'instagram', followers: '1.1M', avatar: 'https://i.pravatar.cc/100?img=30' },
            { id: 20, name: 'Frank Taylor', handle: '@frankt', platform: 'tiktok', followers: '3.8M', avatar: 'https://i.pravatar.cc/100?img=54' }
        ],
        'g': [
            { id: 21, name: 'Grace Liu', handle: '@graceliu', platform: 'instagram', followers: '4.1M', avatar: 'https://i.pravatar.cc/100?img=31' },
            { id: 22, name: 'George Miller', handle: '@georgemiller', platform: 'youtube', followers: '890K', avatar: 'https://i.pravatar.cc/100?img=55' },
            { id: 23, name: 'Gina Romano', handle: '@ginaromano', platform: 'tiktok', followers: '2.3M', avatar: 'https://i.pravatar.cc/100?img=32' }
        ],
        'h': [
            { id: 24, name: 'Hannah Scott', handle: '@hannahscott', platform: 'instagram', followers: '1.7M', avatar: 'https://i.pravatar.cc/100?img=33' },
            { id: 25, name: 'Henry Zhang', handle: '@henryzhang', platform: 'youtube', followers: '5.4M', avatar: 'https://i.pravatar.cc/100?img=56' },
            { id: 26, name: 'Holly Cooper', handle: '@hollycooper', platform: 'tiktok', followers: '920K', avatar: 'https://i.pravatar.cc/100?img=34' }
        ],
        'i': [
            { id: 27, name: 'Isabella Reyes', handle: '@isabellareyes', platform: 'instagram', followers: '2.9M', avatar: 'https://i.pravatar.cc/100?img=35' },
            { id: 28, name: 'Ian Foster', handle: '@ianfoster', platform: 'youtube', followers: '1.3M', avatar: 'https://i.pravatar.cc/100?img=57' },
            { id: 29, name: 'Ivy Chen', handle: '@ivychen', platform: 'tiktok', followers: '7.1M', avatar: 'https://i.pravatar.cc/100?img=36' }
        ],
        'j': [
            { id: 30, name: 'Jake Anderson', handle: '@jakeanderson', platform: 'youtube', followers: '3.8M', avatar: 'https://i.pravatar.cc/100?img=58' },
            { id: 31, name: 'Jessica Wang', handle: '@jessicawang', platform: 'instagram', followers: '2.2M', avatar: 'https://i.pravatar.cc/100?img=37' },
            { id: 32, name: 'Jordan Smith', handle: '@jordansmith', platform: 'tiktok', followers: '4.9M', avatar: 'https://i.pravatar.cc/100?img=59' },
            { id: 33, name: 'Julia Nakamura', handle: '@julianakamura', platform: 'instagram', followers: '1.6M', avatar: 'https://i.pravatar.cc/100?img=38' }
        ],
        'k': [
            { id: 34, name: 'Kevin Patel', handle: '@kevinpatel', platform: 'youtube', followers: '2.5M', avatar: 'https://i.pravatar.cc/100?img=60' },
            { id: 35, name: 'Katie Morgan', handle: '@katiemorgan', platform: 'instagram', followers: '980K', avatar: 'https://i.pravatar.cc/100?img=39' },
            { id: 36, name: 'Kyle Thompson', handle: '@kylethompson', platform: 'tiktok', followers: '3.2M', avatar: 'https://i.pravatar.cc/100?img=61' }
        ],
        'l': [
            { id: 37, name: 'Lily Chang', handle: '@lilychang', platform: 'instagram', followers: '5.1M', avatar: 'https://i.pravatar.cc/100?img=40' },
            { id: 38, name: 'Lucas Martin', handle: '@lucasmartin', platform: 'youtube', followers: '1.4M', avatar: 'https://i.pravatar.cc/100?img=62' },
            { id: 39, name: 'Luna Rodriguez', handle: '@lunarodriguez', platform: 'tiktok', followers: '6.3M', avatar: 'https://i.pravatar.cc/100?img=41' }
        ],
        'm': [
            { id: 40, name: 'Maya Gupta', handle: '@mayagupta', platform: 'instagram', followers: '3.3M', avatar: 'https://i.pravatar.cc/100?img=42' },
            { id: 41, name: 'Michael Brown', handle: '@michaelbrown', platform: 'youtube', followers: '7.8M', avatar: 'https://i.pravatar.cc/100?img=63' },
            { id: 42, name: 'Mia Torres', handle: '@miatorres', platform: 'tiktok', followers: '2.6M', avatar: 'https://i.pravatar.cc/100?img=43' },
            { id: 43, name: 'Marcus Lee', handle: '@marcuslee', platform: 'youtube', followers: '1.9M', avatar: 'https://i.pravatar.cc/100?img=64' }
        ],
        'n': [
            { id: 44, name: 'Natalie Kim', handle: '@nataliekim', platform: 'instagram', followers: '2.1M', avatar: 'https://i.pravatar.cc/100?img=44' },
            { id: 45, name: 'Nathan Clark', handle: '@nathanclark', platform: 'youtube', followers: '4.4M', avatar: 'https://i.pravatar.cc/100?img=65' },
            { id: 46, name: 'Nina Patel', handle: '@ninapatel', platform: 'tiktok', followers: '1.8M', avatar: 'https://i.pravatar.cc/100?img=45' }
        ],
        'o': [
            { id: 47, name: 'Olivia James', handle: '@oliviajames', platform: 'instagram', followers: '6.2M', avatar: 'https://i.pravatar.cc/100?img=46' },
            { id: 48, name: 'Oscar Hernandez', handle: '@oscarhernandez', platform: 'youtube', followers: '1.1M', avatar: 'https://i.pravatar.cc/100?img=66' },
            { id: 49, name: 'Owen Mitchell', handle: '@owenmitchell', platform: 'tiktok', followers: '3.7M', avatar: 'https://i.pravatar.cc/100?img=67' }
        ],
        'p': [
            { id: 50, name: 'Priya Sharma', handle: '@priyasharma', platform: 'instagram', followers: '2.8M', avatar: 'https://i.pravatar.cc/100?img=47' },
            { id: 51, name: 'Patrick O\'Brien', handle: '@patrickobrien', platform: 'youtube', followers: '950K', avatar: 'https://i.pravatar.cc/100?img=68' },
            { id: 52, name: 'Paige Wilson', handle: '@paigewilson', platform: 'tiktok', followers: '5.5M', avatar: 'https://i.pravatar.cc/100?img=48' }
        ],
        'q': [
            { id: 53, name: 'Quinn Foster', handle: '@quinnfoster', platform: 'instagram', followers: '780K', avatar: 'https://i.pravatar.cc/100?img=16' },
            { id: 54, name: 'Quincy Adams', handle: '@quincyadams', platform: 'youtube', followers: '1.2M', avatar: 'https://i.pravatar.cc/100?img=69' }
        ],
        'r': [
            { id: 55, name: 'Rachel Green', handle: '@rachelgreen', platform: 'instagram', followers: '4.7M', avatar: 'https://i.pravatar.cc/100?img=49' },
            { id: 56, name: 'Ryan Cooper', handle: '@ryancooper', platform: 'youtube', followers: '3.4M', avatar: 'https://i.pravatar.cc/100?img=70' },
            { id: 57, name: 'Ruby Lin', handle: '@rubylin', platform: 'tiktok', followers: '2.9M', avatar: 'https://i.pravatar.cc/100?img=50' }
        ],
        's': [
            { id: 58, name: 'Sofia Martinez', handle: '@sofiamartinez', platform: 'instagram', followers: '5.8M', avatar: 'https://i.pravatar.cc/100?img=21' },
            { id: 59, name: 'Samuel Wright', handle: '@samuelwright', platform: 'youtube', followers: '2.3M', avatar: 'https://i.pravatar.cc/100?img=13' },
            { id: 60, name: 'Sarah Johnson', handle: '@sarahjohnson', platform: 'tiktok', followers: '8.9M', avatar: 'https://i.pravatar.cc/100?img=22' },
            { id: 61, name: 'Steven Park', handle: '@stevenpark', platform: 'youtube', followers: '1.7M', avatar: 'https://i.pravatar.cc/100?img=19' }
        ],
        't': [
            { id: 62, name: 'Taylor Swift', handle: '@taylorswift', platform: 'instagram', followers: '12.4M', avatar: 'https://i.pravatar.cc/100?img=23' },
            { id: 63, name: 'Thomas Anderson', handle: '@thomasanderson', platform: 'youtube', followers: '890K', avatar: 'https://i.pravatar.cc/100?img=51' },
            { id: 64, name: 'Tina Chen', handle: '@tinachen', platform: 'tiktok', followers: '4.1M', avatar: 'https://i.pravatar.cc/100?img=24' }
        ],
        'u': [
            { id: 65, name: 'Uma Patel', handle: '@umapatel', platform: 'instagram', followers: '1.3M', avatar: 'https://i.pravatar.cc/100?img=2' },
            { id: 66, name: 'Ulysses Grant', handle: '@ulyssesgrant', platform: 'youtube', followers: '670K', avatar: 'https://i.pravatar.cc/100?img=3' }
        ],
        'v': [
            { id: 67, name: 'Victoria Lee', handle: '@victorialee', platform: 'instagram', followers: '3.6M', avatar: 'https://i.pravatar.cc/100?img=4' },
            { id: 68, name: 'Vincent Nguyen', handle: '@vincentnguyen', platform: 'youtube', followers: '2.1M', avatar: 'https://i.pravatar.cc/100?img=6' },
            { id: 69, name: 'Vanessa Moore', handle: '@vanessamoore', platform: 'tiktok', followers: '5.4M', avatar: 'https://i.pravatar.cc/100?img=7' }
        ],
        'w': [
            { id: 70, name: 'William Chen', handle: '@williamchen', platform: 'youtube', followers: '4.8M', avatar: 'https://i.pravatar.cc/100?img=10' },
            { id: 71, name: 'Wendy Kim', handle: '@wendykim', platform: 'instagram', followers: '1.9M', avatar: 'https://i.pravatar.cc/100?img=71' },
            { id: 72, name: 'Wesley Jones', handle: '@wesleyjones', platform: 'tiktok', followers: '3.2M', avatar: 'https://i.pravatar.cc/100?img=72' }
        ],
        'x': [
            { id: 73, name: 'Xena Warrior', handle: '@xenawarrior', platform: 'instagram', followers: '890K', avatar: 'https://i.pravatar.cc/100?img=73' },
            { id: 74, name: 'Xavier Ross', handle: '@xavierross', platform: 'youtube', followers: '1.5M', avatar: 'https://i.pravatar.cc/100?img=74' }
        ],
        'y': [
            { id: 75, name: 'Yuki Tanaka', handle: '@yukitanaka', platform: 'instagram', followers: '2.7M', avatar: 'https://i.pravatar.cc/100?img=75' },
            { id: 76, name: 'Yasmin Ali', handle: '@yasminali', platform: 'tiktok', followers: '6.1M', avatar: 'https://i.pravatar.cc/100?img=76' },
            { id: 77, name: 'Yolanda Reyes', handle: '@yolandareyes', platform: 'youtube', followers: '980K', avatar: 'https://i.pravatar.cc/100?img=77' }
        ],
        'z': [
            { id: 78, name: 'Zara Ahmed', handle: '@zaraahmed', platform: 'instagram', followers: '3.9M', avatar: 'https://i.pravatar.cc/100?img=78' },
            { id: 79, name: 'Zack Miller', handle: '@zackmiller', platform: 'youtube', followers: '2.4M', avatar: 'https://i.pravatar.cc/100?img=79' },
            { id: 80, name: 'Zoey Chen', handle: '@zoeychen', platform: 'tiktok', followers: '7.6M', avatar: 'https://i.pravatar.cc/100?img=80' }
        ]
    };

    const loadingStages = [
        { text: 'Fetching profile data...', progress: 15 },
        { text: 'Analyzing engagement metrics...', progress: 35 },
        { text: 'Processing audience demographics...', progress: 55 },
        { text: 'Calculating growth trends...', progress: 75 },
        { text: 'Generating insights...', progress: 90 },
        { text: 'Finalizing report...', progress: 100 }
    ];

    const platformIcons = {
        instagram: `<svg class="platform-icon instagram" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
        youtube: `<svg class="platform-icon youtube" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>`,
        tiktok: `<svg class="platform-icon tiktok" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
        twitter: `<svg class="platform-icon twitter" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
    };

    // ===========================
    // State Management
    // ===========================

    let previousReports = [];
    let currentCreator = null;

    // ===========================
    // DOM Elements
    // ===========================

    const elements = {
        searchInput: null,
        searchSuggestions: null,
        previousReports: null,
        previousList: null,
        loadingModal: null,
        loadingCreatorName: null,
        progressBar: null,
        loadingStage: null,
        searchView: null,
        reportView: null,
        reportHeader: null,
        reportContent: null,
        backButton: null,
        navItems: null,
        pages: null,
        pageTitle: null
    };

    // ===========================
    // Initialization
    // ===========================

    function init() {
        cacheElements();
        bindEvents();
        loadPreviousReports();
        renderPreviousReports();
    }

    function cacheElements() {
        elements.searchInput = document.getElementById('creator-search');
        elements.searchSuggestions = document.getElementById('search-suggestions');
        elements.previousReports = document.getElementById('previous-reports');
        elements.previousList = document.getElementById('previous-list');
        elements.loadingModal = document.getElementById('loading-modal');
        elements.loadingCreatorName = document.getElementById('loading-creator-name');
        elements.progressBar = document.getElementById('progress-bar');
        elements.loadingStage = document.getElementById('loading-stage');
        elements.searchView = document.getElementById('search-view');
        elements.reportView = document.getElementById('report-view');
        elements.reportHeader = document.getElementById('report-header');
        elements.reportContent = document.getElementById('report-content');
        elements.backButton = document.getElementById('back-to-search');
        elements.navItems = document.querySelectorAll('.nav-item');
        elements.pages = document.querySelectorAll('.page');
        elements.pageTitle = document.querySelector('.page-title');
    }

    function bindEvents() {
        // Search input
        elements.searchInput.addEventListener('input', handleSearchInput);
        elements.searchInput.addEventListener('focus', handleSearchFocus);
        document.addEventListener('click', handleClickOutside);

        // Back button
        elements.backButton.addEventListener('click', handleBackToSearch);

        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', handleNavigation);
        });
    }

    // ===========================
    // Event Handlers
    // ===========================

    function handleSearchInput(e) {
        const query = e.target.value.trim().toLowerCase();

        if (query.length === 0) {
            hideSuggestions();
            return;
        }

        const firstChar = query.charAt(0);
        let suggestions = [];

        // Get creators matching first letter
        if (mockCreators[firstChar]) {
            suggestions = mockCreators[firstChar].filter(creator =>
                creator.name.toLowerCase().includes(query) ||
                creator.handle.toLowerCase().includes(query)
            );
        }

        // If no exact matches, show all from first letter
        if (suggestions.length === 0 && mockCreators[firstChar]) {
            suggestions = mockCreators[firstChar];
        }

        // Limit to 5 suggestions
        suggestions = suggestions.slice(0, 5);

        if (suggestions.length > 0) {
            renderSuggestions(suggestions);
        } else {
            hideSuggestions();
        }
    }

    function handleSearchFocus() {
        const query = elements.searchInput.value.trim().toLowerCase();
        if (query.length > 0) {
            handleSearchInput({ target: elements.searchInput });
        }
    }

    function handleClickOutside(e) {
        if (!e.target.closest('.search-box')) {
            hideSuggestions();
        }
    }

    function handleBackToSearch() {
        elements.reportView.classList.add('hidden');
        elements.searchView.style.display = 'block';
        elements.searchInput.value = '';
        elements.searchInput.focus();
    }

    function handleNavigation(e) {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;

        // Update active nav item
        elements.navItems.forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Update page title
        const titles = {
            'creator-report': 'Creator Report',
            'brand-report': 'Brand Report',
            'post-analytics': 'Post Analytics'
        };
        elements.pageTitle.textContent = titles[page] || 'Dashboard';

        // Show corresponding page
        elements.pages.forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');

        // Reset to search view if on creator report
        if (page === 'creator-report') {
            handleBackToSearch();
        }
    }

    // ===========================
    // Suggestions
    // ===========================

    function renderSuggestions(suggestions) {
        elements.searchSuggestions.innerHTML = suggestions.map(creator => `
            <div class="suggestion-item" data-creator-id="${creator.id}">
                <div class="suggestion-avatar">
                    <img src="${creator.avatar}" alt="${creator.name}" />
                </div>
                <div class="suggestion-info">
                    <div class="suggestion-name">${creator.name}</div>
                    <div class="suggestion-handle">${creator.handle}</div>
                </div>
                <div class="suggestion-meta">
                    <div class="suggestion-platform">
                        ${platformIcons[creator.platform]}
                    </div>
                    <div class="suggestion-followers">${creator.followers}</div>
                </div>
            </div>
        `).join('');

        // Bind click events to suggestions
        elements.searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const creatorId = parseInt(item.dataset.creatorId);
                const creator = findCreatorById(creatorId);
                if (creator) {
                    selectCreator(creator);
                }
            });
        });

        elements.searchSuggestions.classList.remove('hidden');
    }

    function hideSuggestions() {
        elements.searchSuggestions.classList.add('hidden');
    }

    function findCreatorById(id) {
        for (const letter in mockCreators) {
            const found = mockCreators[letter].find(c => c.id === id);
            if (found) return found;
        }
        return null;
    }

    // ===========================
    // Creator Selection & Report
    // ===========================

    function selectCreator(creator) {
        hideSuggestions();
        currentCreator = creator;
        showLoadingModal(creator);
        simulateLoading(() => {
            addToPreviousReports(creator);
            renderFullReport(creator);
        });
    }

    function showLoadingModal(creator) {
        elements.loadingCreatorName.textContent = `for ${creator.name}`;
        elements.progressBar.style.width = '0%';
        elements.loadingStage.textContent = 'Initializing...';
        elements.loadingModal.classList.remove('hidden');
    }

    function hideLoadingModal() {
        elements.loadingModal.classList.add('hidden');
    }

    function simulateLoading(callback) {
        let stageIndex = 0;

        function nextStage() {
            if (stageIndex < loadingStages.length) {
                const stage = loadingStages[stageIndex];
                elements.progressBar.style.width = stage.progress + '%';
                elements.loadingStage.textContent = stage.text;
                stageIndex++;
                setTimeout(nextStage, 500 + Math.random() * 300);
            } else {
                setTimeout(() => {
                    hideLoadingModal();
                    callback();
                }, 300);
            }
        }

        setTimeout(nextStage, 200);
    }

    function renderFullReport(creator) {
        // Hide search view and show report
        elements.searchView.style.display = 'none';
        elements.reportView.classList.remove('hidden');

        // Generate mock detailed data
        const reportData = generateMockReportData(creator);

        // Render header
        elements.reportHeader.innerHTML = `
            <div class="creator-profile">
                <div class="creator-avatar">
                    <img src="${creator.avatar}" alt="${creator.name}" />
                </div>
                <div class="creator-details">
                    <h1 class="creator-name">${creator.name}</h1>
                    <p class="creator-handle">${creator.handle}</p>
                    <p class="creator-bio">${reportData.bio}</p>
                    <div class="creator-tags">
                        ${reportData.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="creator-stats">
                    <div class="stat-item">
                        <div class="stat-value">${creator.followers}</div>
                        <div class="stat-label">Followers</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${reportData.engagement}</div>
                        <div class="stat-label">Eng. Rate</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${reportData.posts}</div>
                        <div class="stat-label">Posts</div>
                    </div>
                </div>
            </div>
        `;

        // Render content sections
        elements.reportContent.innerHTML = `
            <!-- Engagement Metrics -->
            <div class="report-card">
                <div class="card-header">
                    <h3 class="card-title">Engagement Metrics</h3>
                    <a href="#" class="card-action">Last 30 days</a>
                </div>
                <div class="engagement-grid">
                    <div class="engagement-item">
                        <div class="engagement-value">${reportData.metrics.likes}</div>
                        <div class="engagement-label">Avg. Likes</div>
                        <div class="engagement-change positive">↑ ${reportData.metrics.likesChange}%</div>
                    </div>
                    <div class="engagement-item">
                        <div class="engagement-value">${reportData.metrics.comments}</div>
                        <div class="engagement-label">Avg. Comments</div>
                        <div class="engagement-change positive">↑ ${reportData.metrics.commentsChange}%</div>
                    </div>
                    <div class="engagement-item">
                        <div class="engagement-value">${reportData.metrics.shares}</div>
                        <div class="engagement-label">Avg. Shares</div>
                        <div class="engagement-change ${reportData.metrics.sharesChange >= 0 ? 'positive' : 'negative'}">${reportData.metrics.sharesChange >= 0 ? '↑' : '↓'} ${Math.abs(reportData.metrics.sharesChange)}%</div>
                    </div>
                    <div class="engagement-item">
                        <div class="engagement-value">${reportData.metrics.saves}</div>
                        <div class="engagement-label">Avg. Saves</div>
                        <div class="engagement-change positive">↑ ${reportData.metrics.savesChange}%</div>
                    </div>
                </div>
            </div>

            <!-- Audience Demographics -->
            <div class="report-card">
                <div class="card-header">
                    <h3 class="card-title">Audience Demographics</h3>
                </div>
                <div class="demo-section">
                    <div class="demo-label">Gender</div>
                    <div class="demo-bars">
                        <div class="demo-bar-item">
                            <span class="demo-bar-label">Female</span>
                            <div class="demo-bar-track">
                                <div class="demo-bar-fill" style="width: ${reportData.demographics.female}%"></div>
                            </div>
                            <span class="demo-bar-value">${reportData.demographics.female}%</span>
                        </div>
                        <div class="demo-bar-item">
                            <span class="demo-bar-label">Male</span>
                            <div class="demo-bar-track">
                                <div class="demo-bar-fill" style="width: ${reportData.demographics.male}%"></div>
                            </div>
                            <span class="demo-bar-value">${reportData.demographics.male}%</span>
                        </div>
                    </div>
                </div>
                <div class="demo-section">
                    <div class="demo-label">Age Distribution</div>
                    <div class="demo-bars">
                        ${reportData.demographics.ages.map(age => `
                            <div class="demo-bar-item">
                                <span class="demo-bar-label">${age.range}</span>
                                <div class="demo-bar-track">
                                    <div class="demo-bar-fill" style="width: ${age.percent}%"></div>
                                </div>
                                <span class="demo-bar-value">${age.percent}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Growth Chart -->
            <div class="report-card full-width">
                <div class="card-header">
                    <h3 class="card-title">Follower Growth</h3>
                    <a href="#" class="card-action">View Details</a>
                </div>
                <div class="chart-placeholder">
                    <div class="chart-dots">
                        ${[20, 35, 28, 45, 52, 48, 60, 75, 68, 82, 90, 85].map((h, i) => `
                            <div class="chart-dot" style="height: ${h}%"></div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Top Content -->
            <div class="report-card">
                <div class="card-header">
                    <h3 class="card-title">Top Performing Content</h3>
                    <a href="#" class="card-action">See All</a>
                </div>
                <div class="content-list">
                    ${reportData.topContent.map(content => `
                        <div class="content-item">
                            <div class="content-thumb">
                                <img src="${content.thumbnail}" alt="Content thumbnail" />
                            </div>
                            <div class="content-details">
                                <div class="content-title">${content.title}</div>
                                <div class="content-metrics">
                                    <span>❤️ ${content.likes}</span>
                                    <span>💬 ${content.comments}</span>
                                    <span>👁️ ${content.views}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Brand Affinity -->
            <div class="report-card">
                <div class="card-header">
                    <h3 class="card-title">Brand Affinity</h3>
                </div>
                <div class="brand-list">
                    ${reportData.brands.map(brand => `
                        <div class="brand-item">
                            <div class="brand-logo">${brand.logo}</div>
                            <div class="brand-info">
                                <div class="brand-name">${brand.name}</div>
                                <div class="brand-category">${brand.category}</div>
                            </div>
                            <div class="brand-score">${brand.score}%</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Platform Breakdown -->
            <div class="report-card">
                <div class="card-header">
                    <h3 class="card-title">Platform Presence</h3>
                </div>
                <div class="platform-list">
                    ${reportData.platforms.map(platform => `
                        <div class="platform-item">
                            <div class="platform-icon-large ${platform.name.toLowerCase()}">
                                ${platformIcons[platform.name.toLowerCase()]}
                            </div>
                            <div class="platform-info">
                                <div class="platform-name">${platform.name}</div>
                                <div class="platform-handle">${platform.handle}</div>
                            </div>
                            <div class="platform-followers">${platform.followers}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Top Locations -->
            <div class="report-card">
                <div class="card-header">
                    <h3 class="card-title">Top Audience Locations</h3>
                </div>
                <div class="demo-bars">
                    ${reportData.locations.map(loc => `
                        <div class="demo-bar-item">
                            <span class="demo-bar-label">${loc.country}</span>
                            <div class="demo-bar-track">
                                <div class="demo-bar-fill" style="width: ${loc.percent}%"></div>
                            </div>
                            <span class="demo-bar-value">${loc.percent}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function generateMockReportData(creator) {
        const bios = [
            'Lifestyle content creator sharing daily inspiration, fashion tips, and authentic moments. Brand collaborations welcome! 📧',
            'Digital storyteller | Creating content that connects and inspires | Working with brands I love 💫',
            'Content creator & entrepreneur | Sharing my journey through life, style, and wellness ✨',
            'Your go-to source for lifestyle, travel, and everyday adventures | Let\'s connect!'
        ];

        const tagOptions = [
            ['Lifestyle', 'Fashion', 'Travel', 'Wellness'],
            ['Beauty', 'Skincare', 'Fashion', 'Vlogs'],
            ['Fitness', 'Health', 'Motivation', 'Lifestyle'],
            ['Travel', 'Adventure', 'Photography', 'Lifestyle'],
            ['Food', 'Cooking', 'Recipes', 'Lifestyle'],
            ['Tech', 'Gaming', 'Reviews', 'Entertainment']
        ];

        const brandOptions = [
            { name: 'Nike', logo: 'NK', category: 'Sportswear' },
            { name: 'Apple', logo: 'AP', category: 'Technology' },
            { name: 'Sephora', logo: 'SP', category: 'Beauty' },
            { name: 'Amazon', logo: 'AZ', category: 'E-commerce' },
            { name: 'Spotify', logo: 'SF', category: 'Entertainment' },
            { name: 'Netflix', logo: 'NF', category: 'Streaming' },
            { name: 'Adidas', logo: 'AD', category: 'Sportswear' },
            { name: 'Samsung', logo: 'SM', category: 'Technology' }
        ];

        // Generate random but consistent data based on creator id
        const seed = creator.id;
        const randomFromSeed = (min, max) => {
            const x = Math.sin(seed * 9999) * 10000;
            return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
        };

        return {
            bio: bios[seed % bios.length],
            tags: tagOptions[seed % tagOptions.length],
            engagement: (2 + (seed % 5) + Math.random()).toFixed(1) + '%',
            posts: (500 + seed * 17) % 2000 + 200,
            metrics: {
                likes: formatNumber(randomFromSeed(10000, 150000)),
                likesChange: randomFromSeed(5, 25),
                comments: formatNumber(randomFromSeed(500, 5000)),
                commentsChange: randomFromSeed(3, 18),
                shares: formatNumber(randomFromSeed(200, 3000)),
                sharesChange: randomFromSeed(-5, 20),
                saves: formatNumber(randomFromSeed(1000, 20000)),
                savesChange: randomFromSeed(8, 30)
            },
            demographics: {
                female: 45 + (seed % 30),
                male: 55 - (seed % 30),
                ages: [
                    { range: '13-17', percent: 5 + (seed % 10) },
                    { range: '18-24', percent: 25 + (seed % 15) },
                    { range: '25-34', percent: 30 + (seed % 10) },
                    { range: '35-44', percent: 15 + (seed % 10) },
                    { range: '45+', percent: 10 + (seed % 8) }
                ]
            },
            topContent: [
                {
                    title: 'My morning routine that changed everything...',
                    thumbnail: `https://picsum.photos/seed/${seed}1/160/120`,
                    likes: formatNumber(randomFromSeed(50000, 200000)),
                    comments: formatNumber(randomFromSeed(1000, 8000)),
                    views: formatNumber(randomFromSeed(500000, 2000000))
                },
                {
                    title: 'Behind the scenes of my latest project',
                    thumbnail: `https://picsum.photos/seed/${seed}2/160/120`,
                    likes: formatNumber(randomFromSeed(40000, 180000)),
                    comments: formatNumber(randomFromSeed(800, 6000)),
                    views: formatNumber(randomFromSeed(400000, 1800000))
                },
                {
                    title: 'Answering your most asked questions!',
                    thumbnail: `https://picsum.photos/seed/${seed}3/160/120`,
                    likes: formatNumber(randomFromSeed(35000, 150000)),
                    comments: formatNumber(randomFromSeed(2000, 10000)),
                    views: formatNumber(randomFromSeed(350000, 1500000))
                }
            ],
            brands: shuffleArray([...brandOptions], seed).slice(0, 4).map(b => ({
                ...b,
                score: 70 + (seed % 25)
            })),
            platforms: generatePlatformData(creator),
            locations: [
                { country: 'USA', percent: 35 + (seed % 15) },
                { country: 'UK', percent: 12 + (seed % 8) },
                { country: 'Canada', percent: 8 + (seed % 6) },
                { country: 'Australia', percent: 6 + (seed % 5) },
                { country: 'Germany', percent: 4 + (seed % 4) }
            ]
        };
    }

    function generatePlatformData(creator) {
        const platforms = [];
        const mainPlatform = creator.platform;

        // Main platform
        platforms.push({
            name: capitalize(mainPlatform),
            handle: creator.handle,
            followers: creator.followers
        });

        // Add other platforms with reduced followers
        const otherPlatforms = ['instagram', 'youtube', 'tiktok', 'twitter'].filter(p => p !== mainPlatform);
        const followerNum = parseFollowers(creator.followers);

        otherPlatforms.slice(0, 2).forEach((platform, i) => {
            const reducedFollowers = Math.floor(followerNum * (0.3 + Math.random() * 0.4));
            platforms.push({
                name: capitalize(platform),
                handle: creator.handle,
                followers: formatNumber(reducedFollowers)
            });
        });

        return platforms;
    }

    // ===========================
    // Previous Reports
    // ===========================

    function loadPreviousReports() {
        const stored = localStorage.getItem('squadtools_previous_reports');
        if (stored) {
            previousReports = JSON.parse(stored);
        } else {
            // Initialize with some sample data
            previousReports = [
                { ...mockCreators['s'][0], date: '2 days ago' },
                { ...mockCreators['e'][0], date: '3 days ago' },
                { ...mockCreators['m'][0], date: '5 days ago' },
                { ...mockCreators['j'][0], date: '1 week ago' },
                { ...mockCreators['l'][0], date: '1 week ago' }
            ];
            savePreviousReports();
        }
    }

    function savePreviousReports() {
        localStorage.setItem('squadtools_previous_reports', JSON.stringify(previousReports));
    }

    function addToPreviousReports(creator) {
        // Remove if already exists
        previousReports = previousReports.filter(r => r.id !== creator.id);

        // Add to beginning
        previousReports.unshift({
            ...creator,
            date: 'Just now'
        });

        // Keep only last 5
        previousReports = previousReports.slice(0, 5);

        savePreviousReports();
        renderPreviousReports();
    }

    function renderPreviousReports() {
        if (previousReports.length === 0) {
            elements.previousReports.style.display = 'none';
            return;
        }

        elements.previousReports.style.display = 'block';
        elements.previousList.innerHTML = previousReports.map(report => `
            <div class="previous-item" data-creator-id="${report.id}">
                <div class="previous-avatar">
                    <img src="${report.avatar}" alt="${report.name}" />
                </div>
                <div class="previous-info">
                    <div class="previous-name">${report.name}</div>
                    <div class="previous-date">${report.date}</div>
                </div>
                <span class="previous-action">View Report →</span>
            </div>
        `).join('');

        // Bind click events
        elements.previousList.querySelectorAll('.previous-item').forEach(item => {
            item.addEventListener('click', () => {
                const creatorId = parseInt(item.dataset.creatorId);
                const creator = findCreatorById(creatorId);
                if (creator) {
                    selectCreator(creator);
                }
            });
        });
    }

    // ===========================
    // Utility Functions
    // ===========================

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    function parseFollowers(str) {
        const num = parseFloat(str);
        if (str.includes('M')) return num * 1000000;
        if (str.includes('K')) return num * 1000;
        return num;
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function shuffleArray(array, seed) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor((Math.sin(seed * i) * 10000 - Math.floor(Math.sin(seed * i) * 10000)) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // ===========================
    // Start Application
    // ===========================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
