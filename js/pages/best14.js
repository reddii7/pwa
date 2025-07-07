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
    if (!data || !data.best14Data) {
        return `<div class="content-area"><p class="feedback-message">Could not load Best 14 data.</p></div>`;
    }

    const tableRows = data.best14Data.map(player => `
        <tr>
            <td>${player.pos}</td>
            <td>${player.name}</td>
            <td>${player.best14}</td>
        </tr>
    `).join('');

    return `
        <div class="content-area">
            <h1 class="main-heading">Best 14 Rounds</h1>
            <table class="data-display-table">
                <thead>
                    <tr>
                        <th>Pos</th><th>Name</th><th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
}