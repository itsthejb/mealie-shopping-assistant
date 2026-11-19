import {
  createCheckedItemUpdate,
  createSearchUrl,
  getItemName,
  getSubstitutions,
  normalizeSettings,
} from "./core.js";
import {
  getShoppingList,
  getShoppingLists,
  markShoppingItemChecked,
} from "./mealie-api.js";

const elements = {
  settings: document.querySelector("#settings"),
  settingsForm: document.querySelector("#settings-form"),
  mealieUrl: document.querySelector("#mealie-url"),
  apiToken: document.querySelector("#api-token"),
  supermarketName: document.querySelector("#supermarket-name"),
  searchTemplate: document.querySelector("#search-template"),
  refreshLists: document.querySelector("#refresh-lists"),
  listSelect: document.querySelector("#list-select"),
  startShopping: document.querySelector("#start-shopping"),
  currentItem: document.querySelector("#current-item"),
  itemCounter: document.querySelector("#item-counter"),
  itemName: document.querySelector("#item-name"),
  itemDetails: document.querySelector("#item-details"),
  substitutions: document.querySelector("#substitutions"),
  gotIt: document.querySelector("#got-it"),
  skipIt: document.querySelector("#skip-it"),
  done: document.querySelector("#done"),
  status: document.querySelector("#status"),
};

let settings;
let items = [];
let currentIndex = 0;
let busy = false;

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.dataset.error = String(isError);
}

function setBusy(value) {
  busy = value;
  elements.gotIt.disabled = value;
  elements.skipIt.disabled = value;
  elements.done.disabled = value;
  elements.refreshLists.disabled = value || !settings;
  elements.startShopping.disabled = value || !elements.listSelect.value;
}

async function openSearch(query) {
  const url = createSearchUrl(settings.searchUrlTemplate, query);
  await chrome.tabs.create({ url, active: true });
}

function renderCurrentItem() {
  const item = items[currentIndex];
  if (!item) {
    elements.currentItem.hidden = true;
    setStatus("No more items remain in this shopping session.");
    return;
  }

  elements.currentItem.hidden = false;
  elements.itemCounter.textContent = `Item ${currentIndex + 1} of ${items.length}`;
  elements.itemName.textContent = getItemName(item);
  const quantity = item.quantity > 1 ? `${item.quantity} ` : "";
  const unit = item.unit?.name ? `${item.unit.name} ` : "";
  elements.itemDetails.textContent = `${quantity}${unit}${item.note || ""}`.trim();
  elements.substitutions.replaceChildren();

  const substitutions = getSubstitutions(item);
  if (substitutions.length) {
    const heading = document.createElement("h3");
    heading.textContent = "Substitutions";
    elements.substitutions.append(heading);
    for (const substitution of substitutions) {
      const row = document.createElement("div");
      row.className = "substitution";
      const label = document.createElement("span");
      label.textContent = substitution.note
        ? `${substitution.name} — ${substitution.note}`
        : substitution.name;
      const button = document.createElement("button");
      button.className = "secondary";
      button.type = "button";
      button.textContent = "Search";
      button.addEventListener("click", () => searchSubstitution(substitution.name));
      row.append(label, button);
      elements.substitutions.append(row);
    }
  }
  setStatus(`Searching ${settings.supermarketName}. Select and add products there yourself.`);
}

async function searchCurrentItem() {
  await openSearch(getItemName(items[currentIndex]));
}

async function searchSubstitution(name) {
  try {
    await openSearch(name);
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadLists() {
  if (!settings) {
    setStatus("Save your Mealie settings first.", true);
    return;
  }
  setBusy(true);
  try {
    const lists = await getShoppingLists(settings);
    elements.listSelect.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = lists.length ? "Choose a shopping list" : "No shopping lists found";
    elements.listSelect.append(placeholder);
    for (const list of lists) {
      const option = document.createElement("option");
      option.value = list.id;
      option.textContent = list.name || "Untitled list";
      elements.listSelect.append(option);
    }
    if (lists.length === 1) {
      elements.listSelect.value = lists[0].id;
    }
    elements.listSelect.disabled = lists.length === 0;
    elements.startShopping.disabled = !elements.listSelect.value;
    setStatus(lists.length === 1 ? "One list found and selected." : `${lists.length} lists found.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

async function startShopping() {
  const listId = elements.listSelect.value;
  if (!listId) {
    setStatus("Choose a shopping list first.", true);
    return;
  }
  setBusy(true);
  try {
    items = (await getShoppingList(settings, listId)).filter((item) => !item.checked);
    currentIndex = 0;
    if (!items.length) {
      renderCurrentItem();
      return;
    }
    renderCurrentItem();
    await searchCurrentItem();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

async function advanceItem() {
  currentIndex += 1;
  if (currentIndex >= items.length) {
    items = [];
    currentIndex = 0;
    renderCurrentItem();
    return;
  }
  renderCurrentItem();
  await searchCurrentItem();
}

async function markCurrentItem() {
  const item = items[currentIndex];
  if (!item) return;
  setBusy(true);
  try {
    await markShoppingItemChecked(settings, item.id, createCheckedItemUpdate(item));
    setStatus("Item marked as checked in Mealie.");
    await advanceItem();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

async function skipCurrentItem() {
  setBusy(true);
  try {
    await advanceItem();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    setBusy(false);
  }
}

function finishShopping() {
  items = [];
  currentIndex = 0;
  elements.currentItem.hidden = true;
  setStatus("Shopping session ended. Items you skipped remain unchecked.");
}

elements.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const updatedSettings = normalizeSettings({
      mealieUrl: elements.mealieUrl.value,
      apiToken: elements.apiToken.value,
      supermarketName: elements.supermarketName.value,
      searchUrlTemplate: elements.searchTemplate.value,
    });
    const originPattern = `${new URL(updatedSettings.mealieUrl).origin}/*`;
    const granted = await chrome.permissions.request({ origins: [originPattern] });
    if (!granted) {
      throw new Error("Host access was not granted, so the extension cannot connect to Mealie.");
    }
    await chrome.storage.local.set({ settings: updatedSettings });
    settings = updatedSettings;
    elements.settings.open = false;
    setStatus("Settings saved locally.");
    await loadLists();
  } catch (error) {
    setStatus(error.message, true);
  }
});

elements.refreshLists.addEventListener("click", loadLists);
elements.listSelect.addEventListener("change", () => {
  elements.startShopping.disabled = !elements.listSelect.value;
});
elements.startShopping.addEventListener("click", startShopping);
elements.gotIt.addEventListener("click", markCurrentItem);
elements.skipIt.addEventListener("click", skipCurrentItem);
elements.done.addEventListener("click", finishShopping);

const stored = await chrome.storage.local.get("settings");
if (stored.settings) {
  settings = stored.settings;
  elements.mealieUrl.value = settings.mealieUrl;
  elements.apiToken.value = settings.apiToken;
  elements.supermarketName.value = settings.supermarketName;
  elements.searchTemplate.value = settings.searchUrlTemplate;
  elements.settings.open = false;
  await loadLists();
} else {
  elements.settings.open = true;
  setStatus("Configure Mealie and your supermarket to get started.");
}
