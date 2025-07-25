// === Suggestion Cards ===
fetch('suggestions.json')
  .then(response => response.json())
  .then(data => {
    const shapeSuggestions = data.shapes;
    const colorSuggestions = data.colors;

    document.querySelectorAll('.poop-suggestion').forEach(el => {
      const type = el.getAttribute('data-type');
      let suggestion = '';

      if (shapeSuggestions[type]) {
        suggestion = shapeSuggestions[type];
      } else if (colorSuggestions[type]) {
        suggestion = colorSuggestions[type];
      }

      if (suggestion) {
        el.innerHTML = `
          <button class="suggestion-toggle" aria-label="Show suggestion">💡</button>
          <div class="suggestion-text hidden">${suggestion}</div>
        `;
        el.classList.add('active-suggestion');
      }
    });

    document.querySelectorAll('.suggestion-toggle').forEach(button => {
      button.addEventListener('click', () => {
        const textEl = button.nextElementSibling;
        textEl.classList.toggle('hidden');
      });
    });
  })
  .catch(error => {
    console.error('Error loading suggestions:', error);
  });

// === Quiz Section ===
function loadQuiz() {
  let questionsPlayed = 0;

  fetch('quiz.json')
    .then(response => response.json())
    .then(questions => {
      questions = questions.sort(() => Math.random() - 0.5);
      const container = document.querySelector('#quiz-container .quiz-inner');
      let currentQuestion = 0;
      let score = 0;

      function shuffleArray(array) {
        return array.sort(() => Math.random() - 0.5);
      }

      function showQuestion(index) {
        const q = questions[index];
        questionsPlayed++;
        const shuffledOptions = shuffleArray([...q.options]);

        container.innerHTML = `
          <div class="quiz-meta">
            <span>Question ${index + 1} of ${questions.length}</span>
            <span>Score: ${score}</span>
          </div>

          <div class="quiz-question">
            <p><strong>Q:</strong> ${q.question}</p>
            <ul class="quiz-options">
              ${shuffledOptions.map(option => `
                <li>
                  <button class="quiz-option" data-answer="${option}">${option}</button>
                </li>
              `).join('')}
            </ul>
            <p class="quiz-feedback"></p>
            <button id="quit-quiz" class="quit-button">End Quiz</button>
          </div>
        `;

        document.querySelectorAll('.quiz-option').forEach(button => {
          button.addEventListener('click', () => {
            const feedback = document.querySelector('.quiz-feedback');
            const selected = button.getAttribute('data-answer');
            const isCorrect = selected === q.answer;

            if (isCorrect) {
              feedback.textContent = '✅ Correct!';
              score++;
            } else {
              feedback.textContent = `❌ Nope. Correct answer: ${q.answer}`;
            }

            document.querySelectorAll('.quiz-option').forEach(btn => btn.disabled = true);

            setTimeout(() => {
              currentQuestion++;
              if (currentQuestion < questions.length) {
                showQuestion(currentQuestion);
              } else {
                showResult();
              }
            }, 1000);
          });
        });

        document.getElementById('quit-quiz').addEventListener('click', showResult);
      }

      function showResult() {
        container.innerHTML = `
          <div class="quiz-result">
            <p>🎉 You got ${score} correct out of ${questionsPlayed} questions played!</p>
            <button id="restart-quiz">Retry Quiz</button>
          </div>
        `;

        document.getElementById('restart-quiz').addEventListener('click', () => {
          currentQuestion = 0;
          score = 0;
          questionsPlayed = 0;
          showQuestion(currentQuestion);
        });
      }

      showQuestion(currentQuestion);
    })
    .catch(err => {
      console.error('Quiz loading error:', err);
      document.getElementById('quiz-container').innerHTML = '<p>Quiz failed to load.</p>';
    });
}


// === Facts ===
function loadFacts() {
  fetch('facts.json')
    .then(r => r.json())
    .then(data => {
      const factText = document.getElementById('fact-text');
      const newFactBtn = document.getElementById('new-fact');

      let currentFact = '';

      function showRandom() {
        const fact = data[Math.floor(Math.random() * data.length)];
        factText.textContent = fact.text;
        currentFact = fact.text;
      }
      showRandom();

      newFactBtn.addEventListener('click', showRandom);

    })
    .catch(err => console.error('Facts load error:', err));
}

