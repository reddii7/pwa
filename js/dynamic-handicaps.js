document.addEventListener('DOMContentLoaded', () => {
  const handicapsTableBody = document.getElementById('handicapsTableBody');

  if (!handicapsTableBody) {
    console.error('Handicaps table body container not found in handicaps.html.');
    return;
  }

  fetch('../data/handicaps.json') // Assuming handicaps.json is in the data directory
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} when fetching ../data/handicaps.json`);
      }
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.error('Error: Data fetched from handicaps.json is not an array.', data);
        handicapsTableBody.innerHTML = '<tr><td colspan="2" class="text-danger text-center">Could not load handicaps: Invalid data format.</td></tr>';
        return;
      }
      if (data.length === 0) {
        console.warn('Warning: handicaps.json is empty. No handicaps to display.');
        handicapsTableBody.innerHTML = '<tr><td colspan="2" class="text-center">No handicaps available at the moment.</td></tr>';
        return;
      }

      let tableRowsHTML = '';
      data.forEach(player => {
        tableRowsHTML += `
          <tr>
            <td>${player.name || 'N/A'}</td>
            <td class="text-center">${player.currentHandicap || ''}</td>
          </tr>
        `;
      });
      handicapsTableBody.innerHTML = tableRowsHTML;
    })
    .catch(error => {
      console.error('Error loading or processing handicap data:', error);
      handicapsTableBody.innerHTML = `<tr><td colspan="2" class="text-danger text-center">Could not load handicaps. ${error.message}</td></tr>`;
    });
});
