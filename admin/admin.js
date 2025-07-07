// admin/admin.js

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // DOM Elements
    // =================================================================
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginButton = document.getElementById('login-button');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');

    // =================================================================
    // Global State
    // =================================================================
    let adminPassword = '';
    let allData = { players: [], events: [], ledger: [] };

    // =================================================================
    // Utility Functions
    // =================================================================
    const showLoader = (message = 'Loading...') => {
        loadingMessage.textContent = message;
        loadingOverlay.classList.remove('hidden');
    };
    const hideLoader = () => loadingOverlay.classList.add('hidden');

    // =================================================================
    // Authentication Logic (Corrected)
    // =================================================================
    loginButton.addEventListener('click', async () => {
        const pass = passwordInput.value;
        if (!pass) {
            loginError.textContent = 'Password cannot be empty.';
            return;
        }

        loginError.textContent = ''; // Clear previous errors
        showLoader('Authenticating...');

        try {
            // Call our new checkAuth function
            const response = await fetch('/api/checkAuth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: pass }),
            });

            // If the response is not "OK" (e.g., status 401), it's a failure
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Authentication failed');
            }

            // --- SUCCESS! ---
            // Only if the password was correct, we proceed
            adminPassword = pass; // Store the correct password for future use
            loginContainer.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            hideLoader(); // Hide loader before initializing panel
            await initializeAdminPanel(); // Now load the data

        } catch (error) {
            // --- FAILURE ---
            hideLoader();
            loginError.textContent = error.message;
            console.error('Login error:', error);
        }
    });

    logoutButton.addEventListener('click', () => {
        adminPassword = '';
        passwordInput.value = '';
        adminPanel.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        loginError.textContent = '';
    });
    
    // =================================================================
    // Main Panel Initialization
    // =================================================================
    async function initializeAdminPanel() {
        showLoader('Fetching all society data...');
        try {
            const response = await fetch('/api/getData');
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to fetch data.');
            }
            allData = await response.json();
            renderAllTabs();
        } catch (error) {
            alert(`Error initializing panel: ${error.message}`);
            console.error(error);
        } finally {
            hideLoader();
        }
    }

    // =================================================================
    // Render Functions (To draw the UI)
    // =================================================================
    function renderAllTabs() {
        renderEventsTab();
        renderPlayersTab();
        // renderKnockoutTab(); // Future implementation
    }
    
    function renderEventsTab() {
        const eventSelect = document.getElementById('event-select');
        const finalizedList = document.getElementById('finalized-events-list');
        eventSelect.innerHTML = '';
        finalizedList.innerHTML = '';

        const openEvents = allData.events.filter(e => !e.isFinalized);
        const finalizedEvents = allData.events.filter(e => e.isFinalized);

        if (openEvents.length === 0) {
            eventSelect.innerHTML = '<option value="">No open events</option>';
        } else {
            openEvents.forEach(event => {
                const option = document.createElement('option');
                option.value = event.eventId;
                option.textContent = `${event.courseName} - ${event.date}`;
                eventSelect.appendChild(option);
            });
        }
        
        finalizedEvents.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(event => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${event.courseName} - ${event.date}</span>
                <button class="unfinalize-btn" data-event-id="${event.eventId}">Edit / Un-finalize</button>
            `;
            finalizedList.appendChild(li);
        });
        
        renderScoreEntryForSelectedEvent();
    }
    
    function renderScoreEntryForSelectedEvent() {
        const scoreBody = document.getElementById('score-entry-body');
        const eventId = document.getElementById('event-select').value;
        scoreBody.innerHTML = '';
        
        if (!eventId) {
            document.getElementById('finalize-event-btn').disabled = true;
            return;
        }
        
        document.getElementById('finalize-event-btn').disabled = false;
        
        const event = allData.events.find(e => e.eventId === eventId);
        const eventScores = event ? event.scores || [] : [];
        
        allData.players.sort((a, b) => a.name.localeCompare(b.name)).forEach(player => {
            const scoreData = eventScores.find(s => s.playerId === player.id) || {};
            const tr = document.createElement('tr');
            tr.dataset.playerId = player.id;
            tr.innerHTML = `
                <td>${player.name}</td>
                <td><input type="checkbox" class="played-checkbox" ${scoreData.stablefordScore !== undefined ? 'checked' : ''}></td>
                <td><input type="number" class="stableford-score" value="${scoreData.stablefordScore || ''}" ${scoreData.stablefordScore === undefined ? 'disabled' : ''}></td>
                <td><input type="number" class="snakes" value="${scoreData.snakes || 0}" ${scoreData.stablefordScore === undefined ? 'disabled' : ''}></td>
                <td><input type="number" class="camels" value="${scoreData.camels || 0}" ${scoreData.stablefordScore === undefined ? 'disabled' : ''}></td>
            `;
            scoreBody.appendChild(tr);
        });
    }

    function renderPlayersTab() {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        allData.players.sort((a,b) => a.name.localeCompare(b.name)).forEach(player => {
            const currentHcp = player.handicapHistory.length > 0 ? player.handicapHistory[player.handicapHistory.length - 1].handicap : 'N/A';
            const card = document.createElement('div');
            card.className = 'player-card';
            card.innerHTML = `
                <h4>${player.name}</h4>
                <p><strong>Handicap:</strong> ${currentHcp}</p>
                <p><strong>League:</strong> ${player.leagueId}</p>
                <p><strong>Email:</strong> ${player.email || 'N/A'}</p>
                <p><strong>Phone:</strong> ${player.phone || 'N/A'}</p>
            `;
            playersList.appendChild(card);
        });
    }
    
    // =================================================================
    // Event Listeners (User Interactions)
    // =================================================================

    // Tab switching
    document.querySelector('.tabs').addEventListener('click', e => {
        if (e.target.matches('.tab-button')) {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(`${e.target.dataset.tab}-tab`).classList.add('active');
        }
    });
    
    // Create New Event
    document.getElementById('create-event-btn').addEventListener('click', () => {
        const courseName = prompt('Enter the course name:');
        if (!courseName) return;
        const date = prompt('Enter the event date (YYYY-MM-DD):');
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            alert('Invalid date format. Please use YYYY-MM-DD.');
            return;
        }

        const newEvent = {
            eventId: `evt_${Date.now()}`,
            date,
            courseName,
            isFinalized: false,
            scores: []
        };
        allData.events.push(newEvent);
        renderEventsTab();
        document.getElementById('event-select').value = newEvent.eventId;
        renderScoreEntryForSelectedEvent();
    });
    
    // Change selected event
    document.getElementById('event-select').addEventListener('change', renderScoreEntryForSelectedEvent);
    
    // Toggle score inputs based on 'played' checkbox
    document.getElementById('score-entry-body').addEventListener('change', e => {
        if (e.target.classList.contains('played-checkbox')) {
            const row = e.target.closest('tr');
            const inputs = row.querySelectorAll('input[type="number"]');
            inputs.forEach(input => input.disabled = !e.target.checked);
        }
    });

    // Add New Player
    document.getElementById('add-player-form').addEventListener('submit', async e => {
        e.preventDefault();
        const newPlayer = {
            name: document.getElementById('new-player-name').value,
            email: document.getElementById('new-player-email').value,
            phone: document.getElementById('new-player-phone').value,
            leagueId: document.getElementById('new-player-league').value,
            handicap: parseFloat(document.getElementById('new-player-handicap').value)
        };
        
        showLoader('Adding new player...');
        try {
            const response = await fetch('/api/addPlayer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': adminPassword },
                body: JSON.stringify(newPlayer)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to add player');
            }
            e.target.reset();
            await initializeAdminPanel(); // Re-fetch all data and re-render everything
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            hideLoader();
        }
    });

    // Finalize Event
    document.getElementById('finalize-event-btn').addEventListener('click', async () => {
        const eventId = document.getElementById('event-select').value;
        if (!eventId) {
            alert('Please select an event to finalize.');
            return;
        }

        const scores = [];
        let validationError = false;
        document.querySelectorAll('#score-entry-body tr').forEach(row => {
            if (row.querySelector('.played-checkbox').checked) {
                const stablefordInput = row.querySelector('.stableford-score').value;
                const playerName = row.querySelector('td').textContent;
                
                if (stablefordInput === '' || isNaN(parseInt(stablefordInput, 10))) {
                    alert(`Invalid or empty score for player ${playerName}. Please enter a number.`);
                    validationError = true;
                    return;
                }

                const score = {
                    playerId: row.dataset.playerId,
                    stablefordScore: parseInt(stablefordInput, 10),
                    snakes: parseInt(row.querySelector('.snakes').value, 10) || 0,
                    camels: parseInt(row.querySelector('.camels').value, 10) || 0
                };
                scores.push(score);
            }
        });

        if (validationError) return; // Stop if there was an error
        if (scores.length === 0) {
            alert('No scores entered. Cannot finalize.');
            return;
        }

        showLoader('Finalizing event... This may take a moment.');
        try {
            const response = await fetch('/api/finalizeEvent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': adminPassword },
                body: JSON.stringify({ eventId, scores, allEvents: allData.events })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to finalize event.');
            }
            alert('Event finalized successfully! The site will now redeploy.');
            await initializeAdminPanel();
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            hideLoader();
        }
    });

    // Un-finalize Event
    document.getElementById('finalized-events-list').addEventListener('click', async e => {
        if (e.target.classList.contains('unfinalize-btn')) {
            const eventId = e.target.dataset.eventId;
            if (!confirm('Are you sure you want to un-finalize this event? This will revert all handicap and financial changes for this round.')) {
                return;
            }
            
            showLoader('Reverting event... This may take a moment.');
            try {
                 const response = await fetch('/api/unfinalizeEvent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': adminPassword },
                    body: JSON.stringify({ eventId })
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'Failed to un-finalize event.');
                }
                alert('Event reverted successfully! The site will now redeploy.');
                await initializeAdminPanel();
            } catch (error) {
                 alert(`Error: ${error.message}`);
            } finally {
                hideLoader();
            }
        }
    });
});