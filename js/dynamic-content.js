document.addEventListener('DOMContentLoaded', () => {
  const weeklySummaryCardsContainer = document.getElementById('weeklySummaryCardsContainer');
  const modalsContainer = document.getElementById('modalsContainer');

  if (!weeklySummaryCardsContainer || !modalsContainer) {
    console.error('Required container elements (weeklySummaryCardsContainer or modalsContainer) not found in index.html.');
    if (weeklySummaryCardsContainer) {
      weeklySummaryCardsContainer.innerHTML = '<p class="text-danger">Error: Page setup issue. Card container missing.</p>';
    }
    return;
  }

  fetch('../data/data.json') // Corrected path relative to this script
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status} when fetching ../data/data.json`); // Error message consistent with path
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.error('Error: Data fetched from data/data.json is not an array.', data);
        weeklySummaryCardsContainer.innerHTML = '<p class="text-danger">Could not load weekly summaries: Invalid data format.</p>';
        return;
      }
      if (data.length === 0) {
        weeklySummaryCardsContainer.innerHTML = '<p>No weekly summaries available at the moment.</p>';
        return;
      }

      data.forEach(weekData => {
        try {
          weeklySummaryCardsContainer.insertAdjacentHTML('beforeend', createCardHTML(weekData));
          modalsContainer.insertAdjacentHTML('beforeend', createModalHTML(weekData));
        } catch (e) {
          console.error('Error creating HTML for weekData:', weekData, e);
        }
      });

      // After all cards are rendered:
      gsap.registerPlugin(ScrollTrigger);
      const cards = document.querySelectorAll('.weekly-summary-cards .col .card');
      cards.forEach(card => {
        gsap.to(card, {
          opacity: 0,
          scale: 0.85, // Shrink to 85% as it fades out
          duration: 0.3,
          ease: "power1.out",
          scrollTrigger: {
            trigger: card,
            start: "top top",
            end: "bottom top+=80",
            scrub: true
          }
        });
      });
    })
    .catch(error => {
      console.error('Error loading or processing week data:', error);
      weeklySummaryCardsContainer.innerHTML = `<p class="text-danger">Could not load weekly summaries. ${error.message}</p>`;
    });

  // Helper: Convert H'cap Changes HTML string to a <ul> list
  function handicapChangesHTMLToList(html) {
    if (!html) return '';
    const parts = html.replace(/^H'cap Changes:\s*/i, '').split(/\s*,\s*/);
    if (!parts.length) return '';
    return `
      <div class="handicap-changes-html mb-3">
        <strong>H'cap Changes:</strong>
        <ul class="mb-0 ps-3">
          ${parts.map(item => `<li>${item.trim()}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  function createCardHTML(weekData) {
    if (!weekData || typeof weekData !== 'object') {
      console.error('Invalid weekData for card:', weekData);
      return '<div class="col"><p class="text-danger">Error displaying this week\'s summary due to invalid data.</p></div>';
    }
    const summaryPlayersHTML = (weekData.cardSummaryPlayers || []).map(player => `
      <tr>
        <td class="text-center">${player.pos || ''}</td>
        <td>${player.name || 'N/A'}</td>
        <td class="text-center">${player.points || ''}</td>
      </tr>
    `).join('');

    // Render H'cap Changes as a list
    const handicapChangesHTML = weekData.handicapChangesHTML
      ? handicapChangesHTMLToList(weekData.handicapChangesHTML)
      : '';

    return `
      <div class="col">
        <div class="card border-0 h-100 rounded-3  bg-secondary">
          <div class="card-body d-flex flex-column">
            <div class="flex-grow-1">
              <h5 class="card-title fs-5 mb-2 custom-week-underline">${weekData.cardTitle || 'Untitled Week'}</h5>
              <p class="card-text mb-5">${weekData.prizeMoneyText || ''}<br>${weekData.numPlayersText || ''}</p>
              <div class="table-responsive">
                <table class="table table-hover mb-5">
                  <thead>
                    <tr>
                      <th scope="col" class="text-center">POS</th>
                      <th scope="col">NAME</th>
                      <th scope="col" class="text-center">POINTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${summaryPlayersHTML}
                  </tbody>
                </table>
              </div>
              ${handicapChangesHTML}
            </div>
            <div class="scores-button-wrapper text-end pt-4">
              <a href="#" data-bs-toggle="modal" data-bs-target="#${weekData.modalId || ''}"
                class="d-inline-flex align-items-center text-decoration-none">
                <span class="me-2">Full results</span>
                <span class="arrow-icon-circle"><i class="ai-arrow-right fs-xl"></i></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function createModalHTML(weekData) {
    if (!weekData || typeof weekData !== 'object') {
      console.error('Invalid weekData for modal:', weekData);
      return '<div><p class="text-danger">Error displaying modal content due to invalid data.</p></div>';
    }
    const fullScoresHTML = (weekData.fullScores || []).map(player => `
      <tr>
        <td class="text-center">${player.pos || ''}</td>
        <td>${player.name || 'N/A'}</td>
        <td class="text-center">${player.points || ''}</td>
      </tr>
    `).join('');

    return `
      <div class="modal fade" id="${weekData.modalId || `defaultModal${Math.random().toString(36).substring(7)}`}" tabindex="-1" aria-labelledby="${weekData.modalLabelId || ''}" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="${weekData.modalLabelId || ''}">${weekData.modalTitle || 'Scores'}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th scope="col" class="text-center">POS</th>
                      <th scope="col">NAME</th>
                      <th scope="col" class="text-center">POINTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${fullScoresHTML}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
});
