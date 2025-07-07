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

export async function render() {
    const data = await fetchData();
    if (!data || !data.handicapsData) {
        return `<div class="content-area"><p class="feedback-message">Could not load handicap data.</p></div>`;
    }

    const sortedPlayers = data.handicapsData.sort((a, b) => a.name.localeCompare(b.name));

    const tableRows = sortedPlayers.map(player => `
        <tr>
            <td>${player.name}</td>
            <td>${player.currentHandicap}</td>
        </tr>
    `).join('');

    return `
        <div class="content-area">
            <h1 class="main-heading">Player Handicaps</h1>
            <table class="data-display-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Handicap</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}