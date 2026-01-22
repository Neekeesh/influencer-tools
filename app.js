// Influencer Tools - Main Application
// Complete app.js with UI and search improvements

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const CONFIG = {
    API_BASE_URL: '/api',
    DEBOUNCE_DELAY: 300,
    MIN_SEARCH_LENGTH: 2,
    RESULTS_PER_PAGE: 20,
    MAX_SUGGESTIONS: 8,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    PLATFORMS: ['instagram', 'youtube', 'tiktok', 'twitter', 'twitch'],
    CATEGORIES: ['fashion', 'beauty', 'fitness', 'gaming', 'food', 'travel', 'tech', 'lifestyle', 'music', 'sports'],
    FOLLOWER_RANGES: [
      { label: 'Nano (1K-10K)', min: 1000, max: 10000 },
      { label: 'Micro (10K-100K)', min: 10000, max: 100000 },
      { label: 'Mid-tier (100K-500K)', min: 100000, max: 500000 },
      { label: 'Macro (500K-1M)', min: 500000, max: 1000000 },
      { label: 'Mega (1M+)', min: 1000000, max: null }
    ],
    ENGAGEMENT_RATES: [
      { label: 'Low (<1%)', min: 0, max: 1 },
      { label: 'Average (1-3%)', min: 1, max: 3 },
      { label: 'Good (3-6%)', min: 3, max: 6 },
      { label: 'Excellent (>6%)', min: 6, max: null }
    ]
  };

  // ============================================
  // State Management
  // ============================================
  const state = {
    searchQuery: '',
    filters: {
      platforms: [],
      categories: [],
      followerRange: null,
      engagementRate: null,
      location: '',
      verified: false
    },
    sortBy: 'relevance',
    sortOrder: 'desc',
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
    results: [],
    selectedInfluencers: [],
    recentSearches: [],
    isLoading: false,
    error: null,
    viewMode: 'grid', // 'grid' or 'list'
    cache: new Map()
  };

  // ============================================
  // Utility Functions
  // ============================================
  const utils = {
    debounce(fn, delay) {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    },

    throttle(fn, limit) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          fn.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    formatNumber(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      }
      return num.toString();
    },

    formatEngagementRate(rate) {
      return rate.toFixed(2) + '%';
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    highlightMatch(text, query) {
      if (!query) return utils.escapeHtml(text);
      const escaped = utils.escapeHtml(text);
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
    },

    generateCacheKey(query, filters, sortBy, page) {
      return JSON.stringify({ query, filters, sortBy, page });
    },

    isCacheValid(timestamp) {
      return Date.now() - timestamp < CONFIG.CACHE_TTL;
    },

    saveToLocalStorage(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    },

    loadFromLocalStorage(key) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        console.warn('LocalStorage load failed:', e);
        return null;
      }
    },

    getRelativeTime(date) {
      const now = new Date();
      const diff = now - new Date(date);
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    }
  };

  // ============================================
  // API Service
  // ============================================
  const api = {
    async request(endpoint, options = {}) {
      const url = `${CONFIG.API_BASE_URL}${endpoint}`;
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },

    async searchInfluencers(params) {
      const queryString = new URLSearchParams(params).toString();
      return this.request(`/influencers/search?${queryString}`);
    },

    async getInfluencer(id) {
      return this.request(`/influencers/${id}`);
    },

    async getSuggestions(query) {
      return this.request(`/influencers/suggestions?q=${encodeURIComponent(query)}`);
    },

    async getCategories() {
      return this.request('/categories');
    },

    async exportInfluencers(ids, format = 'csv') {
      return this.request('/influencers/export', {
        method: 'POST',
        body: JSON.stringify({ ids, format })
      });
    }
  };

  // ============================================
  // Search Module
  // ============================================
  const search = {
    inputEl: null,
    suggestionsEl: null,
    clearBtnEl: null,
    currentSuggestions: [],
    selectedSuggestionIndex: -1,

    init() {
      this.inputEl = document.getElementById('search-input');
      this.suggestionsEl = document.getElementById('search-suggestions');
      this.clearBtnEl = document.getElementById('search-clear');

      if (!this.inputEl) return;

      this.bindEvents();
      this.loadRecentSearches();
    },

    bindEvents() {
      this.inputEl.addEventListener('input', utils.debounce((e) => {
        this.handleInput(e.target.value);
      }, CONFIG.DEBOUNCE_DELAY));

      this.inputEl.addEventListener('keydown', (e) => this.handleKeydown(e));
      this.inputEl.addEventListener('focus', () => this.handleFocus());
      this.inputEl.addEventListener('blur', () => {
        setTimeout(() => this.hideSuggestions(), 200);
      });

      if (this.clearBtnEl) {
        this.clearBtnEl.addEventListener('click', () => this.clearSearch());
      }

      document.getElementById('search-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.executeSearch();
      });
    },

    async handleInput(value) {
      state.searchQuery = value.trim();
      this.updateClearButton();

      if (state.searchQuery.length < CONFIG.MIN_SEARCH_LENGTH) {
        this.showRecentSearches();
        return;
      }

      await this.fetchSuggestions(state.searchQuery);
    },

    handleKeydown(e) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.navigateSuggestions(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigateSuggestions(-1);
          break;
        case 'Enter':
          e.preventDefault();
          if (this.selectedSuggestionIndex >= 0) {
            this.selectSuggestion(this.currentSuggestions[this.selectedSuggestionIndex]);
          } else {
            this.executeSearch();
          }
          break;
        case 'Escape':
          this.hideSuggestions();
          this.inputEl.blur();
          break;
      }
    },

    handleFocus() {
      if (state.searchQuery.length >= CONFIG.MIN_SEARCH_LENGTH) {
        this.showSuggestions();
      } else {
        this.showRecentSearches();
      }
    },

    async fetchSuggestions(query) {
      try {
        const data = await api.getSuggestions(query);
        this.currentSuggestions = data.suggestions || [];
        this.renderSuggestions();
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        this.currentSuggestions = [];
      }
    },

    renderSuggestions() {
      if (!this.suggestionsEl || this.currentSuggestions.length === 0) {
        this.hideSuggestions();
        return;
      }

      const html = this.currentSuggestions.slice(0, CONFIG.MAX_SUGGESTIONS).map((suggestion, index) => `
        <li class="suggestion-item ${index === this.selectedSuggestionIndex ? 'selected' : ''}"
            data-index="${index}"
            role="option"
            aria-selected="${index === this.selectedSuggestionIndex}">
          <div class="suggestion-avatar">
            <img src="${suggestion.avatarUrl || '/images/default-avatar.png'}"
                 alt="${utils.escapeHtml(suggestion.name)}"
                 loading="lazy"
                 onerror="this.src='/images/default-avatar.png'">
            ${suggestion.verified ? '<span class="verified-badge" title="Verified">✓</span>' : ''}
          </div>
          <div class="suggestion-info">
            <span class="suggestion-name">${utils.highlightMatch(suggestion.name, state.searchQuery)}</span>
            <span class="suggestion-handle">@${utils.escapeHtml(suggestion.handle)}</span>
            <span class="suggestion-meta">
              <span class="platform-icon platform-${suggestion.platform}"></span>
              ${utils.formatNumber(suggestion.followers)} followers
            </span>
          </div>
        </li>
      `).join('');

      this.suggestionsEl.innerHTML = `<ul class="suggestions-list" role="listbox">${html}</ul>`;
      this.suggestionsEl.classList.add('visible');

      this.suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          const index = parseInt(item.dataset.index);
          this.selectSuggestion(this.currentSuggestions[index]);
        });
      });
    },

    showRecentSearches() {
      if (!this.suggestionsEl || state.recentSearches.length === 0) {
        this.hideSuggestions();
        return;
      }

      const html = `
        <div class="recent-searches">
          <div class="recent-header">
            <span>Recent Searches</span>
            <button class="clear-recent" type="button">Clear</button>
          </div>
          <ul class="suggestions-list" role="listbox">
            ${state.recentSearches.map((search, index) => `
              <li class="suggestion-item recent-item" data-query="${utils.escapeHtml(search.query)}" role="option">
                <span class="recent-icon">🕐</span>
                <span class="recent-query">${utils.escapeHtml(search.query)}</span>
                <span class="recent-time">${utils.getRelativeTime(search.timestamp)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;

      this.suggestionsEl.innerHTML = html;
      this.suggestionsEl.classList.add('visible');

      this.suggestionsEl.querySelector('.clear-recent')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearRecentSearches();
      });

      this.suggestionsEl.querySelectorAll('.recent-item').forEach(item => {
        item.addEventListener('click', () => {
          this.inputEl.value = item.dataset.query;
          state.searchQuery = item.dataset.query;
          this.executeSearch();
        });
      });
    },

    navigateSuggestions(direction) {
      const maxIndex = this.currentSuggestions.length - 1;
      this.selectedSuggestionIndex += direction;

      if (this.selectedSuggestionIndex < -1) {
        this.selectedSuggestionIndex = maxIndex;
      } else if (this.selectedSuggestionIndex > maxIndex) {
        this.selectedSuggestionIndex = -1;
      }

      this.updateSuggestionSelection();
    },

    updateSuggestionSelection() {
      this.suggestionsEl?.querySelectorAll('.suggestion-item').forEach((item, index) => {
        item.classList.toggle('selected', index === this.selectedSuggestionIndex);
        item.setAttribute('aria-selected', index === this.selectedSuggestionIndex);
      });

      if (this.selectedSuggestionIndex >= 0) {
        this.inputEl.value = this.currentSuggestions[this.selectedSuggestionIndex].name;
      } else {
        this.inputEl.value = state.searchQuery;
      }
    },

    selectSuggestion(suggestion) {
      state.searchQuery = suggestion.name;
      this.inputEl.value = suggestion.name;
      this.hideSuggestions();
      this.executeSearch();
    },

    showSuggestions() {
      if (this.currentSuggestions.length > 0) {
        this.suggestionsEl?.classList.add('visible');
      }
    },

    hideSuggestions() {
      this.suggestionsEl?.classList.remove('visible');
      this.selectedSuggestionIndex = -1;
    },

    updateClearButton() {
      if (this.clearBtnEl) {
        this.clearBtnEl.style.display = state.searchQuery.length > 0 ? 'block' : 'none';
      }
    },

    clearSearch() {
      state.searchQuery = '';
      this.inputEl.value = '';
      this.updateClearButton();
      this.hideSuggestions();
      this.inputEl.focus();
      results.clear();
    },

    async executeSearch() {
      if (state.searchQuery.length < CONFIG.MIN_SEARCH_LENGTH) return;

      this.hideSuggestions();
      this.saveRecentSearch(state.searchQuery);
      state.currentPage = 1;
      await results.fetch();
    },

    saveRecentSearch(query) {
      const existing = state.recentSearches.findIndex(s => s.query.toLowerCase() === query.toLowerCase());
      if (existing !== -1) {
        state.recentSearches.splice(existing, 1);
      }

      state.recentSearches.unshift({
        query,
        timestamp: new Date().toISOString()
      });

      state.recentSearches = state.recentSearches.slice(0, 10);
      utils.saveToLocalStorage('recentSearches', state.recentSearches);
    },

    loadRecentSearches() {
      state.recentSearches = utils.loadFromLocalStorage('recentSearches') || [];
    },

    clearRecentSearches() {
      state.recentSearches = [];
      utils.saveToLocalStorage('recentSearches', []);
      this.hideSuggestions();
    }
  };

  // ============================================
  // Filters Module
  // ============================================
  const filters = {
    containerEl: null,
    activeFiltersEl: null,

    init() {
      this.containerEl = document.getElementById('filters-panel');
      this.activeFiltersEl = document.getElementById('active-filters');

      if (!this.containerEl) return;

      this.render();
      this.bindEvents();
      this.loadSavedFilters();
    },

    render() {
      this.containerEl.innerHTML = `
        <div class="filters-header">
          <h3>Filters</h3>
          <button class="filters-reset" type="button">Reset All</button>
        </div>

        <div class="filter-group">
          <label class="filter-label">Platforms</label>
          <div class="filter-options platform-options">
            ${CONFIG.PLATFORMS.map(platform => `
              <label class="filter-checkbox">
                <input type="checkbox" name="platform" value="${platform}">
                <span class="platform-icon platform-${platform}"></span>
                <span>${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Categories</label>
          <div class="filter-options category-options">
            ${CONFIG.CATEGORIES.map(category => `
              <label class="filter-checkbox">
                <input type="checkbox" name="category" value="${category}">
                <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Follower Count</label>
          <select class="filter-select" id="follower-range">
            <option value="">Any size</option>
            ${CONFIG.FOLLOWER_RANGES.map((range, index) => `
              <option value="${index}">${range.label}</option>
            `).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Engagement Rate</label>
          <select class="filter-select" id="engagement-rate">
            <option value="">Any rate</option>
            ${CONFIG.ENGAGEMENT_RATES.map((range, index) => `
              <option value="${index}">${range.label}</option>
            `).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Location</label>
          <input type="text" class="filter-input" id="location-filter" placeholder="Enter city or country">
        </div>

        <div class="filter-group">
          <label class="filter-checkbox verified-filter">
            <input type="checkbox" id="verified-only">
            <span>Verified accounts only</span>
          </label>
        </div>

        <button class="filters-apply" type="button">Apply Filters</button>
      `;
    },

    bindEvents() {
      this.containerEl.querySelector('.filters-reset')?.addEventListener('click', () => this.reset());
      this.containerEl.querySelector('.filters-apply')?.addEventListener('click', () => this.apply());

      this.containerEl.querySelectorAll('input[name="platform"]').forEach(input => {
        input.addEventListener('change', (e) => {
          this.updatePlatforms(e.target.value, e.target.checked);
        });
      });

      this.containerEl.querySelectorAll('input[name="category"]').forEach(input => {
        input.addEventListener('change', (e) => {
          this.updateCategories(e.target.value, e.target.checked);
        });
      });

      document.getElementById('follower-range')?.addEventListener('change', (e) => {
        state.filters.followerRange = e.target.value ? CONFIG.FOLLOWER_RANGES[parseInt(e.target.value)] : null;
      });

      document.getElementById('engagement-rate')?.addEventListener('change', (e) => {
        state.filters.engagementRate = e.target.value ? CONFIG.ENGAGEMENT_RATES[parseInt(e.target.value)] : null;
      });

      document.getElementById('location-filter')?.addEventListener('input', utils.debounce((e) => {
        state.filters.location = e.target.value.trim();
      }, CONFIG.DEBOUNCE_DELAY));

      document.getElementById('verified-only')?.addEventListener('change', (e) => {
        state.filters.verified = e.target.checked;
      });
    },

    updatePlatforms(platform, checked) {
      if (checked && !state.filters.platforms.includes(platform)) {
        state.filters.platforms.push(platform);
      } else if (!checked) {
        state.filters.platforms = state.filters.platforms.filter(p => p !== platform);
      }
    },

    updateCategories(category, checked) {
      if (checked && !state.filters.categories.includes(category)) {
        state.filters.categories.push(category);
      } else if (!checked) {
        state.filters.categories = state.filters.categories.filter(c => c !== category);
      }
    },

    apply() {
      state.currentPage = 1;
      this.renderActiveFilters();
      this.saveFilters();
      results.fetch();
    },

    reset() {
      state.filters = {
        platforms: [],
        categories: [],
        followerRange: null,
        engagementRate: null,
        location: '',
        verified: false
      };

      this.containerEl.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.checked = false;
      });

      this.containerEl.querySelectorAll('select').forEach(select => {
        select.value = '';
      });

      document.getElementById('location-filter').value = '';

      this.renderActiveFilters();
      utils.saveToLocalStorage('savedFilters', null);
      state.currentPage = 1;
      results.fetch();
    },

    renderActiveFilters() {
      if (!this.activeFiltersEl) return;

      const tags = [];

      state.filters.platforms.forEach(platform => {
        tags.push({ type: 'platform', value: platform, label: platform });
      });

      state.filters.categories.forEach(category => {
        tags.push({ type: 'category', value: category, label: category });
      });

      if (state.filters.followerRange) {
        tags.push({ type: 'followerRange', value: null, label: state.filters.followerRange.label });
      }

      if (state.filters.engagementRate) {
        tags.push({ type: 'engagementRate', value: null, label: state.filters.engagementRate.label });
      }

      if (state.filters.location) {
        tags.push({ type: 'location', value: null, label: `Location: ${state.filters.location}` });
      }

      if (state.filters.verified) {
        tags.push({ type: 'verified', value: null, label: 'Verified only' });
      }

      if (tags.length === 0) {
        this.activeFiltersEl.innerHTML = '';
        this.activeFiltersEl.classList.remove('visible');
        return;
      }

      this.activeFiltersEl.innerHTML = `
        <div class="active-filters-list">
          ${tags.map(tag => `
            <span class="filter-tag" data-type="${tag.type}" data-value="${tag.value || ''}">
              ${utils.escapeHtml(tag.label)}
              <button class="filter-tag-remove" type="button" aria-label="Remove filter">×</button>
            </span>
          `).join('')}
          <button class="clear-all-filters" type="button">Clear all</button>
        </div>
      `;
      this.activeFiltersEl.classList.add('visible');

      this.activeFiltersEl.querySelectorAll('.filter-tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tag = e.target.closest('.filter-tag');
          this.removeFilter(tag.dataset.type, tag.dataset.value);
        });
      });

      this.activeFiltersEl.querySelector('.clear-all-filters')?.addEventListener('click', () => this.reset());
    },

    removeFilter(type, value) {
      switch (type) {
        case 'platform':
          state.filters.platforms = state.filters.platforms.filter(p => p !== value);
          this.containerEl.querySelector(`input[name="platform"][value="${value}"]`).checked = false;
          break;
        case 'category':
          state.filters.categories = state.filters.categories.filter(c => c !== value);
          this.containerEl.querySelector(`input[name="category"][value="${value}"]`).checked = false;
          break;
        case 'followerRange':
          state.filters.followerRange = null;
          document.getElementById('follower-range').value = '';
          break;
        case 'engagementRate':
          state.filters.engagementRate = null;
          document.getElementById('engagement-rate').value = '';
          break;
        case 'location':
          state.filters.location = '';
          document.getElementById('location-filter').value = '';
          break;
        case 'verified':
          state.filters.verified = false;
          document.getElementById('verified-only').checked = false;
          break;
      }

      this.apply();
    },

    saveFilters() {
      utils.saveToLocalStorage('savedFilters', state.filters);
    },

    loadSavedFilters() {
      const saved = utils.loadFromLocalStorage('savedFilters');
      if (!saved) return;

      state.filters = { ...state.filters, ...saved };

      state.filters.platforms.forEach(platform => {
        const input = this.containerEl.querySelector(`input[name="platform"][value="${platform}"]`);
        if (input) input.checked = true;
      });

      state.filters.categories.forEach(category => {
        const input = this.containerEl.querySelector(`input[name="category"][value="${category}"]`);
        if (input) input.checked = true;
      });

      if (state.filters.followerRange) {
        const index = CONFIG.FOLLOWER_RANGES.findIndex(r => r.label === state.filters.followerRange.label);
        if (index !== -1) document.getElementById('follower-range').value = index;
      }

      if (state.filters.engagementRate) {
        const index = CONFIG.ENGAGEMENT_RATES.findIndex(r => r.label === state.filters.engagementRate.label);
        if (index !== -1) document.getElementById('engagement-rate').value = index;
      }

      if (state.filters.location) {
        document.getElementById('location-filter').value = state.filters.location;
      }

      if (state.filters.verified) {
        document.getElementById('verified-only').checked = true;
      }

      this.renderActiveFilters();
    }
  };

  // ============================================
  // Sorting Module
  // ============================================
  const sorting = {
    containerEl: null,

    init() {
      this.containerEl = document.getElementById('sort-controls');
      if (!this.containerEl) return;

      this.render();
      this.bindEvents();
    },

    render() {
      this.containerEl.innerHTML = `
        <div class="sort-wrapper">
          <label for="sort-by">Sort by:</label>
          <select id="sort-by" class="sort-select">
            <option value="relevance">Relevance</option>
            <option value="followers">Followers</option>
            <option value="engagement">Engagement Rate</option>
            <option value="recent">Recently Active</option>
            <option value="growth">Growth Rate</option>
          </select>
          <button class="sort-order" type="button" title="Toggle sort order" aria-label="Sort descending">
            <span class="sort-icon">↓</span>
          </button>
        </div>
      `;
    },

    bindEvents() {
      document.getElementById('sort-by')?.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        state.currentPage = 1;
        results.fetch();
      });

      this.containerEl.querySelector('.sort-order')?.addEventListener('click', (e) => {
        state.sortOrder = state.sortOrder === 'desc' ? 'asc' : 'desc';
        const btn = e.currentTarget;
        btn.querySelector('.sort-icon').textContent = state.sortOrder === 'desc' ? '↓' : '↑';
        btn.setAttribute('aria-label', `Sort ${state.sortOrder === 'desc' ? 'descending' : 'ascending'}`);
        state.currentPage = 1;
        results.fetch();
      });
    }
  };

  // ============================================
  // Results Module
  // ============================================
  const results = {
    containerEl: null,
    paginationEl: null,
    countEl: null,
    viewToggleEl: null,

    init() {
      this.containerEl = document.getElementById('results-container');
      this.paginationEl = document.getElementById('pagination');
      this.countEl = document.getElementById('results-count');
      this.viewToggleEl = document.getElementById('view-toggle');

      if (!this.containerEl) return;

      this.bindEvents();
      this.loadViewMode();
    },

    bindEvents() {
      this.viewToggleEl?.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          state.viewMode = btn.dataset.view;
          this.updateViewMode();
          utils.saveToLocalStorage('viewMode', state.viewMode);
        });
      });

      this.containerEl.addEventListener('click', (e) => {
        const card = e.target.closest('.influencer-card');
        if (!card) return;

        if (e.target.closest('.select-checkbox')) {
          this.toggleSelection(card.dataset.id);
        } else if (e.target.closest('.quick-action')) {
          this.handleQuickAction(card.dataset.id, e.target.closest('.quick-action').dataset.action);
        } else {
          this.showInfluencerDetail(card.dataset.id);
        }
      });
    },

    loadViewMode() {
      const saved = utils.loadFromLocalStorage('viewMode');
      if (saved) {
        state.viewMode = saved;
        this.updateViewMode();
      }
    },

    updateViewMode() {
      this.containerEl.classList.remove('grid-view', 'list-view');
      this.containerEl.classList.add(`${state.viewMode}-view`);

      this.viewToggleEl?.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === state.viewMode);
      });
    },

    async fetch() {
      const cacheKey = utils.generateCacheKey(state.searchQuery, state.filters, state.sortBy, state.currentPage);
      const cached = state.cache.get(cacheKey);

      if (cached && utils.isCacheValid(cached.timestamp)) {
        this.handleResponse(cached.data);
        return;
      }

      this.showLoading();
      state.error = null;

      try {
        const params = this.buildParams();
        const data = await api.searchInfluencers(params);

        state.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });

        this.handleResponse(data);
      } catch (error) {
        this.showError(error.message);
      }
    },

    buildParams() {
      const params = {
        q: state.searchQuery,
        page: state.currentPage,
        limit: CONFIG.RESULTS_PER_PAGE,
        sort: state.sortBy,
        order: state.sortOrder
      };

      if (state.filters.platforms.length > 0) {
        params.platforms = state.filters.platforms.join(',');
      }

      if (state.filters.categories.length > 0) {
        params.categories = state.filters.categories.join(',');
      }

      if (state.filters.followerRange) {
        params.followersMin = state.filters.followerRange.min;
        if (state.filters.followerRange.max) {
          params.followersMax = state.filters.followerRange.max;
        }
      }

      if (state.filters.engagementRate) {
        params.engagementMin = state.filters.engagementRate.min;
        if (state.filters.engagementRate.max) {
          params.engagementMax = state.filters.engagementRate.max;
        }
      }

      if (state.filters.location) {
        params.location = state.filters.location;
      }

      if (state.filters.verified) {
        params.verified = true;
      }

      return params;
    },

    handleResponse(data) {
      state.results = data.influencers || [];
      state.totalResults = data.total || 0;
      state.totalPages = Math.ceil(state.totalResults / CONFIG.RESULTS_PER_PAGE);
      state.isLoading = false;

      this.render();
      this.renderPagination();
      this.updateCount();
    },

    render() {
      if (state.results.length === 0) {
        this.showEmpty();
        return;
      }

      const html = state.results.map(influencer => this.renderCard(influencer)).join('');
      this.containerEl.innerHTML = `<div class="results-grid">${html}</div>`;
    },

    renderCard(influencer) {
      const isSelected = state.selectedInfluencers.includes(influencer.id);

      return `
        <article class="influencer-card ${isSelected ? 'selected' : ''}" data-id="${influencer.id}">
          <div class="card-header">
            <label class="select-checkbox">
              <input type="checkbox" ${isSelected ? 'checked' : ''}>
              <span class="checkmark"></span>
            </label>
            <div class="card-avatar">
              <img src="${influencer.avatarUrl || '/images/default-avatar.png'}"
                   alt="${utils.escapeHtml(influencer.name)}"
                   loading="lazy"
                   onerror="this.src='/images/default-avatar.png'">
              ${influencer.verified ? '<span class="verified-badge" title="Verified">✓</span>' : ''}
            </div>
            <div class="card-info">
              <h3 class="card-name">${utils.escapeHtml(influencer.name)}</h3>
              <span class="card-handle">@${utils.escapeHtml(influencer.handle)}</span>
              ${influencer.location ? `<span class="card-location">📍 ${utils.escapeHtml(influencer.location)}</span>` : ''}
            </div>
          </div>

          <div class="card-platforms">
            ${influencer.platforms.map(p => `
              <span class="platform-badge platform-${p.name}">
                <span class="platform-icon platform-${p.name}"></span>
                ${utils.formatNumber(p.followers)}
              </span>
            `).join('')}
          </div>

          <div class="card-stats">
            <div class="stat">
              <span class="stat-value">${utils.formatNumber(influencer.totalFollowers)}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat">
              <span class="stat-value">${utils.formatEngagementRate(influencer.engagementRate)}</span>
              <span class="stat-label">Engagement</span>
            </div>
            <div class="stat">
              <span class="stat-value">${influencer.avgLikes ? utils.formatNumber(influencer.avgLikes) : '-'}</span>
              <span class="stat-label">Avg. Likes</span>
            </div>
          </div>

          <div class="card-categories">
            ${influencer.categories.slice(0, 3).map(cat => `
              <span class="category-tag">${utils.escapeHtml(cat)}</span>
            `).join('')}
            ${influencer.categories.length > 3 ? `<span class="category-tag more">+${influencer.categories.length - 3}</span>` : ''}
          </div>

          <div class="card-actions">
            <button class="quick-action" data-action="save" title="Save to list">
              <span class="action-icon">♡</span>
            </button>
            <button class="quick-action" data-action="compare" title="Add to compare">
              <span class="action-icon">⚖</span>
            </button>
            <button class="quick-action" data-action="share" title="Share profile">
              <span class="action-icon">↗</span>
            </button>
            <button class="btn btn-primary btn-sm view-profile">View Profile</button>
          </div>
        </article>
      `;
    },

    renderPagination() {
      if (!this.paginationEl || state.totalPages <= 1) {
        if (this.paginationEl) this.paginationEl.innerHTML = '';
        return;
      }

      const pages = this.generatePageNumbers();

      this.paginationEl.innerHTML = `
        <nav class="pagination-nav" aria-label="Results pagination">
          <button class="page-btn prev" ${state.currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">
            ← Previous
          </button>
          <div class="page-numbers">
            ${pages.map(page => {
              if (page === '...') {
                return '<span class="page-ellipsis">...</span>';
              }
              return `
                <button class="page-btn ${page === state.currentPage ? 'active' : ''}"
                        data-page="${page}"
                        ${page === state.currentPage ? 'aria-current="page"' : ''}>
                  ${page}
                </button>
              `;
            }).join('')}
          </div>
          <button class="page-btn next" ${state.currentPage === state.totalPages ? 'disabled' : ''} aria-label="Next page">
            Next →
          </button>
        </nav>
      `;

      this.paginationEl.querySelector('.prev')?.addEventListener('click', () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          this.fetch();
          this.scrollToTop();
        }
      });

      this.paginationEl.querySelector('.next')?.addEventListener('click', () => {
        if (state.currentPage < state.totalPages) {
          state.currentPage++;
          this.fetch();
          this.scrollToTop();
        }
      });

      this.paginationEl.querySelectorAll('.page-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.currentPage = parseInt(btn.dataset.page);
          this.fetch();
          this.scrollToTop();
        });
      });
    },

    generatePageNumbers() {
      const pages = [];
      const total = state.totalPages;
      const current = state.currentPage;
      const delta = 2;

      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);

        if (current > delta + 2) {
          pages.push('...');
        }

        const start = Math.max(2, current - delta);
        const end = Math.min(total - 1, current + delta);

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (current < total - delta - 1) {
          pages.push('...');
        }

        pages.push(total);
      }

      return pages;
    },

    updateCount() {
      if (!this.countEl) return;

      const start = (state.currentPage - 1) * CONFIG.RESULTS_PER_PAGE + 1;
      const end = Math.min(state.currentPage * CONFIG.RESULTS_PER_PAGE, state.totalResults);

      this.countEl.innerHTML = `
        Showing <strong>${start}-${end}</strong> of <strong>${utils.formatNumber(state.totalResults)}</strong> influencers
      `;
    },

    showLoading() {
      state.isLoading = true;
      this.containerEl.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Searching influencers...</p>
        </div>
      `;
    },

    showEmpty() {
      this.containerEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No influencers found</h3>
          <p>Try adjusting your search terms or filters to find more results.</p>
          <button class="btn btn-secondary" id="reset-filters">Clear all filters</button>
        </div>
      `;

      document.getElementById('reset-filters')?.addEventListener('click', () => {
        filters.reset();
      });

      if (this.paginationEl) this.paginationEl.innerHTML = '';
      if (this.countEl) this.countEl.innerHTML = '';
    },

    showError(message) {
      state.isLoading = false;
      state.error = message;

      this.containerEl.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Something went wrong</h3>
          <p>${utils.escapeHtml(message)}</p>
          <button class="btn btn-primary" id="retry-search">Try again</button>
        </div>
      `;

      document.getElementById('retry-search')?.addEventListener('click', () => {
        this.fetch();
      });
    },

    clear() {
      state.results = [];
      state.totalResults = 0;
      state.totalPages = 0;
      state.currentPage = 1;

      this.containerEl.innerHTML = `
        <div class="initial-state">
          <div class="initial-icon">👋</div>
          <h3>Find the perfect influencer</h3>
          <p>Search by name, handle, or keywords to discover influencers for your campaign.</p>
        </div>
      `;

      if (this.paginationEl) this.paginationEl.innerHTML = '';
      if (this.countEl) this.countEl.innerHTML = '';
    },

    toggleSelection(id) {
      const index = state.selectedInfluencers.indexOf(id);
      if (index === -1) {
        state.selectedInfluencers.push(id);
      } else {
        state.selectedInfluencers.splice(index, 1);
      }

      const card = this.containerEl.querySelector(`.influencer-card[data-id="${id}"]`);
      if (card) {
        card.classList.toggle('selected', index === -1);
      }

      this.updateSelectionUI();
    },

    updateSelectionUI() {
      const count = state.selectedInfluencers.length;
      const bulkActions = document.getElementById('bulk-actions');

      if (bulkActions) {
        bulkActions.classList.toggle('visible', count > 0);
        bulkActions.querySelector('.selection-count').textContent = `${count} selected`;
      }
    },

    handleQuickAction(id, action) {
      switch (action) {
        case 'save':
          this.saveInfluencer(id);
          break;
        case 'compare':
          this.addToCompare(id);
          break;
        case 'share':
          this.shareInfluencer(id);
          break;
      }
    },

    saveInfluencer(id) {
      console.log('Save influencer:', id);
      // Implementation for saving to a list
    },

    addToCompare(id) {
      console.log('Add to compare:', id);
      // Implementation for adding to comparison
    },

    shareInfluencer(id) {
      const influencer = state.results.find(i => i.id === id);
      if (influencer && navigator.share) {
        navigator.share({
          title: `${influencer.name} - Influencer Profile`,
          url: `${window.location.origin}/influencer/${id}`
        }).catch(console.error);
      } else {
        navigator.clipboard.writeText(`${window.location.origin}/influencer/${id}`);
      }
    },

    showInfluencerDetail(id) {
      window.location.href = `/influencer/${id}`;
    },

    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ============================================
  // Bulk Actions Module
  // ============================================
  const bulkActions = {
    containerEl: null,

    init() {
      this.containerEl = document.getElementById('bulk-actions');
      if (!this.containerEl) return;

      this.render();
      this.bindEvents();
    },

    render() {
      this.containerEl.innerHTML = `
        <div class="bulk-actions-bar">
          <span class="selection-count">0 selected</span>
          <div class="bulk-buttons">
            <button class="btn btn-secondary" data-action="save-list">
              Save to List
            </button>
            <button class="btn btn-secondary" data-action="compare">
              Compare
            </button>
            <button class="btn btn-secondary" data-action="export">
              Export
            </button>
            <button class="btn btn-ghost" data-action="clear">
              Clear Selection
            </button>
          </div>
        </div>
      `;
    },

    bindEvents() {
      this.containerEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        switch (btn.dataset.action) {
          case 'save-list':
            this.saveToList();
            break;
          case 'compare':
            this.compareSelected();
            break;
          case 'export':
            this.exportSelected();
            break;
          case 'clear':
            this.clearSelection();
            break;
        }
      });
    },

    saveToList() {
      console.log('Save to list:', state.selectedInfluencers);
      // Implementation for saving selected to a list
    },

    compareSelected() {
      if (state.selectedInfluencers.length < 2) {
        alert('Please select at least 2 influencers to compare');
        return;
      }
      window.location.href = `/compare?ids=${state.selectedInfluencers.join(',')}`;
    },

    async exportSelected() {
      if (state.selectedInfluencers.length === 0) return;

      try {
        const result = await api.exportInfluencers(state.selectedInfluencers, 'csv');
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `influencers-export-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Export failed:', error);
      }
    },

    clearSelection() {
      state.selectedInfluencers = [];
      results.containerEl?.querySelectorAll('.influencer-card.selected').forEach(card => {
        card.classList.remove('selected');
        card.querySelector('input[type="checkbox"]').checked = false;
      });
      results.updateSelectionUI();
    }
  };

  // ============================================
  // Mobile Menu Module
  // ============================================
  const mobileMenu = {
    toggleEl: null,
    filtersEl: null,

    init() {
      this.toggleEl = document.getElementById('mobile-filters-toggle');
      this.filtersEl = document.getElementById('filters-panel');

      if (!this.toggleEl || !this.filtersEl) return;

      this.bindEvents();
    },

    bindEvents() {
      this.toggleEl.addEventListener('click', () => this.toggle());

      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            !e.target.closest('#filters-panel') &&
            !e.target.closest('#mobile-filters-toggle') &&
            this.filtersEl.classList.contains('visible')) {
          this.close();
        }
      });
    },

    toggle() {
      this.filtersEl.classList.toggle('visible');
      this.toggleEl.setAttribute('aria-expanded', this.filtersEl.classList.contains('visible'));
    },

    close() {
      this.filtersEl.classList.remove('visible');
      this.toggleEl.setAttribute('aria-expanded', 'false');
    }
  };

  // ============================================
  // Keyboard Shortcuts Module
  // ============================================
  const keyboard = {
    init() {
      document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
          case '/':
            e.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
          case 'Escape':
            search.hideSuggestions();
            mobileMenu.close();
            break;
          case 'g':
            if (e.ctrlKey || e.metaKey) return;
            state.viewMode = 'grid';
            results.updateViewMode();
            break;
          case 'l':
            if (e.ctrlKey || e.metaKey) return;
            state.viewMode = 'list';
            results.updateViewMode();
            break;
        }
      });
    }
  };

  // ============================================
  // Analytics Module
  // ============================================
  const analytics = {
    track(event, data = {}) {
      if (typeof gtag === 'function') {
        gtag('event', event, data);
      }

      console.log('Analytics:', event, data);
    },

    trackSearch(query, resultsCount) {
      this.track('search', {
        search_term: query,
        results_count: resultsCount
      });
    },

    trackFilter(filterType, filterValue) {
      this.track('filter_applied', {
        filter_type: filterType,
        filter_value: filterValue
      });
    },

    trackInfluencerView(influencerId) {
      this.track('influencer_view', {
        influencer_id: influencerId
      });
    }
  };

  // ============================================
  // Application Initialization
  // ============================================
  const app = {
    init() {
      search.init();
      filters.init();
      sorting.init();
      results.init();
      bulkActions.init();
      mobileMenu.init();
      keyboard.init();

      this.setupIntersectionObserver();
      this.setupResizeHandler();

      console.log('Influencer Tools initialized');
    },

    setupIntersectionObserver() {
      if (!('IntersectionObserver' in window)) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
      });
    },

    setupResizeHandler() {
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (window.innerWidth > 768) {
            mobileMenu.close();
          }
        }, 250);
      });
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
  } else {
    app.init();
  }

  // Export for external access if needed
  window.InfluencerTools = {
    state,
    search,
    filters,
    results,
    analytics
  };

})();