import {
  createCheckedItemUpdate,
  createSearchUrl,
  getItemPresentation,
  getSubstitutions,
  normalizeSettings,
  shouldCelebrateCompletion,
} from "./core.js";
import {
  getShoppingList,
  getShoppingLists,
  markShoppingItemChecked,
} from "./mealie-api.js";
import {
  restoreShoppingListSelection,
  saveLastShoppingListId,
} from "./list-preference.js";
import { chooseRandomBackground, DEFAULT_BACKGROUND_THEME } from "./backgrounds.js";
import { requestMealieOriginAccess } from "./permissions.js";
import { navigateSearchTab } from "./search-tab.js";

const background = chooseRandomBackground();
const backgroundLayer = document.querySelector("#background-image");
backgroundLayer.style.setProperty(
  "--panel-background-image",
  `url("${background.imageUrl}")`,
);
const attribution = document.querySelector("#background-attribution");
attribution.append("Background photo (", document.createTextNode(DEFAULT_BACKGROUND_THEME), ") from ");
const unsplashLink = document.createElement("a");
unsplashLink.href = "https://unsplash.com";
unsplashLink.target = "_blank";
unsplashLink.rel = "noopener noreferrer";
unsplashLink.textContent = "Unsplash";
const sourceLink = document.createElement("a");
sourceLink.href = background.imageUrl;
sourceLink.target = "_blank";
sourceLink.rel = "noopener noreferrer";
sourceLink.textContent = "Photo source";
attribution.append(unsplashLink, " · ", sourceLink);

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
let activeListId = "";
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

const TICKER_TAPE_COLORS = ["#f5c542", "#ef6f6c", "#69c7b5", "#9d87d5", "#f28e4b"];

function celebrateBackground() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  backgroundLayer.classList.remove("celebrating");
  backgroundLayer.replaceChildren();
  for (let index = 0; index < 18; index += 1) {
    const tape = document.createElement("span");
    tape.className = "ticker-tape";
    tape.style.left = `${(index * 67 + 8) % 100}%`;
    tape.style.setProperty("--tape-color", TICKER_TAPE_COLORS[index % TICKER_TAPE_COLORS.length]);
    tape.style.setProperty("--tape-width", `${7 + (index % 3) * 3}px`);
    tape.style.setProperty("--tape-height", `${18 + (index % 4) * 5}px`);
    tape.style.setProperty("--tape-delay", `${(index % 5) * 30}ms`);
    tape.style.setProperty("--start-rotation", `${(index % 2 ? 1 : -1) * (12 + (index % 4) * 11)}deg`);
    tape.style.setProperty("--middle-rotation", `${(index % 2 ? -1 : 1) * (35 + (index % 3) * 25)}deg`);
    tape.style.setProperty("--end-rotation", `${(index % 2 ? 1 : -1) * (90 + (index % 5) * 47)}deg`);
    tape.style.setProperty("--middle-drift", `${(index % 2 ? 1 : -1) * (12 + (index % 4) * 9)}px`);
    tape.style.setProperty("--end-drift", `${(index % 2 ? -1 : 1) * (30 + (index % 5) * 18)}px`);
    backgroundLayer.append(tape);
  }
  void backgroundLayer.offsetWidth;
  backgroundLayer.classList.add("celebrating");
}

backgroundLayer.addEventListener("animationend", (event) => {
  if (event.animationName === "ticker-tape-rise" && event.target instanceof HTMLElement) {
    event.target.remove();
  }
  if (!backgroundLayer.querySelector(".ticker-tape")) {
    backgroundLayer.classList.remove("celebrating");
  }
});

async function openSearch(query) {
  const url = createSearchUrl(settings.searchUrlTemplate, query);
  await navigateSearchTab(chrome.tabs, chrome.storage.session, url);
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
  const presentation = getItemPresentation(item);
  elements.itemName.textContent = presentation.name;
  elements.itemDetails.textContent = presentation.details;
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
  await openSearch(getItemPresentation(items[currentIndex]).name);
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
    elements.listSelect.value = await restoreShoppingListSelection(
      chrome.storage.local,
      lists,
    );
    elements.listSelect.disabled = lists.length === 0;
    elements.startShopping.disabled = !elements.listSelect.value;
    setStatus(
      lists.length === 1 && elements.listSelect.value
        ? "One list found and selected."
        : `${lists.length} lists found.`,
    );
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
    activeListId = "";
    items = (await getShoppingList(settings, listId)).filter((item) => !item.checked);
    activeListId = listId;
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
    const completedListId = activeListId;
    activeListId = "";
    if (!completedListId) return;

    const fullList = await getShoppingList(settings, completedListId);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (shouldCelebrateCompletion(fullList, true, prefersReducedMotion)) {
      setStatus("Shopping list complete. Nice work!");
      celebrateBackground();
    }
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
  activeListId = "";
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
    await requestMealieOriginAccess(
      chrome.permissions,
      updatedSettings.mealieUrl,
      settings?.mealieUrl,
    );
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
elements.listSelect.addEventListener("change", async () => {
  elements.startShopping.disabled = !elements.listSelect.value;
  try {
    await saveLastShoppingListId(chrome.storage.local, elements.listSelect.value);
  } catch (error) {
    setStatus(error.message, true);
  }
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
