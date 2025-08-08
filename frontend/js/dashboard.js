// API Configuration - Using relative URLs since frontend is served from backend
const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = '/';
        return;
    }

    // DOM Elements
    const projectSearchInput = document.getElementById('projectSearch');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');
    const searchLoading = document.getElementById('searchLoading');
    const searchResults = document.getElementById('searchResults');
    const suggestionsList = document.getElementById('suggestionsList');
    const suggestionsContent = document.querySelector('.suggestions-content');
    
    let suggestionTimeout;
    let currentSuggestionIndex = -1;

    // Utility Functions
    function showCustomAlert(message, type = 'info') {
        const modalBody = document.getElementById('customAlertModalBody');
        modalBody.innerHTML = `
            <div class="alert alert-${type} border-0" role="alert">
                <i class="fas ${getAlertIcon(type)} me-2"></i>
                ${message}
            </div>
        `;
        const customAlertModal = new bootstrap.Modal(document.getElementById('customAlertModal'));
        customAlertModal.show();
    }

    function getAlertIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle', 
            'danger': 'fa-times-circle',
            'info': 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }

    // Search functionality
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    // Enhanced input handling with suggestions
    if (projectSearchInput) {
        projectSearchInput.addEventListener('keydown', function(e) {
            const suggestions = document.querySelectorAll('.suggestion-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestions.length - 1);
                updateSuggestionHighlight(suggestions);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
                updateSuggestionHighlight(suggestions);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentSuggestionIndex >= 0 && suggestions[currentSuggestionIndex]) {
                    selectSuggestion(suggestions[currentSuggestionIndex].textContent);
                } else {
                    performSearch();
                }
            } else if (e.key === 'Escape') {
                hideSuggestions();
            }
        });

        projectSearchInput.addEventListener('input', function() {
            const value = this.value.trim();
            
            // Clear previous timeout
            if (suggestionTimeout) {
                clearTimeout(suggestionTimeout);
            }
            
            if (value.length >= 2) {
                // Debounce suggestions
                suggestionTimeout = setTimeout(() => {
                    fetchSuggestions(value);
                }, 300);
                
                this.classList.add('is-valid');
                this.classList.remove('is-invalid');
            } else {
                hideSuggestions();
                this.classList.remove('is-valid', 'is-invalid');
            }
        });

        projectSearchInput.addEventListener('blur', function() {
            // Hide suggestions after a short delay to allow clicking
            setTimeout(() => {
                hideSuggestions();
            }, 200);
        });

        projectSearchInput.addEventListener('focus', function() {
            if (this.value.trim().length >= 2) {
                fetchSuggestions(this.value.trim());
            }
        });
    }

    // Clear search functionality
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', function() {
            projectSearchInput.value = '';
            searchResults.style.display = 'none';
            searchLoading.style.display = 'none';
            hideSuggestions();
            projectSearchInput.focus();
        });
    }

    async function fetchSuggestions(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/projects/suggestions?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (response.ok) {
                displaySuggestions(data.suggestions);
            }
        } catch (error) {
            console.error('Suggestions error:', error);
        }
    }

    function displaySuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            hideSuggestions();
            return;
        }

        suggestionsContent.innerHTML = '';
        currentSuggestionIndex = -1;

        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = suggestion;
            suggestionItem.addEventListener('click', () => selectSuggestion(suggestion));
            suggestionsContent.appendChild(suggestionItem);
        });

        suggestionsList.style.display = 'block';
    }

    function updateSuggestionHighlight(suggestions) {
        suggestions.forEach((item, index) => {
            if (index === currentSuggestionIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    function selectSuggestion(suggestion) {
        projectSearchInput.value = suggestion;
        hideSuggestions();
        performSearch();
    }

    function hideSuggestions() {
        suggestionsList.style.display = 'none';
        currentSuggestionIndex = -1;
    }

    async function performSearch() {
        const searchTerm = projectSearchInput.value.trim();
        
        if (searchTerm === '') {
            showCustomAlert("Please enter a project title to search.", 'warning');
            projectSearchInput.focus();
            return;
        }

        // Show loading
        searchLoading.style.display = 'block';
        searchResults.style.display = 'none';
        searchButton.disabled = true;
        searchButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Searching...';
        hideSuggestions();

        try {
            const response = await fetch(`${API_BASE_URL}/projects/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ searchQuery: searchTerm })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                displaySearchResults(data, searchTerm);
            } else {
                showCustomAlert('Error searching project titles: ' + data.message, 'danger');
            }
        } catch (error) {
            console.error('Search error:', error);
            showCustomAlert('Network error: Unable to connect to server', 'danger');
        } finally {
            // Hide loading
            setTimeout(() => {
                searchLoading.style.display = 'none';
                searchButton.disabled = false;
                searchButton.innerHTML = '<i class="fas fa-search me-2"></i>Search';
            }, 1000);
        }
    }

    function displaySearchResults(data, searchTerm) {
        const exactMatches = data.exactMatches || [];
        const allMatches = data.allMatches || [];
        
        // Get DOM elements
        const exactMatchesSection = document.getElementById('exactMatches');
        const exactMatchesList = document.getElementById('exactMatchesList');
        const allMatchesSection = document.getElementById('allMatches');
        const allMatchesList = document.getElementById('allMatchesList');
        const noMatchesSection = document.getElementById('noMatches');
        const searchTermDisplay = document.getElementById('searchTermDisplay');
        
        // Show similarity summary if available
        if (data.bestMatch && data.highestSimilarity) {
            const similaritySummary = document.createElement('div');
            similaritySummary.className = 'alert alert-info border-0 mb-3';
            let alertClass = 'alert-info';
            if (data.highestSimilarity >= 80) alertClass = 'alert-danger';
            else if (data.highestSimilarity >= 50) alertClass = 'alert-warning';
            else alertClass = 'alert-success';
            
            similaritySummary.className = `alert ${alertClass} border-0 mb-3`;
            similaritySummary.innerHTML = `
                <i class="fas fa-chart-line me-2"></i>
                <strong>Highest Similarity:</strong> ${data.highestSimilarity}% with "${data.bestMatch}"
            `;
            
            // Insert before search results
            const resultsContainer = document.getElementById('searchResults');
            resultsContainer.insertBefore(similaritySummary, resultsContainer.firstChild);
        }
        
        // Check if we have any exact matches
        if (exactMatches.length > 0) {
            exactMatchesList.innerHTML = '';
            exactMatches.forEach(match => {
                const matchItem = createMatchItem(match, true);
                exactMatchesList.appendChild(matchItem);
            });
            exactMatchesSection.style.display = 'block';
            noMatchesSection.style.display = 'none';
        } else {
            exactMatchesSection.style.display = 'none';
            
            // Show no matches message
            if (searchTermDisplay) {
                searchTermDisplay.textContent = searchTerm;
            }
            noMatchesSection.style.display = 'block';
        }
        
        // Display all matches (always show for browsing)
        if (allMatches.length > 0) {
            allMatchesList.innerHTML = '';
            allMatches.slice(0, 10).forEach(match => { // Show only first 10
                const matchItem = createMatchItem(match, false);
                allMatchesList.appendChild(matchItem);
            });
            allMatchesSection.style.display = 'block';
        } else {
            allMatchesSection.style.display = 'none';
            
            // If no projects at all in database
            if (exactMatches.length === 0) {
                noMatchesSection.innerHTML = `
                    <div class="no-matches-content">
                        <i class="fas fa-database fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted mb-2">No Projects in Database</h5>
                        <p class="text-muted mb-3">The database is currently empty. Be the first to submit a project!</p>
                    </div>
                `;
            }
        }
        
        // Show results with animation
        setTimeout(() => {
            searchResults.style.display = 'block';
            searchResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 1000);
    }

    function createMatchItem(match, isExact) {
        const matchItem = document.createElement('div');
        matchItem.className = 'match-item d-flex flex-column flex-md-row align-items-md-center justify-content-between py-2 px-3 mb-2 border rounded shadow-sm';

        const date = new Date(match.dateSubmitted).toLocaleDateString();

        // Similarity percentage badge
        let similarityBadge = '';
        if (typeof match.similarity === 'number') {
            let badgeClass = 'bg-secondary';
            if (match.similarity >= 80) badgeClass = 'bg-success';
            else if (match.similarity >= 50) badgeClass = 'bg-warning text-dark';
            else badgeClass = 'bg-danger';
            similarityBadge = `<span class="badge ${badgeClass} ms-2">Similarity: ${match.similarity.toFixed(1)}%</span>`;
        }

        matchItem.innerHTML = `
            <div class="match-title fw-semibold text-primary">${match.title}</div>
            <div class="match-meta small text-muted mt-1 mt-md-0">
                <i class="fas fa-user me-1"></i>Submitted by: ${match.submittedBy}
                <span class="mx-2">•</span>
                <i class="fas fa-calendar me-1"></i>Date: ${date}
                ${similarityBadge}
                ${isExact ? '<span class="badge bg-success ms-2">Exact Match</span>' : ''}
            </div>
        `;
        return matchItem;
    }

    // Title Submission Form
    const titleSubmissionForm = document.getElementById('titleSubmissionForm');
    if (titleSubmissionForm) {
        titleSubmissionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('projectTitle').value.trim();
            const titleError = document.getElementById('titleError');
            const userData = JSON.parse(localStorage.getItem('user'));
            
            if (title === '') {
                showCustomAlert("Project title cannot be empty.", 'warning');
                return;
            }

            if (title.length < 10) {
                showCustomAlert("Please enter a more descriptive title (at least 10 characters).", 'warning');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/projects/submit-title`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        title: title,
                        submittedBy: userData.email 
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    titleError.style.display = 'none';
                    showCustomAlert(`Project title "${title}" submitted successfully!`, 'success');
                    document.getElementById('projectTitle').value = '';
                } else {
                    if (data.status === 'duplicate') {
                        titleError.innerHTML = `
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            ${data.message}
                            <span class="badge bg-danger ms-2">100% Match</span>
                        `;
                        titleError.style.display = 'block';
                    } else if (data.status === 'high_similarity') {
                        titleError.innerHTML = `
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            ${data.message}
                            <span class="badge bg-warning text-dark ms-2">${data.similarity}% Similar</span>
                        `;
                        titleError.style.display = 'block';
                    } else {
                        titleError.textContent = data.message;
                        titleError.style.display = 'block';
                    }
                    showCustomAlert('Error submitting title: ' + data.message, 'danger');
                }
            } catch (error) {
                console.error('Submit error:', error);
                showCustomAlert('Network error: Unable to connect to server', 'danger');
            }
        });
    }
    
    // Load initial stats
    loadStats();
});

async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/projects/titles`);
        const titles = await response.json();
        
        if (response.ok) {
            document.getElementById('totalProjects').textContent = titles.length;
            
            // Calculate unique titles (simplified)
            const uniqueTitles = new Set(titles.map(t => t.title.toLowerCase().trim()));
            document.getElementById('uniqueProjects').textContent = uniqueTitles.size;
        }
    } catch (error) {
        console.error('Stats loading error:', error);
        document.getElementById('totalProjects').textContent = '--';
        document.getElementById('uniqueProjects').textContent = '--';
    }
}

// Global functions
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    window.location.href = '/';
}

function clearForm() {
    document.getElementById('projectTitle').value = '';
    document.getElementById('titleError').style.display = 'none';
}