// === Poop History List ===
function loadPoopHistory() {
  const list = document.getElementById('poop-entries');
  list.innerHTML = '';
  const poopLog = JSON.parse(localStorage.getItem('poopLog') || '[]');

  poopLog.forEach(entry => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${entry.date}</strong><br>
      <img src="assets/${entry.shape.toLowerCase().replace(' ', '')}.svg" alt="${entry.shape}" width="30">
      <img src="assets/${entry.color.toLowerCase()}.svg" alt="${entry.color}" width="30">
      Notes: ${entry.notes || '<em>None</em>'}
    `;
    list.appendChild(li);
  });
}

// === Poop Heatmap ===
function loadPoopHeatmap() {
  console.log('loadPoopHeatmap called');
  const log = JSON.parse(localStorage.getItem('poopLog') || '[]');
  const grid = document.getElementById('heatmap-grid');
  if (!grid) {
    console.warn('Heatmap grid container not found!');
    return;
  }
  grid.innerHTML = '';

  const today = new Date();
  const days = 30;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toLocaleDateString();

    const entry = log.find(e => new Date(e.date).toLocaleDateString() === key);

    let score = 0;
    let label = 'No log';

    if (entry) {
      score = computePoopScore(entry.shape, entry.color);
      label = `${entry.shape}, ${entry.color}`;
    }

    const day = document.createElement('div');
    day.className = 'heatmap-day';
    day.setAttribute('data-score', score);
    day.setAttribute('data-tooltip', label);
    day.textContent = date.getDate();
    grid.appendChild(day);
  }
}

function computePoopScore(shape, color) {
  const shapeScore = {
    'Type 3': 3, 'Type 4': 3,
    'Type 5': 2, 'Type 2': 2,
    'Type 1': 1, 'Type 6': 1, 'Type 7': 1
  }[shape] || 2;

  const colorScore = {
    'Brown': 3, 'Green': 2, 'Orange': 2,
    'Yellow': 1, 'Red': 1, 'Black': 1, 'Pale': 1
  }[color] || 2;

  return Math.min(shapeScore, colorScore);
}

// === Picker Icons ===
function setupPicker(pickerId, inputId) {
  document.querySelectorAll(`#${pickerId} .picker-icon`).forEach(img => {
    img.addEventListener('click', () => {
      document.querySelectorAll(`#${pickerId} .picker-icon`).forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
      document.getElementById(inputId).value = img.getAttribute('data-value');
    });
  });
}

// sharing content
function shareContent(platform, message) {
  const url = encodeURIComponent('https://yourgu.com');
  const text = encodeURIComponent(message);

  let shareUrl = '';

  switch (platform) {
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${text}%20${url}`;
      break;
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${text}%20${url}`;
      break;
    case 'email':
      shareUrl = `mailto:?subject=Poop Fact from yourgu.com&body=${text}%20${url}`;
      break;
    default:
      alert('Unsupported platform');
      return;
  }

  window.open(shareUrl, '_blank');
}


// === Main DOM Ready Block ===
document.addEventListener('DOMContentLoaded', () => {
  loadQuiz();
  loadFacts();
  loadPoopHistory();
  loadPoopHeatmap();

  setupPicker('shape-picker', 'poop-shape');
  setupPicker('color-picker', 'poop-color');

  document.getElementById('poop-form').addEventListener('submit', e => {
    e.preventDefault();
    const shape = document.getElementById('poop-shape').value;
    const color = document.getElementById('poop-color').value;
    const notes = document.getElementById('poop-notes').value;

    if (!shape || !color) {
      alert('Pick both shape and color.');
      return;
    }

    const poopLog = JSON.parse(localStorage.getItem('poopLog') || '[]');
    poopLog.unshift({
      shape, color, notes,
      date: new Date().toLocaleString()
    });
    localStorage.setItem('poopLog', JSON.stringify(poopLog));
    document.getElementById('poop-form').reset();
    document.querySelectorAll('.picker-icon.selected').forEach(el => el.classList.remove('selected'));

    loadPoopHistory();
    loadPoopHeatmap();
  });
// export poop history
    document.getElementById('export-csv').addEventListener('click', () => {
    const poopLog = JSON.parse(localStorage.getItem('poopLog') || '[]');
    if (!poopLog.length) {
      alert('No poop data to export!');
      return;
    }

    // Convert to CSV
    const headers = ['Shape', 'Color', 'Notes', 'Date'];
    const rows = poopLog.map(entry =>
      [entry.shape, entry.color, entry.notes, entry.date].map(val =>
        `"${(val || '').replace(/"/g, '""')}"`
      ).join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'poop-log.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });


  // Share Buttons
  document.getElementById('share-whatsapp').href =
    `https://wa.me/?text=You%20should%20know%20about%20your%20poop%2C%20check%20out%20${encodeURIComponent(location.href)}`;
  document.getElementById('share-twitter').href =
    `https://twitter.com/intent/tweet?text=You%20should%20know%20about%20your%20poop%2C%20check%20out%20&url=${encodeURIComponent(location.href)}`;
  document.getElementById('share-email').href =
    `mailto:?subject=You%20should%20know%20about%20your%20poop&body=Check%20it%20out%20${encodeURIComponent(location.href)}`;
});
