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
    if (!data || !data.rsCupData) {
        return `<div class="content-area"><p class="feedback-message">Could not load RS Cup data.</p></div>`;
    }

    const cupData = data.rsCupData;

    const playedMatchesHTML = cupData.playedMatches.map(match => `
        <tr>
            <td class="cup-player winner">${match.winner}</td>
            <td class="cup-match-text">beat</td>
            <td class="cup-player loser">${match.loser}</td>
        </tr>
    `).join('');

    let toBePlayedSectionHTML = '';
    if (cupData.toBePlayedMatches && cupData.toBePlayedMatches.length > 0) {
        const toBePlayedMatchesHTML = cupData.toBePlayedMatches.map(match => `
            <tr>
                <td class="cup-player">${match.player1}</td>
                <td class="cup-match-text">tba</td>
                <td class="cup-player">${match.player2}</td>
            </tr>
        `).join('');

        toBePlayedSectionHTML = `
            <table class="data-display-table cup-table">
                <tbody>${toBePlayedMatchesHTML}</tbody>
            </table>
        `;
    }

    return `
        <div class="content-area">
            <h1 class="main-heading">RS Cup</h1>
            <h2 class="sub-heading">${cupData.playedRoundName}</h2>
            <table class="data-display-table cup-table">
                <tbody>${playedMatchesHTML}</tbody>
            </table>
            ${toBePlayedSectionHTML}
        </div>
    `;
}