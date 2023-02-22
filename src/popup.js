"use strict";

import "./popup.css";

(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    renderAccounts();

    document
      .getElementById("save-current-account")
      .addEventListener("click", async () => {
        const sessionCookie = await getSessionCookie();
        const accounts = await getAccounts();

        if (
          accounts.find(
            (account) => account.user_session === sessionCookie?.value
          )
        ) {
          return;
        }

        const user = await getUser();
        const account = { ...user, user_session: sessionCookie.value };

        await setAccounts([...accounts, account]);

        renderAccounts();
      });

    document
      .getElementById("safe-logout")
      .addEventListener("click", async () => {
        await setSessionCookie("");
        await chrome.tabs.reload();
        renderAccounts();
      });
  });

  async function getUser() {
    const tab = await getCurrentTab();

    return await new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tab.id, { type: "GET_USER" }, (user) => {
          resolve(user);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async function renderAccounts() {
    const accounts = await getAccounts();
    const sessionCookie = await getSessionCookie();

    const accountsListEl = document.getElementById("accounts-list");

    accounts.length > 0 && (accountsListEl.innerHTML = "");

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const isCurrent = sessionCookie?.value === account.user_session;

      const accountEl = document.createElement("button");
      accountEl.className = "btn btkn-bloc";
      accountEl.dataset.id = account.user_session;
      isCurrent && accountEl.classList.add("btn-primary");
      const accountImage = document.createElement("img");
      accountImage.className = "avatar avatar-user";
      accountImage.src = account.avatar;
      accountImage.width = 20;
      accountImage.height = 20;
      accountImage.style.marginRight = "5px";
      const accountUsername = document.createTextNode(account.username);
      accountEl.appendChild(accountImage);
      accountEl.appendChild(accountUsername);

      if (!isCurrent) {
        accountEl.addEventListener("click", async () => {
          await setSessionCookie(account.user_session);
          await chrome.tabs.reload();
          renderAccounts();
        });
      }

      accountEl.addEventListener("dblclick", async () => {
        const accounts = await getAccounts();
        await setAccounts(
          accounts.filter(
            (_account) => _account.user_session !== account.user_session
          )
        );
        await setSessionCookie("");
        await chrome.tabs.reload();
        renderAccounts();
      });

      accountsListEl.appendChild(accountEl);
    }
  }

  async function getAccounts() {
    const response = await chrome.storage.sync.get(["accounts"]);
    return response?.accounts || [];
  }

  async function setAccounts(accounts) {
    return await chrome.storage.sync.set({ accounts }).then(() => {
      console.log("Accounts saved", accounts);
    });
  }

  async function getSessionCookie() {
    const tab = await getCurrentTab();

    return await chrome.cookies.get({
      url: tab.url,
      name: "user_session",
    });
  }

  async function setSessionCookie(user_session) {
    const tab = await getCurrentTab();

    if (!tab) throw new Error("Tab object is undefined");

    return await chrome.cookies.set({
      url: tab.url,
      value: user_session,
      httpOnly: true,
      name: "user_session",
      sameSite: "lax",
      secure: true,
    });
  }

  async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }
})();
