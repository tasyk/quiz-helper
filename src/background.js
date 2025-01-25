
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
    console.error("Помилка setPanelBehavior:", error);
  });
});

chrome.runtime.onInstalled.addListener(function () {
  //chrome.action.enable();
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon64.png',
    title: 'Pin Extension',
    message: 'Pin Quiz Solver extension to the toolbar for easy access!',
    priority: 1
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "capture_screen") {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (screenshotUrl) => {
          if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
              sendResponse({ success: true, imageUrl: screenshotUrl });
          }
      });

      return true; // Потрібно для асинхронного `sendResponse`
  }
});

