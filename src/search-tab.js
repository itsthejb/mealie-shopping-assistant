const SEARCH_TAB_ID_KEY = "supermarketSearchTabId";

function isMissingTabError(error) {
  return typeof error?.message === "string" && /no tab with id/i.test(error.message);
}

async function createSearchTab(tabs, sessionStorage, url) {
  const tab = await tabs.create({ url, active: true });
  if (!Number.isInteger(tab?.id)) {
    throw new Error("Chrome did not return an ID for the supermarket tab.");
  }
  await sessionStorage.set({ [SEARCH_TAB_ID_KEY]: tab.id });
  return tab.id;
}

async function navigateSearchTabOnce(tabs, sessionStorage, url) {
  const { [SEARCH_TAB_ID_KEY]: tabId } = await sessionStorage.get(SEARCH_TAB_ID_KEY);
  if (Number.isInteger(tabId)) {
    try {
      const tab = await tabs.update(tabId, { url, active: true });
      if (tab?.id === tabId) return tabId;
    } catch (error) {
      if (!isMissingTabError(error)) throw error;
    }
  }
  return createSearchTab(tabs, sessionStorage, url);
}

let navigationQueue = Promise.resolve();

export function navigateSearchTab(tabs, sessionStorage, url) {
  const navigation = navigationQueue.then(() =>
    navigateSearchTabOnce(tabs, sessionStorage, url),
  );
  navigationQueue = navigation.then(
    () => undefined,
    () => undefined,
  );
  return navigation;
}
