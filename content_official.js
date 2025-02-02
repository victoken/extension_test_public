/*****************************************************************
 * content_official.js
 *   - 在官方網站頁面執行的 content script
 *   - 負責實際「填寫表單」的邏輯
 *****************************************************************/
console.log("content_official.js 已加載並運行");

// 監聽來自 background.js 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("【content_official.js】接收到來自背景腳本的消息：", message);

  if (message.action === "fillForm") {
    fillForm(message.data)
      .then((result) => {
        // 直接將result回傳給 background.js
        sendResponse(result);
      })
      .catch((error) => {
        // 若 fillForm() 內部 throw 非預期錯誤，就回傳
        console.error("填表時發生非預期錯誤：", error);
        sendResponse({
          status: "error",
          errors: [error.message],
        });
      });

    // return true 以保持消息通道等待非同步
    return true;
  }
});

// ---------------- 填表 ------------------

async function fillForm(data) {
  const errors = [];

  console.group("【fillForm】開始填寫表單");

  try {
    //  Step 1：填寫基本資訊
    console.group("【Step 1】填寫基本資訊");

    // 1) name
    const nameInput = document.getElementById("name");
    if (nameInput) {
      nameInput.value = data.name || "";
      dispatchEvents(nameInput);
      console.log("姓名已填寫：", nameInput.value);
    } else {
      errors.push("找不到姓名輸入框 (#name)");
    }

    // 2) passNo
    const passNoInput = document.getElementById("passNo");
    if (passNoInput) {
      passNoInput.value = data.passNo || "";
      dispatchEvents(passNoInput);
      console.log("護照號碼已填寫：", passNoInput.value);
    } else {
      errors.push("找不到護照號碼輸入框 (#passNo)");
    }

    // 3) dob
    const dobInput = document.getElementById("dob");
    if (dobInput) {
      dobInput.value = data.dob || "";
      dispatchEvents(dobInput);
      console.log("出生日期已填寫：", dobInput.value);
    } else {
      errors.push("找不到出生日期輸入框 (#dob)");
    }

    // 4) sex
    const sexSelect = document.getElementById("sex");
    if (sexSelect) {
      sexSelect.value = data.sex || "";
      dispatchEvents(sexSelect);
      console.log("性別已選擇：", sexSelect.value);
    } else {
      errors.push("找不到性別下拉選單 (#sex)");
    }
    console.groupEnd(); // end Step 1

    //Step 2：填寫住宿資訊 (state, city)
    console.group("【Step 2】填寫住宿資訊");

    // state
    const accommodationState = document.getElementById("accommodationState");
    if (accommodationState) {
      accommodationState.value = data.state || "";
      dispatchEvents(accommodationState);
      console.log("accommodationState 已選擇：", accommodationState.value);
    } else {
      errors.push("找不到 accommodationState (#accommodationState)");
    }

    // 等待 city 載入
    const cityElement = await waitForAccommodationCity();
    if (!cityElement) {
      errors.push("找不到 accommodationCity (#accommodationCity) 或加載超時");
    } else {
      // 目標 city
      const cityValue = data.city || "";
      // 選擇 city
      const cityError = selectCity(cityElement, cityValue);
      if (cityError) errors.push(cityError);
    }

    console.groupEnd(); // end Step 2
    console.groupEnd(); // end 最外層

    // 收尾：如果有任何錯誤
    if (errors.length > 0) {
      console.warn("填寫表單時出現錯誤：", errors);
      return { status: "error", errors };
    } else {
      console.log("表單填寫完成，沒有任何錯誤");
      return { status: "success" };
    }
  } catch (error) {
    console.groupEnd();
    throw error; // 讓最外層 catch .catch(...) 捕捉
  }
}

/**
 * 等待 city 下拉載入 (最多 20 次，每次間隔 900ms)
 */
function waitForAccommodationCity() {
  return new Promise((resolve) => {
    const maxAttempts = 20;
    let attempts = 0;

    console.log("【waitForAccommodationCity】開始檢查...");

    const timer = setInterval(() => {
      const cityEl = document.getElementById("accommodationCity");
      if (cityEl && cityEl.options.length > 1) {
        clearInterval(timer);
        console.log("accommodationCity 已加載");
        resolve(cityEl);
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(timer);
          console.warn("accommodationCity 加載超時");
          resolve(null);
        }
      }
    }, 900);
  });
}

//選擇城市

function selectCity(cityElement, cityValue) {
  if (!cityValue) {
    return "沒有提供 cityValue，無法選擇城市";
  }

  const cityOption = Array.from(cityElement.options).find(
    (opt) => opt.textContent.trim() === cityValue
  );
  if (!cityOption) {
    return `找不到城市選項：${cityValue}`;
  }

  if (cityElement.value !== cityOption.value) {
    cityElement.value = cityOption.value;
    dispatchEvents(cityElement);
    console.log("accommodationCity 已選擇：", cityElement.value);
  } else {
    console.log("accommodationCity 已是正確的值，跳過設定");
  }
  return null;
}

//手動觸發常用事件 (input, change, blur)

function dispatchEvents(el) {
  ["input", "change", "blur"].forEach((evt) => {
    el.dispatchEvent(new Event(evt, { bubbles: true }));
  });
}
