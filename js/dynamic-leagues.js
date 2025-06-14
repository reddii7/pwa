document.addEventListener('DOMContentLoaded', () => {
  const leaguesDataPath = '../data/leagues.json';

  async function fetchLeaguesData() {
    try {
      const response = await fetch(leaguesDataPath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Could not fetch leagues data:", error);
      return null;
    }
  }

  function populateLeagueTable(leagueKey, players) {
    const tableBody = document.getElementById(`${leagueKey}TableBody`);
    if (!tableBody) {
      console.warn(`Table body not found for ${leagueKey}`);
      return;
    }
    tableBody.innerHTML = ''; // Clear existing rows
    players.forEach(player => {
      const row = `<tr>
                      <td class="text-center">${player.pos}</td>
                      <td>${player.name}</td>
                      <td class="text-center">${player.score}</td>
                   </tr>`;
      tableBody.insertAdjacentHTML('beforeend', row);
    });
  }

  fetchLeaguesData().then(data => {
    if (data) {
      Object.keys(data).forEach(leagueKey => {
        populateLeagueTable(leagueKey, data[leagueKey].players);
      });
    }
  });
});