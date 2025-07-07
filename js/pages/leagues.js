async function fetchData() {
    try {
        const response = await fetch('/data.json');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

function createLeagueTable(league) {
    const tableRows = league.players.map(player => `
        <tr>
            <td>${player.pos}</td>
            <td>${player.name}</td>
            <td>${player.score}</td>
        </tr>
    `).join('');

    return `
        <h2 class="sub-heading">${league.name}</h2>
        <table class="data-display-table">
            <thead>
                <tr><th>Pos</th><th>Name</th><th>Score</th></tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}

export async function render() {
    const data = await fetchData();
    if (!data || !data.leaguesData) {
        return `<div class="content-area"><p class="feedback-message">Could not load league data.</p></div>`;
    }

    const leaguesHTML = Object.values(data.leaguesData).map(createLeagueTable).join('');

    return `
        <div class="content-area">
            <h1 class="main-heading">League Standings</h1>
            ${leaguesHTML}
        </div>
    `;
}