let sidePanelOpen = false; // Змінна для відстеження стану бічної панелі

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
    console.error("Помилка setPanelBehavior:", error);
  });
});

// chrome.action.onClicked.addListener(async (tab) => {
//   if (sidePanelOpen) {
//     // Закриваємо бічну панель
//     await chrome.sidePanel.setOptions({ enabled: false });
//     console.log("Side panel вимкнено");
//     sidePanelOpen = false;
//   } else {
//     // Спочатку вмикаємо панель
//     await chrome.sidePanel.setOptions({ 
//       enabled: true, 
//       path: "sidebar.html" 
//     });

//     console.log("Side panel налаштовано");
    
//     // Потім відкриваємо
//     console.log(chrome.sidePanel.open);
//     await chrome.sidePanel.open();
//     sidePanelOpen = true;
//   }
// });
