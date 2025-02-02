/*****************************************************************
 * content_internal.j
 *   - 負責從內部系統頁面上取得資料
 *****************************************************************/

console.log("content_internal.js 在跑了");

// 按鈕
const sendDataButton = document.getElementById("sendData");
if (sendDataButton) {
  sendDataButton.type = "button"; // 避免 submit
  sendDataButton.addEventListener("click", () => {
    console.log("子視窗按鈕已被點擊！");

    // 從 DOM 取資料
    const passengerData = {
      name: document.querySelector("#name")?.value || "",
      passNo: document.querySelector("#passNo")?.value || "",
      dob: document.querySelector("#dob")?.value || "",
      sex: document.querySelector("#sex")?.value || "",
      state: document.querySelector("#accommodationState")?.value || "",
      city: document.querySelector("#accommodationCity")?.value || "",
    };
    console.log("獲取到的旅客資料：", passengerData);

    // 發送給 background
    chrome.runtime.sendMessage(
      { action: "sendPassengerData", data: passengerData },
      (response) => {
        // 這裡拿到 background 傳回來的 content script 執行結果
        console.log(
          "【content_internal.js】資料已傳送到背景腳本，回應：",
          response
        );

        if (!response) {
          // 若無回應
          alert("未收到任何回應 (可能發生錯誤)");
          return;
        }

        if (response.status === "error") {
          // 如果有 errors 就顯示出來
          if (response.errors) {
            alert("【失敗】\n" + response.errors.join("\n"));
          } else {
            alert("【失敗】發生錯誤");
          }
        } else if (response.status === "success") {
          alert("【成功】表單已填寫完成！");
        } else {
          alert("回傳未知狀態：" + JSON.stringify(response));
        }
      }
    );
  });
} else {
  console.error("未找到按鈕 #sendData");
}
