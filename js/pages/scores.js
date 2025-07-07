async function fetchData() {
    try {
        const response = await fetch('/data.json');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching or parsing data:', error);
        return null;
    }
}

function animateCards() {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll(".golf-card").forEach((card) => {
        gsap.fromTo(card,
            { opacity: 0, y: 50 },
            {
                opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
                scrollTrigger: {
                    trigger: card,
                    start: "top 90%",
                    toggleActions: "play none none none",
                    once: true
                }
            }
        );
    });
}

export async function render() {
    const data = await fetchData();

    if (!data || !data.weeklyScoresData) {
        return '<p class="feedback-message">No scores data found.</p>';
    }

    const weeks = data.weeklyScoresData;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }

    weeks.forEach(week => {
        week.dateObject = null;
        week.calculatedDisplayDate = '';
    });

    weeks.sort((a, b) => parseInt(a.weekId.replace('week', '')) - parseInt(b.weekId.replace('week', '')));

    let previousRoundDateObj = null;
    if (weeks.length > 0) {
        for (let i = 0; i < weeks.length; i++) {
            const weekData = weeks[i];
            const roundNumberStr = weekData.cardTitle ? weekData.cardTitle.replace('WEEK ', '').trim() : null;
            if (roundNumberStr === 'ONE' || (parseInt(roundNumberStr, 10) === 1 && i === 0)) {
                weekData.dateObject = new Date(2025, 3, 2);
                weekData.calculatedDisplayDate = formatDate(weekData.dateObject);
                previousRoundDateObj = new Date(weekData.dateObject);
            } else if (previousRoundDateObj) {
                let targetDate = new Date(previousRoundDateObj);
                targetDate.setDate(targetDate.getDate() + 7);
                let daysToAdjust = 3 - targetDate.getDay();
                targetDate.setDate(targetDate.getDate() + daysToAdjust);
                weekData.dateObject = targetDate;
                weekData.calculatedDisplayDate = formatDate(targetDate);
                previousRoundDateObj = new Date(weekData.dateObject);
            } else {
                weekData.calculatedDisplayDate = "Date N/A";
            }
        }
    }
    weeks.reverse();

    const cardsHTML = weeks.map(weekData => {
        const winner = weekData.fullScores?.[0] || { name: 'N/A', points: 'N/A' };
        let prizeAmountValue = '0.00';
        if (weekData.prizeMoneyText) {
            const poundIndex = weekData.prizeMoneyText.indexOf('£');
            if (poundIndex !== -1) {
                let textAfterPound = weekData.prizeMoneyText.substring(poundIndex + 1).trim();
                const numberMatch = textAfterPound.match(/^(\d+(\.\d{1,2})?)/);
                if (numberMatch?.[1]) {
                    prizeAmountValue = parseFloat(numberMatch[1]).toFixed(2);
                } else if (textAfterPound.length > 0 && textAfterPound.length <= 6 && !textAfterPound.match(/\s/)) {
                    prizeAmountValue = textAfterPound;
                }
            }
        }
        const roundNumber = weekData.cardTitle ? weekData.cardTitle.replace('WEEK ', '').trim() : 'N/A';
        const displayDateWithRound = `ROUND ${roundNumber} • ${weekData.calculatedDisplayDate}`;
        return `
            <div class="golf-card">
                <div class="left">
                    <div class="week-date"><span class="date-text">${displayDateWithRound}</span></div>
                    <div class="prize-details-inline"> 
                        <span class="prize-label-inline">PRIZE MONEY:</span>
                        <span class="prize-amount-inline">£${prizeAmountValue}</span>
                    </div>
                    <div class="name-score-line"> 
                        <div class="winner-name">${winner.name}</div>
                        <div class="score">${winner.points} <span class="score-unit">pts</span></div>
                    </div>
                    <div class="card-footer">
                        <div class="handicap-changes">${weekData.handicapChangesHTML || 'No handicap changes'}</div>
                        <a href="/results?weekId=${weekData.weekId}" class="results-link" data-link>
                            <svg class="arrow-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/></svg>
                        </a>
                    </div>
                </div>
            </div>`;
    }).join('');

    setTimeout(animateCards, 0);

    return `<div id="cards-container">${cardsHTML}</div>`;
}