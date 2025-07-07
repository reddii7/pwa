// netlify/functions/finalizeEvent.js
const { Octokit } = require("@octokit/rest");
const { getFile, commitFiles } = require('./githubHelpers');

// --- Handicap Logic ---
// This function calculates the handicap adjustment based on the society's rules.
function calculateHandicapAdjustment(currentHandicap, stablefordScore) {
    let category;
    // Determine handicap category
    if (currentHandicap <= 3.0) category = { buffer: 19, cutFactor: 0.1 };
    else if (currentHandicap <= 7.0) category = { buffer: 18, cutFactor: 0.2 };
    else if (currentHandicap <= 10.0) category = { buffer: 17, cutFactor: 0.3 };
    else category = { buffer: 16, cutFactor: 0.4 };

    const targetScore = 20;

    // Rule 1: Handicap Reduction (Cut) if score is over 20
    if (stablefordScore > targetScore) {
        const pointsOver = stablefordScore - targetScore;
        const adjustment = -(pointsOver * category.cutFactor);
        return adjustment;
    }

    // Rule 2: Handicap Increase if score is below the buffer zone
    if (stablefordScore < category.buffer) {
        return 0.1;
    }

    // Rule 3: No Change if in the buffer zone
    return 0;
}

exports.handler = async (event, context) => {
    // --- Authorization Check ---
    if (event.headers.authorization !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
    }

    // --- Body Parsing and Validation ---
    // We now receive allEvents from the frontend to handle newly created, unsaved events.
    const { eventId, scores, allEvents } = JSON.parse(event.body); 
    if (!eventId || !scores || scores.length === 0 || !allEvents) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Event ID, scores, and allEvents array are required.' }) };
    }

    // --- GitHub Setup ---
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH;

    try {
        // =================================================================
        // THE FIX IS HERE: We now get players and ledger, but use the events array from the frontend.
        // =================================================================

        // 1. Fetch ONLY the data we haven't received from the frontend
        const [players, ledger] = await Promise.all([
            getFile(octokit, owner, repo, branch, 'data/players.json'),
            getFile(octokit, owner, repo, branch, 'data/ledger.json')
        ]);
        
        // Use the events array from the frontend, which includes the new unsaved event
        const events = allEvents; 

        const eventToFinalize = events.find(e => e.eventId === eventId);
        if (!eventToFinalize) {
             return { statusCode: 404, body: JSON.stringify({ message: 'Event not found in the provided list.' }) };
        }
        if (eventToFinalize.isFinalized) {
            return { statusCode: 400, body: JSON.stringify({ message: 'This event has already been finalized.' }) };
        }
        // =================================================================
        // End of the fix. The rest of the logic proceeds as before.
        // =================================================================

        // 2. Process Finances
        const today = new Date().toISOString().split('T')[0];
        scores.forEach(score => {
            // Add entry fee transaction for each player
            ledger.push({ id: `txn_${Date.now()}_${score.playerId}_entry`, date: today, eventId, playerId: score.playerId, type: 'entry_fee', amount: -5.00, description: `Entry for ${eventToFinalize.courseName}` });
            
            // Add fines for snakes and camels
            if (score.snakes > 0) {
                ledger.push({ id: `txn_${Date.now()}_${score.playerId}_snake`, date: today, eventId, playerId: score.playerId, type: 'fine', amount: -1.00 * score.snakes, description: `${score.snakes} snake(s)` });
            }
            if (score.camels > 0) {
                ledger.push({ id: `txn_${Date.now()}_${score.playerId}_camel`, date: today, eventId, playerId: score.playerId, type: 'fine', amount: -1.00 * score.camels, description: `${score.camels} camel(s)` });
            }
        });
        
        // 3. Find Winner(s) and handle prize money
        const highestScore = Math.max(...scores.map(s => s.stablefordScore));
        const winners = scores.filter(s => s.stablefordScore === highestScore);
        const prizeMoney = scores.length * 1.50;

        if (winners.length === 1) { // A single, clear winner
            ledger.push({ id: `txn_${Date.now()}_${winners[0].playerId}_payout`, date: today, eventId, playerId: winners[0].playerId, type: 'payout', amount: prizeMoney, description: `Prize money for ${eventToFinalize.courseName}` });
            eventToFinalize.rolloverAmount = 0;
        } else { // A tie, so the prize money rolls over
            eventToFinalize.rolloverAmount = prizeMoney;
        }

        // 4. Adjust Handicaps for all players who played
        scores.forEach(score => {
            const player = players.find(p => p.id === score.playerId);
            if (player) {
                const currentHcp = player.handicapHistory[player.handicapHistory.length - 1].handicap;
                const adjustment = calculateHandicapAdjustment(currentHcp, score.stablefordScore);
                const newHcp = Math.round((currentHcp + adjustment) * 10) / 10;
                
                player.handicapHistory.push({
                    date: today,
                    handicap: newHcp,
                    eventId: eventId,
                    reason: `Adjustment after scoring ${score.stablefordScore} pts`
                });
            }
        });

        // 5. Update the event's status and save the scores to it
        eventToFinalize.isFinalized = true;
        eventToFinalize.scores = scores;

        // 6. Commit all three updated data files back to GitHub
        const filesToCommit = [
            { path: 'data/players.json', content: JSON.stringify(players, null, 2) },
            { path: 'data/events.json', content: JSON.stringify(events, null, 2) },
            { path: 'data/ledger.json', content: JSON.stringify(ledger, null, 2) }
        ];

        await commitFiles(octokit, owner, repo, branch, `chore: Finalize event - ${eventToFinalize.courseName}`, filesToCommit);

        return { statusCode: 200, body: JSON.stringify({ message: "Event finalized successfully." }) };

    } catch (error) {
        console.error("Error finalizing event:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "Failed to finalize event.", error: error.message }) };
    }
};