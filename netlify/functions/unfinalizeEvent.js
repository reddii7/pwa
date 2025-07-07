// netlify/functions/unfinalizeEvent.js
const { Octokit } = require("@octokit/rest");
const { getFile, commitFiles } = require('./githubHelpers');

exports.handler = async (event, context) => {
    // --- Auth & Body Parsing ---
    if (event.headers.authorization !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
    }
    const { eventId } = JSON.parse(event.body);
    if (!eventId) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Event ID is required.' }) };
    }

    // --- GitHub Setup ---
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH;

    try {
        // 1. Fetch all current data
        const [players, events, ledger] = await Promise.all([
            getFile(octokit, owner, repo, branch, 'data/players.json'),
            getFile(octokit, owner, repo, branch, 'data/events.json'),
            getFile(octokit, owner, repo, branch, 'data/ledger.json')
        ]);
        
        const eventToRevert = events.find(e => e.eventId === eventId);
        if (!eventToRevert) {
             return { statusCode: 404, body: JSON.stringify({ message: 'Event not found.' }) };
        }

        // 2. Revert Handicap Changes
        players.forEach(player => {
            // Remove the last entry if it matches the eventId
            const lastEntry = player.handicapHistory[player.handicapHistory.length - 1];
            if (lastEntry && lastEntry.eventId === eventId) {
                player.handicapHistory.pop();
            }
        });

        // 3. Revert Financial Ledger
        const updatedLedger = ledger.filter(txn => txn.eventId !== eventId);

        // 4. Revert Event Status
        eventToRevert.isFinalized = false;
        // Keep the scores so the admin can edit them, don't clear them
        // eventToRevert.scores = []; 

        // 5. Commit all changed files
        const filesToCommit = [
            { path: 'data/players.json', content: JSON.stringify(players, null, 2) },
            { path: 'data/events.json', content: JSON.stringify(events, null, 2) },
            { path: 'data/ledger.json', content: JSON.stringify(updatedLedger, null, 2) }
        ];

        await commitFiles(octokit, owner, repo, branch, `chore: Revert event - ${eventToRevert.courseName}`, filesToCommit);

        return { statusCode: 200, body: JSON.stringify({ message: "Event reverted successfully." }) };

    } catch (error) {
        console.error("Error reverting event:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "Failed to revert event.", error: error.message }) };
    }
};