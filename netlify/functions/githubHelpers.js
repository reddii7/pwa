// netlify/functions/githubHelpers.js
const { Octokit } = require("@octokit/rest");

/**
 * Fetches the content of a file from a GitHub repository.
 * @returns {Promise<any>} The parsed JSON content of the file.
 */
async function getFile(octokit, owner, repo, branch, path) {
    try {
        const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return JSON.parse(content);
    } catch (error) {
        if (error.status === 404) {
            console.warn(`File not found at ${path}, returning default empty array.`);
            return [];
        }
        throw error;
    }
}


/**
 * Commits multiple files to a GitHub repository in a single commit.
 * @param {Octokit} octokit - An authenticated Octokit instance.
 * @param {string} owner - The repository owner's username.
 * @param {string} repo - The repository name.
 * @param {string} branch - The branch to commit to.
 *a* @param {string} message - The commit message.
 * @param {Array<{path: string, content: string}>} files - An array of file objects to commit.
 */
async function commitFiles(octokit, owner, repo, branch, message, files) {
    // 1. Get the latest commit SHA of the branch
    const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    const baseSha = refData.object.sha;

    // 2. Create "blobs" for each file content
    const blobPromises = files.map(file =>
        octokit.git.createBlob({ owner, repo, content: file.content, encoding: 'utf-8' })
    );
    const blobs = await Promise.all(blobPromises);

    // 3. Create a tree that points to the new blobs
    const tree = await octokit.git.createTree({
        owner,
        repo,
        base_tree: baseSha,
        tree: files.map((file, i) => ({
            path: file.path,
            mode: '100644', // file mode
            type: 'blob',
            sha: blobs[i].data.sha,
        })),
    });

    // 4. Create the new commit
    const { data: commitData } = await octokit.git.createCommit({
        owner,
        repo,
        message,
        tree: tree.data.sha,
        parents: [baseSha]
    });

    // 5. Update the branch to point to the new commit
    await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: commitData.sha
    });
}

module.exports = { getFile, commitFiles };