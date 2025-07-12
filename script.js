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

  // quiz section
  function loadQuiz() {
    let questionsPlayed = 0;
  fetch('quiz.json')
    .then(response => response.json())
    .then(questions => {
      questions = questions.sort(() => Math.random() - 0.5)
      const container = document.querySelector('#quiz-container .quiz-inner');
      let currentQuestion = 0;
      let score = 0;

      function showQuestion(index) {
        const q = questions[index];
        questionsPlayed++;
        container.innerHTML = `
          <div class="quiz-meta">
            <span>Question ${index + 1} of ${questions.length}</span>
            <span>Score: ${score}</span>
          </div>

          <div class="quiz-question">
            <p><strong>Q:</strong> ${q.question}</p>
            <ul class="quiz-options">
              ${q.options.map(option => `
                <li><button class="quiz-option">${option}</button></li>
              `).join('')}
            </ul>
            <p class="quiz-feedback"></p>
            <button id="quit-quiz" class="quit-button">End Quiz</button>
          </div>
        `;

  document.querySelectorAll('.quiz-option').forEach(button => {
    button.addEventListener('click', () => {
      const feedback = document.querySelector('.quiz-feedback');
      if (button.textContent === q.answer) {
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

// Trigger when quiz section comes into view or is linked
document.addEventListener("DOMContentLoaded", loadQuiz);

function loadFacts() {
  fetch('facts.json')
    .then(r => r.json())
    .then(data => {
      const factText = document.getElementById('fact-text');
      const btn = document.getElementById('new-fact');
      function showRandom() {
        const fact = data[Math.floor(Math.random() * data.length)];
        factText.textContent = fact.text;
      }
      showRandom();
      btn.addEventListener('click', showRandom);
    })
    .catch(err => console.error('Facts load error:', err));
}

document.addEventListener('DOMContentLoaded', loadFacts);

/* === Poop Log === */
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

function setupPicker(pickerId, inputId) {
  document.querySelectorAll(`#${pickerId} .picker-icon`).forEach(img => {
    img.addEventListener('click', () => {
      document.querySelectorAll(`#${pickerId} .picker-icon`).forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
      document.getElementById(inputId).value = img.getAttribute('data-value');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  /* Quiz & Facts init... */
  loadPoopHistory();
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
  });

  /* Share buttons */
  document.getElementById('share-whatsapp').href =
    `https://wa.me/?text=Check%20out%20my%20poop%20log%20at%20${encodeURIComponent(location.href)}`;
  document.getElementById('share-twitter').href =
    `https://twitter.com/intent/tweet?text=Check%20out%20my%20poop%20log%20at%20my%20site!&url=${encodeURIComponent(location.href)}`;
  document.getElementById('share-email').href =
    `mailto:?subject=Look%20at%20my%20poop%20log&body=Check%20it%20out%20${encodeURIComponent(location.href)}`;
});
