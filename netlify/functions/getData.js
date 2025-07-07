// netlify/functions/getData.js
const { Octokit } = require("@octokit/rest");

// Helper function to fetch file content from GitHub
async function getFile(octokit, owner, repo, branch, path) {
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path,
            ref: branch,
        });
        // Content is base64 encoded, so we need to decode it
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return JSON.parse(content);
    } catch (error) {
        // If file doesn't exist, return a default value
        if (error.status === 404) {
            console.warn(`File not found at path: ${path}. Returning default.`);
            if (path.endsWith('.json') && path.includes('schedule')) return {};
            return []; // Default for arrays like players, events, ledger
        }
        console.error(`Error fetching file ${path}:`, error);
        throw error;
    }
}

exports.handler = async (event, context) => {
    const { GITHUB_TOKEN, GITHUB_USERNAME, GITHUB_REPO, GITHUB_BRANCH } = process.env;

    if (!GITHUB_TOKEN || !GITHUB_USERNAME || !GITHUB_REPO || !GITHUB_BRANCH) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Server configuration error: Missing GitHub environment variables." }),
        };
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    const owner = GITHUB_USERNAME;
    const repo = GITHUB_REPO;
    const branch = GITHUB_BRANCH;

    try {
        const [players, events, ledger] = await Promise.all([
            getFile(octokit, owner, repo, branch, 'data/players.json'),
            getFile(octokit, owner, repo, branch, 'data/events.json'),
            getFile(octokit, owner, repo, branch, 'data/ledger.json')
        ]);

        return {
            statusCode: 200,
            body: JSON.stringify({ players, events, ledger }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to fetch data from GitHub.", error: error.message }),
        };
    }
};