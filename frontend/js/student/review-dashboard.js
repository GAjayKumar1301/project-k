// API Configuration
const API_BASE_URL = '/api';

// Global variables
let currentProject = null;
let currentUserInfo = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const userInfo = localStorage.getItem('userInfo');
    const token = localStorage.getItem('token');
    
    if (!userInfo || !token) {
        window.location.href = '/login';
        return;
    }

    currentUserInfo = JSON.parse(userInfo);
    
    // Check if user is a student
    if (currentUserInfo.userType !== 'Student') {
        window.location.href = '/login';
        return;
    }

    // Update student name in navbar
    document.getElementById('studentName').textContent = currentUserInfo.name || 'Student';

    // Initialize dashboard
    initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
});

async function initializeDashboard() {
    try {
        showLoading();
        
        // Load student project information
        await loadStudentProject();
        
        // Load review stages
        await loadReviewStages();
        
        hideLoading();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showAlert('Error loading dashboard. Please refresh the page.', 'danger');
        hideLoading();
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // Title submission modal
    const titleCheckInput = document.getElementById('titleCheckInput');
    const checkSimilarityBtn = document.getElementById('checkSimilarityBtn');
    const submitTitleBtn = document.getElementById('submitTitleBtn');
    const projectTitle = document.getElementById('projectTitle');

    if (titleCheckInput && checkSimilarityBtn) {
        checkSimilarityBtn.addEventListener('click', checkTitleSimilarity);
        
        titleCheckInput.addEventListener('input', function() {
            const title = this.value.trim();
            submitTitleBtn.disabled = title.length < 10;
            document.getElementById('similarityResult').style.display = 'none';
        });

        titleCheckInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkSimilarityBtn.click();
            }
        });
    }

    if (submitTitleBtn) {
        submitTitleBtn.addEventListener('click', submitTitle);
    }

    // Sync title check input with main title input
    if (titleCheckInput && projectTitle) {
        titleCheckInput.addEventListener('input', function() {
            projectTitle.value = this.value;
        });
        
        projectTitle.addEventListener('input', function() {
            titleCheckInput.value = this.value;
            const title = this.value.trim();
            submitTitleBtn.disabled = title.length < 10;
        });
    }

    // Stage submission modal
    const submitStageBtn = document.getElementById('submitStageBtn');
    if (submitStageBtn) {
        submitStageBtn.addEventListener('click', submitReviewStage);
    }
}

