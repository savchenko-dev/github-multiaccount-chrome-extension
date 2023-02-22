"use strict";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_USER") {
    const username = document
      .querySelector('[href="/settings/profile"] + a')
      .innerText.trim();
    const avatar = document.querySelector(
      '[href="/settings/profile"] + a img'
    ).src;

    sendResponse({ username, avatar });
  }

  sendResponse({});
  return true;
});
