<script setup>
import { onMounted, ref } from "vue";

// Helper function to ensure all items are in the correct format

const lists = ref([]);
const saving = ref(false);
const selectedListIdx = ref(0);
const newListName = ref("");
const newItem = ref("");
const newItemQuantity = ref(1);
const newItemCategory = ref("Default");
const loading = ref(true);
const showDropdown = ref(false);
const showCategoryDropdown = ref(false);
const newCategory = ref("");
const categories = ref(["Default"]);
const selectedSortCategory = ref(""); // Empty string means show all

const initialLoad = ref(true);

async function fetchLists() {
  loading.value = true;
  try {
    const data = await $fetch("/api/lists");
    console.error("Fetched lists:", data);

    if (data.categories && Array.isArray(data.lists)) {
      categories.value = data.categories;
      lists.value = data.lists;
    }
    else if (initialLoad.value) {
      categories.value = ["Default"];
      lists.value = [{ name: "Main List", items: [] }];
      await saveLists();
    }
    initialLoad.value = false;
  }
  catch (error) {
    console.error("Error fetching lists:", error);
    if (lists.value.length === 0) {
      categories.value = ["Default"];
      lists.value = [{ name: "Main List", items: [] }];
    }
  }
  finally {
    loading.value = false;
  }
}

async function saveLists() {
  saving.value = true;
  try {
    // Convert the proxy to a plain object and ensure proper item format
    const data = {
      categories: [...categories.value],
      lists: JSON.parse(JSON.stringify(lists.value)).map(list => ({
        ...list,
        items: list.items.map(ensureItemFormat),
      })),
    };
    console.error("Saving data:", data);

    const response = await $fetch("/api/lists", {
      method: "POST",
      body: data,
    });
    console.error("Save response:", response);
  }
  catch (error) {
    console.error("Error saving lists:", error);
  }
  finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await fetchLists();

  // Add click handler to close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const dropdown = document.querySelector(".dropdown-container");
    if (dropdown && !dropdown.contains(e.target)) {
      showDropdown.value = false;
    }
  });
});

async function addList() {
  const name = newListName.value.trim();
  if (name && !lists.value.some(l => l.name === name)) {
    lists.value.push({ name, items: [] });
    selectedListIdx.value = lists.value.length - 1;
    newListName.value = "";
    await saveLists();
  }
}

function selectList(idx) {
  selectedListIdx.value = idx;
}

async function addItem() {
  const itemName = newItem.value.trim();
  if (itemName && lists.value[selectedListIdx.value]) {
    const newItemObj = {
      name: itemName,
      quantity: Number.parseInt(newItemQuantity.value) || 1,
      checked: false,
      category: newItemCategory.value,
    };
    console.error("Adding new item:", newItemObj);
    lists.value[selectedListIdx.value].items.push(newItemObj);
    newItem.value = "";
    newItemQuantity.value = 1;
    // Don't reset category - keep the last selected one for convenience
    await saveLists();
  }
}

async function toggleItem(idx) {
  const item = lists.value[selectedListIdx.value].items[idx];
  item.checked = !item.checked;
  await saveLists();
}

async function updateQuantity(idx, amount) {
  const item = lists.value[selectedListIdx.value].items[idx];
  item.quantity = Math.max(1, item.quantity + amount);
  await saveLists();
}

async function updateCategory(idx, category) {
  const item = lists.value[selectedListIdx.value].items[idx];
  item.category = category;
  await saveLists();
}

async function removeItem(idx) {
  lists.value[selectedListIdx.value].items.splice(idx, 1);
  await saveLists();
}

async function removeList(idx) {
  lists.value.splice(idx, 1);
  if (selectedListIdx.value >= lists.value.length) {
    selectedListIdx.value = lists.value.length - 1;
  }
  await saveLists();
}

async function addCategory() {
  const category = newCategory.value.trim();
  if (category && !categories.value.includes(category)) {
    categories.value.push(category);
    newCategory.value = "";
  }
}

function removeCategory(category) {
  if (category !== "Default") {
    const idx = categories.value.indexOf(category);
    if (idx !== -1) {
      categories.value.splice(idx, 1);
      // Update any items using this category to use "Default"
      lists.value.forEach((list) => {
        list.items.forEach((item) => {
          if (item.category === category) {
            item.category = "Default";
          }
        });
      });
      saveLists();
    }
  }
}