async function loadStudentProject() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/projects/student`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            currentProject = data.project;
            updateProgressDisplay(data);
        } else {
            throw new Error(data.message || 'Failed to load project');
        }
    } catch (error) {
        console.error('Load project error:', error);
        throw error;
    }
}

async function loadReviewStages() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/projects/review-stages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            renderReviewStages(data.reviewStages);
            updateNotifications(data.notifications || []);
        } else {
            // If project not found, show initial state
            if (response.status === 404) {
                renderInitialState();
            } else {
                throw new Error(data.message || 'Failed to load review stages');
            }
        }
    } catch (error) {
        console.error('Load review stages error:', error);
        renderInitialState();
    }
}

function updateProgressDisplay(data) {
    const progressPercentage = data.progressPercentage || 0;
    const currentStage = data.project ? data.project.currentStage : 0;
    
    // Update progress bar
    const progressBar = document.getElementById('overallProgress');
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', progressPercentage);
    }
    
    // Update statistics
    const currentStageNumber = document.getElementById('currentStageNumber');
    const progressPercent = document.getElementById('progressPercentage');
    const progressText = document.getElementById('progressText');
    
    if (currentStageNumber) currentStageNumber.textContent = currentStage;
    if (progressPercent) progressPercent.textContent = `${progressPercentage}%`;
    
    if (progressText) {
        const messages = [
            'Get started by submitting your project title',
            'Title submitted! Proceed to Review 1',
            'Review 1 completed! Proceed to Review 2', 
            'Review 2 completed! Proceed to Final Paper',
            'All stages completed! 🎉'
        ];
        progressText.textContent = messages[currentStage] || messages[0];
    }
}

function renderReviewStages(stages) {
    const container = document.getElementById('reviewStagesContainer');
    if (!container) return;

    container.innerHTML = '';

    stages.forEach((stage, index) => {
        const stageCard = createStageCard(stage, index);
        container.appendChild(stageCard);
    });
}

function createStageCard(stage, index) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-3 mb-4';

    // Define stage-specific icons and colors based on the image sequence
    const stageConfigs = {
        0: { icon: 'fas fa-heading', name: 'Review 0', subtitle: 'Title Submission', color: '#007bff' },
        1: { icon: 'fas fa-file-alt', name: 'Review 1', subtitle: 'Initial Proposal', color: '#6c757d' },
        2: { icon: 'fas fa-chart-line', name: 'Review 2', subtitle: 'Progress Report', color: '#6c757d' },
        3: { icon: 'fas fa-file-pdf', name: 'Final Paper', subtitle: 'Complete Submission', color: '#6c757d' }
    };

    const statusIcons = {
        'locked': 'fas fa-lock text-secondary',
        'available': 'fas fa-play-circle text-success',
        'submitted': 'fas fa-clock text-warning',
        'completed': 'fas fa-check-circle text-primary'
    };

    const statusColors = {
        'locked': '#6c757d',
        'available': '#007bff',
        'submitted': '#ffc107',
        'completed': '#28a745'
    };

    const statusTexts = {
        'locked': 'Locked',
        'available': 'Available',
        'submitted': 'Under Review',
        'completed': 'Completed'
    };

    const config = stageConfigs[stage.stageNumber] || stageConfigs[0];
    const cardColor = stage.status === 'available' ? config.color : statusColors[stage.status];
    const dueDate = stage.dueDate ? new Date(stage.dueDate).toLocaleDateString() : 'No due date';
    const submittedDate = stage.submission?.submittedAt ? 
        new Date(stage.submission.submittedAt).toLocaleDateString() : null;

    const isActive = stage.status === 'available';
    const cardClass = isActive ? 'review-stage-card active-stage' : 'review-stage-card';

    col.innerHTML = `
        <div class="card ${cardClass}" onclick="handleStageClick(${stage.stageNumber}, '${stage.status}')" 
             style="border: 2px solid ${cardColor}; ${isActive ? 'box-shadow: 0 4px 15px rgba(0,123,255,0.3);' : ''}">
            <div class="card-body text-center">
                <div class="stage-icon mb-3" style="color: ${cardColor};">
                    <i class="${config.icon}" style="font-size: 3rem;"></i>
                </div>
                <h5 class="card-title" style="color: ${cardColor};">${config.name}</h5>
                <h6 class="card-subtitle mb-3 text-muted">${config.subtitle}</h6>
                
                <div class="status-badge mb-3">
                    <span class="badge" style="background-color: ${cardColor}; color: white;">
                        <i class="${statusIcons[stage.status]} me-1"></i>
                        ${statusTexts[stage.status]}
                    </span>
                </div>
                
                ${stage.submission?.title ? `
                    <div class="mb-2 text-start">
                        <strong>Project Title:</strong>
                        <div class="text-muted small mt-1">${stage.submission.title}</div>
                    </div>
                ` : ''}
                
                <div class="stage-details text-start">
                    <div class="small text-muted mb-1">
                        <i class="fas fa-calendar me-1"></i>
                        Due: ${dueDate}
                    </div>
                    ${submittedDate ? `
                        <div class="small text-success mb-1">
                            <i class="fas fa-check me-1"></i>
                            Submitted: ${submittedDate}
                        </div>
                    ` : ''}
                    
                    ${stage.feedback?.grade ? `
                        <div class="small text-primary">
                            <i class="fas fa-star me-1"></i>
                            Grade: ${stage.feedback.grade}%
                        </div>
                    ` : ''}
                </div>
                
                ${stage.status === 'available' ? `
                    <button class="btn btn-primary mt-3 w-100" style="background-color: ${cardColor}; border-color: ${cardColor};">
                        <i class="fas fa-upload me-1"></i>
                        Submit ${config.name}
                    </button>
                ` : ''}
                
                ${stage.status === 'submitted' ? `
                    <div class="alert alert-warning mt-3 mb-0 small">
                        <i class="fas fa-hourglass-half me-1"></i>
                        Under Review
                    </div>
                ` : ''}
                
                ${stage.status === 'completed' ? `
                    <div class="alert alert-success mt-3 mb-0 small">
                        <i class="fas fa-check-circle me-1"></i>
                        Completed
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    return col;
}

function renderInitialState() {
    const container = document.getElementById('reviewStagesContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="col-12">
            <div class="card text-center">
                <div class="card-body py-5">
                    <i class="fas fa-rocket fa-3x text-primary mb-3"></i>
                    <h4>Welcome to Project Review Portal</h4>
                    <p class="text-muted mb-4">Start your project journey by submitting your project title</p>
                    <button class="btn btn-primary btn-lg" onclick="openTitleSubmissionModal()">
                        <i class="fas fa-plus me-2"></i>
                        Submit Project Title
                    </button>
                </div>
            </div>
        </div>
    `;
}

function handleStageClick(stageNumber, status) {
    if (status === 'available') {
        if (stageNumber === 0) {
            openTitleSubmissionModal();
        } else {
            openStageSubmissionModal(stageNumber);
        }
    } else if (status === 'completed' || status === 'submitted') {
        showStageDetails(stageNumber);
    } else {
        showAlert('This stage is currently locked. Complete the previous stage first.', 'warning');
    }
}

