document.addEventListener('DOMContentLoaded', function() {
    const captureButton = document.getElementById('captureButton');
    const answerArea = document.getElementById('answerArea');

    let geminiApiKey = null; // Змінна для зберігання API ключа

    // Функція для завантаження API ключа з key.txt
    function loadApiKey() {
        return fetch('key.txt') // Завантажуємо файл key.txt з кореня розширення
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Помилка завантаження key.txt: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(text => {
                geminiApiKey = text.trim(); // Отримуємо текст з файлу та обрізаємо зайві пробіли
                if (!geminiApiKey) {
                    throw new Error('API ключ не знайдено у файлі key.txt.');
                }
                console.log('API ключ завантажено.'); // Для дебагу
            })
            .catch(error => {
                answerArea.textContent = `Помилка завантаження API ключа: ${error.message}`;
                console.error('Помилка завантаження API ключа:', error);
                throw error; // Прокидаємо помилку далі, щоб зупинити ініціалізацію
            });
    }

    // Завантажуємо API ключ перед додаванням обробника подій кнопки
    loadApiKey()
        .then(() => {
            captureButton.addEventListener('click', function() {
                answerArea.textContent = 'Аналізую...';

                // Очищаємо попередню відповідь
                answerArea.textContent = '';
                answerArea.textContent = 'Завантаження зображення...';

                chrome.scripting.executeScript({
                    target: { tabId: chrome.tabs.getCurrent().then(tab => tab.id) },
                    function: capturePageAndSendToGemini,
                    args: [geminiApiKey] // Передаємо API ключ як аргумент функції
                }, function(injectionResults) {
                    if (chrome.runtime.lastError) {
                        answerArea.textContent = `Помилка: ${chrome.runtime.lastError.message}`;
                        return;
                    }

                    if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                        const geminiResponse = injectionResults[0].result;
                        answerArea.textContent = geminiResponse;
                    } else {
                        answerArea.textContent = 'Не вдалося отримати відповідь від Gemini.';
                    }
                });
            });
        })
        .catch(() => {
            // Помилка завантаження API ключа вже оброблена в loadApiKey,
            // тут можна додати додаткову логіку, якщо потрібно.
            captureButton.disabled = true; // Блокуємо кнопку, якщо не вдалося завантажити ключ
        });


    function capturePageAndSendToGemini(apiKey) { // Приймаємо apiKey як аргумент
        return new Promise((resolve, reject) => {
            chrome.tabs.captureVisibleTab(null, {}, function(screenshotUrl) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                    return;
                }

                answerArea.textContent = 'Відправка зображення до Gemini...';

                const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;

                fetch(geminiApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                image_url: {
                                    url: screenshotUrl }
                                },
                                {
                                    text: "Який з варіантів відповідей на зображенні є вірним? Дай коротку відповідь'."
                                }]
                        }]
                    })
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Gemini Response:", data);
                    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
                        const geminiResponseText = data.candidates[0].content.parts[0].text;
                        resolve(geminiResponseText);
                    } else {
                        reject('Не вдалося розібрати відповідь від Gemini.');
                    }
                })
                .catch(error => {
                    console.error("Помилка при виклику Gemini API:", error);
                    reject('Помилка при виклику Gemini API: ' + error.message);
                });
            });
        });
    }
});