function ensureItemFormat(item) {
  if (typeof item === "string") {
    return {
      name: item,
      quantity: 1,
      checked: false,
      category: "Default",
    };
  }
  return {
    name: item.name || "Unnamed Item",
    quantity: item.quantity || 1,
    checked: item.checked || false,
    category: item.category || "Default",
  };
}
</script>

<template>
  <div
    class="min-h-screen flex justify-center"
    :class="{
      'items-center': loading || (lists.length === 0),
      'items-start pt-24': !loading && lists.length > 0,
    }"
  >
    <div class="w-full max-w-2xl px-2 sm:px-4">
      <div class="flex flex-col items-center gap-4 sm:gap-6">
        <!-- Title and Status -->
        <div class="flex items-center gap-2 sm:gap-4">
          <h1 class="font-bold text-xl sm:text-2xl text-(--ui-primary)">
            Shopping Lists
          </h1>
          <span v-if="saving" class="text-xs sm:text-sm text-gray-500">
            Saving...
          </span>
        </div>

        <div v-if="loading" class="text-gray-500 text-lg animate-pulse">
          Loading...
        </div>

        <div v-else-if="!lists.length" class="text-gray-500 text-lg text-center">
          <p>No shopping lists yet.</p>
        </div>

        <div v-else class="w-full flex flex-col items-center gap-6">
          <div class="relative dropdown-container w-full sm:w-64">
            <!-- Flex container for dropdown and refresh button -->
            <div class="flex items-center w-full gap-2 mt-2">
              <!-- List Selector Dropdown -->
              <button
                class="w-full px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm sm:text-base"
                @click.stop="showDropdown = !showDropdown"
              >
                <span>{{ lists[selectedListIdx]?.name || 'Select List' }}</span>
                <span class="text-gray-500">▼</span>
              </button>
              <!-- Refresh Button -->
              <button
                class="ml-auto px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 flex items-center gap-1 text-sm sm:text-base"
                title="Refresh lists"
                :disabled="loading"
                @click="fetchLists"
              >
                <svg
                  v-if="loading"
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l5-5-5-5v4A10 10 0 002 12h2z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 4v5h.582M20 20v-5h-.581M5.21 17.293A9 9 0 1112 21a9 9 0 01-6.79-3.707"
                  />
                </svg>
                <span class="hidden sm:inline">Refresh</span>
              </button>
            </div>

            <!-- Dropdown Menu -->
            <div
              v-if="showDropdown"
              class="absolute top-full mt-1 w-full border rounded z-20 shadow-md bg-gray-50 dark:bg-gray-800"
            >
              <div v-for="(list, idx) in lists" :key="list.name">
                <div class="flex items-center justify-between px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 border-b dark:border-gray-700">
                  <button
                    class="px-2 dark:text-gray-200"
                    title="Reorder list"
                  >
                    ≡
                  </button>
                  <button
                    class="flex-grow text-center dark:text-gray-200"
                    @click="selectList(idx); showDropdown = false"
                  >
                    {{ list.name }}
                  </button>
                  <button
                    v-if="lists.length > 1"
                    class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white"
                    title="Delete list"
                    @click="removeList(idx)"
                  >
                    ✕
                  </button>
                </div>
              </div>

                <!-- Add List Form -->
                <form
                class="flex gap-1 p-1 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b"
                @submit.prevent="addList"
                >
                <input
                  v-model="newListName"
                  type="text"
                  placeholder="New list"
                  class="flex-grow border rounded px-1 py-1"
                >
                <button
                  type="submit"
                  class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                >
                  +
                </button>
                </form>
            </div>
          </div>

          <!-- Shopping List Content -->
          <div v-if="lists[selectedListIdx]" class="w-full flex flex-col items-center gap-4">
            <!-- Category Management -->
            <div class="flex gap-2 w-full max-w-lg mb-2">
              <div class="relative dropdown-container flex-1">
                <button
                  class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 flex items-center justify-between w-full"
                  @click.stop="showCategoryDropdown = !showCategoryDropdown"
                >
                  <span>{{ selectedSortCategory || 'All Categories' }}</span>
                  <span>▼</span>
                </button>
                <div
                  v-if="showCategoryDropdown"
                  class="absolute top-full mt-1 w-full border rounded z-10 shadow-md bg-gray-50 dark:bg-gray-800"
                >
                  <div class="p-2">
                    <!-- Clear filter button -->
                    <button
                      class="w-full mb-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2"
                      @click="selectedSortCategory = ''"
                    >
                      <span>✕</span>
                      <span>Clear Filter</span>
                    </button>
                    <div class="border-t dark:border-gray-700 mb-2" />
                    <div
                      v-for="cat in categories"
                      :key="cat"
                      class="flex justify-between items-center px-2 py-1 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                      @click="selectedSortCategory = cat === selectedSortCategory ? '' : cat"
                    >
                      <div class="flex items-center gap-2">
                        <span v-if="cat === selectedSortCategory">●</span>
                        <span v-else>○</span>
                        {{ cat }}
                      </div>
                      <button
                        v-if="cat !== 'Default'"
                        class="w-6 h-6 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white"
                        @click.stop="removeCategory(cat)"
                      >
                        ✕
                      </button>
                    </div>
                    <form class="flex py-1" @submit.prevent="addCategory">
                      <input
                        v-model="newCategory"
                        type="text"
                        placeholder="New category"
                        class="flex-grow border rounded px-2 py-1"
                      >
                      <button type="submit" class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                        +
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Item Form -->
            <form class="flex flex-wrap sm:flex-nowrap gap-2 w-full max-w-lg" @submit.prevent="addItem">
              <input
                v-model="newItem"
                type="text"
                placeholder="Add an item"
                class="flex-1 min-w-[200px] rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
              >
              <div class="flex items-center">
                <button
                  type="button"
                  class="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center rounded-l-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm sm:text-base"
                  tabindex="-1"
                  @click="newItemQuantity = Math.max(1, Number(newItemQuantity) - 1)"
                >
                  -
                </button>
                <span class="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm sm:text-base border-t border-b border-gray-200 dark:border-gray-700">{{ newItemQuantity }}</span>
                <button
                  type="button"
                  class="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center rounded-r-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm sm:text-base"
                  tabindex="-1"
                  @click="newItemQuantity = Number(newItemQuantity) + 1"
                >
                  +
                </button>
              </div>
              <select
                v-model="newItemCategory"
                class="border rounded px-2 py-1 text-sm sm:text-base dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 min-w-[100px]"
                title="Category"
              >
                <option
                  v-for="cat in categories"
                  :key="cat"
                  :value="cat"
                >
                  {{ cat }}
                </option>
              </select>
              <button
                type="submit"
                class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-sm sm:text-base"
              >
                Add
              </button>
            </form>
          </div>

          <ul class="w-full max-w-lg mt-4">
            <li
              v-for="(item, idx) in lists[selectedListIdx].items.filter(
                item => !selectedSortCategory || item.category === selectedSortCategory,
              )"
              :key="idx"
              class="flex justify-between items-center border-b py-2"
            >
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  :checked="item.checked"
                  class="w-4 h-4"
                  @change="toggleItem(idx)"
                >
                <span :class="{ 'line-through text-gray-400': item.checked }">
                  {{ typeof item === 'string' ? item : item.name }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <!-- Category Dropdown -->
                <select
                  :value="item.category"
                  class="border rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                  @change="updateCategory(idx, $event.target.value)"
                >
                  <option
                    v-for="cat in categories"
                    :key="cat"
                    :value="cat"
                  >
                    {{ cat }}
                  </option>
                </select>

                <!-- Quantity Control -->
                <div class="flex items-center">
                  <button
                    class="w-8 h-8 flex items-center justify-center rounded-l-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                    @click="updateQuantity(idx, -1)"
                  >
                    -
                  </button>
                  <span class="w-8 h-8 flex items-center justify-center text-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-t border-b border-gray-200 dark:border-gray-700">{{ typeof item === 'string' ? 1 : item.quantity }}</span>
                  <button
                    class="w-8 h-8 flex items-center justify-center rounded-r-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                    @click="updateQuantity(idx, 1)"
                  >
                    +
                  </button>
                </div>

                <button
                  class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white"
                  @click="removeItem(idx)"
                >
                  ✕
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
