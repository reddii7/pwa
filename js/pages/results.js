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

export async function render(params) {
    const weekId = params.get('weekId');
    if (!weekId) {
        return `<div class="content-area"><p class="feedback-message">No week selected. Please go back to the results page.</p></div>`;
    }

    const data = await fetchData();
    if (!data || !data.weeklyScoresData) {
        return `<div class="content-area"><p class="feedback-message">Could not load score data.</p></div>`;
    }

    const weekData = data.weeklyScoresData.find(w => w.weekId === weekId);

    if (!weekData) {
        return `<div class="content-area"><p class="feedback-message">Scores for ${weekId} not found.</p></div>`;
    }

    const tableRows = weekData.fullScores.map(player => `
        <tr>
            <td>${player.pos}</td>
            <td>${player.name}</td>
            <td>${player.points}</td>
        </tr>
    `).join('');

    return `
        <div class="content-area">
            <h1 class="main-heading">${weekData.modalTitle || weekData.cardTitle}</h1>
            <table class="data-display-table">
                <thead>
                    <tr><th>Pos</th><th>Name</th><th>Points</th></tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}