function openTitleSubmissionModal() {
    const modal = new bootstrap.Modal(document.getElementById('titleSubmissionModal'));
    
    // Reset form
    document.getElementById('titleCheckInput').value = '';
    document.getElementById('projectTitle').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('similarityResult').style.display = 'none';
    document.getElementById('submitTitleBtn').disabled = true;
    
    modal.show();
}

function openStageSubmissionModal(stageNumber) {
    const modal = new bootstrap.Modal(document.getElementById('stageSubmissionModal'));
    
    // Set stage information
    document.getElementById('stageNumber').value = stageNumber;
    document.getElementById('stageModalTitle').innerHTML = `
        <i class="fas fa-upload me-2"></i>
        Submit Review ${stageNumber}
    `;
    
    // Reset form
    document.getElementById('stageTitle').value = '';
    document.getElementById('stageDescription').value = '';
    document.getElementById('stageFiles').value = '';
    
    modal.show();
}

async function checkTitleSimilarity() {
    const title = document.getElementById('titleCheckInput').value.trim();
    
    if (title.length < 10) {
        showAlert('Please enter a title with at least 10 characters.', 'warning');
        return;
    }

    const resultDiv = document.getElementById('similarityResult');
    const checkBtn = document.getElementById('checkSimilarityBtn');
    
    checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Checking...';
    checkBtn.disabled = true;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/projects/check-similarity`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title })
        });

        const data = await response.json();

        if (response.ok) {
            displaySimilarityResult(data);
        } else {
            throw new Error(data.message || 'Failed to check similarity');
        }
    } catch (error) {
        console.error('Similarity check error:', error);
        showAlert('Error checking similarity. Please try again.', 'danger');
    } finally {
        checkBtn.innerHTML = '<i class="fas fa-check-circle me-1"></i>Check';
        checkBtn.disabled = false;
    }
}

function displaySimilarityResult(data) {
    const resultDiv = document.getElementById('similarityResult');
    const submitBtn = document.getElementById('submitTitleBtn');
    
    let alertClass = 'alert-success';
    let icon = 'fas fa-check-circle';
    
    if (!data.isUnique) {
        alertClass = 'alert-danger';
        icon = 'fas fa-exclamation-triangle';
        submitBtn.disabled = true;
    } else {
        submitBtn.disabled = false;
    }
    
    let similarProjectsHtml = '';
    if (data.similarProjects && data.similarProjects.length > 0) {
        similarProjectsHtml = `
            <div class="mt-3">
                <h6>Similar Projects Found:</h6>
                <ul class="list-unstyled">
                    ${data.similarProjects.slice(0, 3).map(project => `
                        <li class="small">
                            <strong>${project.percentage}%</strong> - ${project.title}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    resultDiv.innerHTML = `
        <div class="alert ${alertClass} mb-0">
            <i class="${icon} me-2"></i>
            <strong>Similarity: ${data.similarity}%</strong>
            <div class="mt-1">${data.message}</div>
            ${similarProjectsHtml}
        </div>
    `;
    
    resultDiv.style.display = 'block';
}

async function submitTitle() {
    const title = document.getElementById('projectTitle').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    
    if (title.length < 10) {
        showAlert('Please enter a title with at least 10 characters.', 'warning');
        return;
    }

    const submitBtn = document.getElementById('submitTitleBtn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Submitting...';
    submitBtn.disabled = true;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/projects/submit-title`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Project title submitted successfully! Review 1 is now available.', 'success');
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('titleSubmissionModal')).hide();
            
            // Refresh dashboard
            await initializeDashboard();
        } else {
            throw new Error(data.message || 'Failed to submit title');
        }
    } catch (error) {
        console.error('Submit title error:', error);
        showAlert(error.message, 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function submitReviewStage() {
    const stageNumber = parseInt(document.getElementById('stageNumber').value);
    const title = document.getElementById('stageTitle').value.trim();
    const description = document.getElementById('stageDescription').value.trim();
    
    if (!description) {
        showAlert('Please provide a description for this stage.', 'warning');
        return;
    }

    const submitBtn = document.getElementById('submitStageBtn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Submitting...';
    submitBtn.disabled = true;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/projects/submit-stage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                stageNumber, 
                title, 
                description,
                files: [] // File upload to be implemented
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(`Review ${stageNumber} submitted successfully!`, 'success');
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('stageSubmissionModal')).hide();
            
            // Refresh dashboard
            await initializeDashboard();
        } else {
            throw new Error(data.message || 'Failed to submit review stage');
        }
    } catch (error) {
        console.error('Submit stage error:', error);
        showAlert(error.message, 'danger');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function showStageDetails(stageNumber) {
    const stage = currentProject?.reviewStages?.find(s => s.stageNumber === stageNumber);
    if (!stage) return;
    
    let content = `
        <h6>${stage.stageName}</h6>
        <p><strong>Status:</strong> ${stage.status}</p>
    `;
    
    if (stage.submission) {
        content += `
            <p><strong>Submitted:</strong> ${new Date(stage.submission.submittedAt).toLocaleString()}</p>
            ${stage.submission.title ? `<p><strong>Title:</strong> ${stage.submission.title}</p>` : ''}
            ${stage.submission.description ? `<p><strong>Description:</strong> ${stage.submission.description}</p>` : ''}
        `;
    }
    
    if (stage.feedback) {
        content += `
            <hr>
            <h6>Feedback</h6>
            <p><strong>Grade:</strong> ${stage.feedback.grade}%</p>
            <p><strong>Comment:</strong> ${stage.feedback.comment || 'No comment provided'}</p>
            <p><strong>Reviewed:</strong> ${new Date(stage.feedback.reviewedAt).toLocaleString()}</p>
        `;
    }
    
    document.getElementById('alertModalTitle').textContent = 'Stage Details';
    document.getElementById('alertModalBody').innerHTML = content;
    
    const modal = new bootstrap.Modal(document.getElementById('alertModal'));
    modal.show();
}

function updateNotifications(notifications) {
    const badge = document.getElementById('notificationBadge');
    if (badge && notifications.length > 0) {
        badge.textContent = notifications.length;
        badge.style.display = 'flex';
    } else if (badge) {
        badge.style.display = 'none';
    }
}

function showSection(sectionName) {
    // Hide all sections
    document.getElementById('review-section').style.display = 'none';
    document.getElementById('search-section').style.display = 'none';
    
    // Show selected section
    if (sectionName === 'search') {
        document.getElementById('search-section').style.display = 'block';
    } else {
        document.getElementById('review-section').style.display = 'block';
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');
}

function showAlert(message, type = 'info') {
    const alertIcons = {
        'success': 'fas fa-check-circle',
        'warning': 'fas fa-exclamation-triangle',
        'danger': 'fas fa-times-circle',
        'info': 'fas fa-info-circle'
    };

    const icon = alertIcons[type] || alertIcons['info'];
    
    document.getElementById('alertModalTitle').textContent = 'Notification';
    document.getElementById('alertModalBody').innerHTML = `
        <div class="alert alert-${type} border-0" role="alert">
            <i class="${icon} me-2"></i>
            ${message}
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('alertModal'));
    modal.show();
}

function showLoading() {
    // You can implement a loading overlay here
    console.log('Loading...');
}

function hideLoading() {
    // You can implement hiding loading overlay here
    console.log('Loading complete');
}

function logout() {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    window.location.href = '/login';
}

// Navbar function handlers
function showAboutSection(event) {
    if (event) event.preventDefault();
    showAlert(`
        <div class="alert alert-info">
            <h5>About Project Management System</h5>
            <p>This system helps students manage their project titles and review process efficiently.</p>
            <p><strong>Features:</strong></p>
            <ul>
                <li>Project title similarity checking</li>
                <li>Sequential review system</li>
                <li>Real-time search and suggestions</li>
                <li>Progress tracking and analytics</li>
            </ul>
            <p><strong>Version:</strong> 2.0.0</p>
        </div>
    `);
}

function showProfileSection(event) {
    if (event) event.preventDefault();
    const userData = JSON.parse(localStorage.getItem('userInfo'));
    if (!userData) return;
    
    showAlert(`
        <div class="alert alert-info">
            <h5>Student Profile</h5>
            <p><strong>Name:</strong> ${userData.name}</p>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Department:</strong> ${userData.department}</p>
            <p><strong>Student ID:</strong> ${userData.studentId || 'N/A'}</p>
            <p><strong>Academic Year:</strong> ${userData.academicYear || 'N/A'}</p>
            <p><strong>User Type:</strong> ${userData.userType}</p>
        </div>
    `);
}

function showNotificationsSection(event) {
    if (event) event.preventDefault();
    showAlert(`
        <div class="alert alert-info">
            <h5><i class="fas fa-bell me-2"></i>Notifications</h5>
            <p>You have no new notifications at this time.</p>
            <p><em>Check back later for updates on your project reviews.</em></p>
        </div>
    `);
}

// Make functions available globally
window.handleStageClick = handleStageClick;
window.openTitleSubmissionModal = openTitleSubmissionModal;
window.logout = logout;
window.showAboutSection = showAboutSection;
window.showProfileSection = showProfileSection;
window.showNotificationsSection = showNotificationsSection;
