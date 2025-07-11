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
  fetch('quiz.json')
    .then(response => response.json())
    .then(questions => {
      const container = document.querySelector('#quiz-container .quiz-inner');
      let currentQuestion = 0;
      let score = 0;

      function showQuestion(index) {
  const q = questions[index];
  container.innerHTML = `
    <div class="quiz-meta">
      <span>Question ${index + 1} of ${questions.length}</span>
      <span>Score: ${score}</span>
    </div>

    <div class="quiz-question">
      <p><strong>Q${q.id}:</strong> ${q.question}</p>
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
      <p>🎉 You scored ${score} out of ${questions.length}!</p>
      <button id="restart-quiz">Retry Quiz</button>
    </div>
  `;

  document.getElementById('restart-quiz').addEventListener('click', () => {
    currentQuestion = 0;
    score = 0;
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

