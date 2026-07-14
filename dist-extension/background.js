const APP_PAGE = 'index.html';

const getAppUrl = () => chrome.runtime.getURL(APP_PAGE);

const focusAppTab = async (tab) => {
  if (typeof tab.id !== 'number') {
    return false;
  }

  await chrome.tabs.update(tab.id, { active: true });

  if (typeof tab.windowId === 'number') {
    await chrome.windows.update(tab.windowId, { focused: true });
  }

  return true;
};

const openOrFocusApp = async () => {
  const appUrl = getAppUrl();
  const tabs = await chrome.tabs.query({});
  const appTab = tabs.find((tab) => tab.url === appUrl);

  if (appTab && await focusAppTab(appTab)) {
    return;
  }

  await chrome.tabs.create({ url: appUrl });
};

chrome.action.onClicked.addListener(() => {
  void openOrFocusApp();
});
