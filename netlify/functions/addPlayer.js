// netlify/functions/addPlayer.js
const { Octokit } = require("@octokit/rest");
const { getFile, commitFiles } = require('./githubHelpers'); // We will create this helper file next

exports.handler = async (event, context) => {
    // --- Authorization ---
    const { authorization } = event.headers;
    if (authorization !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
    }

    const { name, email, phone, leagueId, handicap } = JSON.parse(event.body);

    if (!name || !leagueId || handicap === undefined) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Missing required player fields.' }) };
    }
    
    // --- GitHub Setup ---
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH;
    
    try {
        // Get the current list of players
        const players = await getFile(octokit, owner, repo, branch, 'data/players.json');
        
        // Create the new player object
        const newPlayer = {
            id: `p_${Date.now()}`, // Simple unique ID
            name,
            email,
            phone,
            leagueId,
            handicapHistory: [
                {
                    date: new Date().toISOString().split('T')[0],
                    handicap: parseFloat(handicap),
                    eventId: null,
                    reason: "Initial Handicap"
                }
            ]
        };

        players.push(newPlayer);
        
        // --- Commit back to GitHub ---
        const filesToCommit = [{
            path: 'data/players.json',
            content: JSON.stringify(players, null, 2)
        }];

        await commitFiles(octokit, owner, repo, branch, `feat: Add new player - ${name}`, filesToCommit);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Player added successfully!', player: newPlayer })
        };
    } catch (error) {
        console.error("Error adding player:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "Failed to add player.", error: error.message }) };
    }
};