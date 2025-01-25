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
            captureButton.addEventListener("click", function() {
                answerArea.textContent = "Завантаження зображення...";
            
                chrome.runtime.sendMessage({ action: "capture_screen" }, (response) => {
                    if (!response.success) {
                        answerArea.textContent = "Помилка знімку екрану: " + response.error;
                        return;
                    }
            
                    answerArea.textContent = "Відправка зображення до Gemini...";
                    //`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${geminiApiKey}`
                    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key='

            
                    fetch(url+geminiApiKey, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    inline_data: {
                                        mime_type: "image/png", // Формат зображення
                                        data: response.imageUrl.split(',')[1] // Видаляємо "data:image/png;base64,"
                                    }
                                }, {
                                    text: "Який варіант відповіді правильний? Дай коротку відповідь."
                                }]
                            }]
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.error) throw new Error(data.error.message);
                        answerArea.textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "Не вдалося отримати відповідь.";
                    })
                    .catch(err => {
                        answerArea.textContent = "Помилка Gemini API: " + err.message;
                    });
                });
            });
        })
        .catch(() => {
            // Помилка завантаження API ключа вже оброблена в loadApiKey,
            // тут можна додати додаткову логіку, якщо потрібно.
            captureButton.disabled = true; // Блокуємо кнопку, якщо не вдалося завантажити ключ
        });
});