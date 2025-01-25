function captureQuestionAndSendToBackground() {
    //  ===  Логіка вибору зображення запитання та варіантів відповіді  ===

    //  **Приклад (потрібно адаптувати під структуру сторінки):**
    //  Припустимо, що зображення запитання має ID "question-image", а варіанти відповіді - класи "answer-option-image"

    const questionImage = document.getElementById('question-image'); // Змініть на реальний селектор
    const answerOptionImages = document.querySelectorAll('.answer-option-image'); // Змініть на реальний селектор

    if (!questionImage) {
        alert("Не знайдено зображення запитання. Перевірте структуру сторінки.");
        return;
    }

    const imagesData = [];
    imagesData.push(questionImage.src); // Або questionImage.toDataURL() якщо потрібно base64

    answerOptionImages.forEach(img => {
        imagesData.push(img.src); // Або img.toDataURL()
    });

    // Відправляємо дані фоновому скрипту
    chrome.runtime.sendMessage({ images: imagesData }, function(response) {
        if (response && response.recommendation) {
            //  Обробка відповіді, якщо потрібно щось зробити на сторінці
            console.log("Рекомендація отримана (контентний скрипт):", response.recommendation);
        } else if (response && response.error) {
            console.error("Помилка від background script:", response.error);
            alert("Помилка аналізу: " + response.error);
        }
    });
}