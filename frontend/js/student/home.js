// home.js - Handles functionality for student home page

class HomePage {
    constructor() {
        this.init();
    }

    init() {
        // Add event listeners for section navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(e.target.dataset.section);
            });
        });

        // Project search functionality
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.addEventListener('click', () => this.handleProjectSearch());
        }

        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    async handleProjectSearch() {
        const searchInput = document.getElementById('projectSearch');
        const searchTerm = searchInput.value.trim();
        
        if (!searchTerm) {
            this.showAlert('Please enter a project title to search.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/projects/check-similarity`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: searchTerm })
            });

            if (!response.ok) {
                throw new Error('Failed to check project similarity');
            }

            const data = await response.json();
            this.updateSimilarityResults(data.similarityPercentage);
        } catch (error) {
            console.error('Search failed:', error);
            this.showAlert('Failed to check project similarity. Please try again.');
        }
    }

    updateSimilarityResults(percentage) {
        const resultsDiv = document.getElementById('similarityResults');
        const progressBar = document.getElementById('similarityProgressBar');
        
        if (resultsDiv && progressBar) {
            resultsDiv.style.display = 'block';
            progressBar.style.width = `${percentage}%`;
            progressBar.textContent = `${percentage}%`;
            
            // Update color based on similarity percentage
            if (percentage >= 80) {
                progressBar.classList.remove('bg-success', 'bg-warning');
                progressBar.classList.add('bg-danger');
                this.showAlert('Warning: High similarity detected. Please choose a different title.');
            } else if (percentage >= 50) {
                progressBar.classList.remove('bg-success', 'bg-danger');
                progressBar.classList.add('bg-warning');
            } else {
                progressBar.classList.remove('bg-warning', 'bg-danger');
                progressBar.classList.add('bg-success');
            }
        }
    }

    showAlert(message) {
        const modal = new bootstrap.Modal(document.getElementById('customAlertModal'));
        document.getElementById('customAlertModalBody').textContent = message;
        modal.show();
    }
}

// Initialize home page functionality
const homePage = new HomePage();
