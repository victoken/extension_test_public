console.log("background.js 在跑了");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("【background.js】收到訊息：", message);

  if (message.action === "sendPassengerData") {
    // 1) 來自 internal 的旅客資料
    const passengerData = message.data;

    // 2) 查找是否已開啟官方網站分頁
    chrome.tabs.query(
      { url: "https://imigresen-online.imi.gov.my/mdac/main?registerMain*" },
      (tabs) => {
        if (tabs.length > 0) {
          // 直接把資料發給 content_official.js
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "fillForm", data: passengerData },
            (responseFromContent) => {
              if (chrome.runtime.lastError) {
                // 表示連 sendMessage 都失敗
                const errorMsg = chrome.runtime.lastError.message;
                console.error("錯誤傳送消息到官方網站頁面：", errorMsg);
                sendResponse({ status: "error", message: errorMsg });
              } else {
                // 直接返回 content script 執行結果
                sendResponse(responseFromContent);
              }
            }
          );
        } else {
          // 3) 沒有打開就create tab
          chrome.tabs.create(
            {
              url: "https://imigresen-online.imi.gov.my/mdac/main?registerMain",
            },
            (tab) => {
              console.log("已自動打開官方網站頁面：", tab);

              // 等頁籤 load 完再 sendMessage
              const listener = function (tabId, info) {
                if (tabId === tab.id && info.status === "complete") {
                  console.log("新打開頁籤已加載，發送資料");

                  chrome.tabs.sendMessage(
                    tab.id,
                    { action: "fillForm", data: passengerData },
                    (responseFromContent) => {
                      if (chrome.runtime.lastError) {
                        const errorMsg = chrome.runtime.lastError.message;
                        console.error(
                          "錯誤傳送消息到新開的官方網站頁面：",
                          errorMsg
                        );
                        sendResponse({ status: "error", message: errorMsg });
                      } else {
                        //直接返回 content script 的結果
                        sendResponse(responseFromContent);
                      }
                    }
                  );

                  // 移除監聽器
                  chrome.tabs.onUpdated.removeListener(listener);
                }
              };
              chrome.tabs.onUpdated.addListener(listener);
            }
          );
        }
      }
    );

    return true; // 保持 message channel
  }
});
