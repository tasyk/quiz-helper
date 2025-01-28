document.addEventListener('DOMContentLoaded', function() {
    const captureButton = document.getElementById('captureButton');
    const answerArea = document.getElementById('answerArea');
    const promptArea = document.getElementById('promptArea');
    let geminiApiKey = null; // Змінна для зберігання API ключа

    function log(message) {
        chrome.runtime.sendMessage({ log: message });
    }


    // Save prompt to storage on unload
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            chrome.storage.sync.set({ promptText: promptArea.value });
            log(promptArea.value + ' prompt збережено'); 
        }
    });
    
    
    //load stored prompt
    chrome.storage.sync.get("promptText", (data) => {
        if (data.promptText) {
            promptArea.value = data.promptText;
            log(data.promptText + ' prompt завантажено'); 
            
        }
        else {
            promptArea.value = "на картинці запитання з варіантами відповідей " +
            "Який варіант відповіді правильний? (якщо таких задач кілька, дай відповідь на кожну)";
            log('Промпт за замовчуванням: ' + promptArea.value); 
        }
    });

    // Функція для завантаження API ключа з key.txt
    function loadApiKey() {
        return fetch('key.txt') // Завантажуємо файл key.txt з кореня розширення
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Помилка завантаження key.txt: ${response.status} ${response.statusText}
                        Додайте файл key.txt у корінь розширення і покладіть туди API ключ 
                        (його мождна отримати у https://aistudio.google.com/   Get API key-(ліворуч вгорі))`);
                }
                return response.text();
            })
            .then(text => {
                geminiApiKey = text.trim(); // Отримуємо текст з файлу та обрізаємо зайві пробіли
                if (!geminiApiKey) {
                    throw new Error('API ключ не знайдено у файлі key.txt.');
                }
                log('API ключ завантажено.'); // Для дебагу

                

            })
            .catch(error => {
                answerArea.textContent = `Помилка завантаження API ключа: ${error.message}`;
                error('Помилка завантаження API ключа:', error);
                throw error; // Прокидаємо помилку далі, щоб зупинити ініціалізацію
            });
    }

  

    // Завантажуємо API ключ перед додаванням обробника подій кнопки
    loadApiKey()        
        .then(() => {
            captureButton.addEventListener("click", function() {
                log("Кнопка натиснута");

                

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
                                    text: promptArea.value
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