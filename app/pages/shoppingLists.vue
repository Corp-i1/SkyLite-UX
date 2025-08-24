<<<<<<< Updated upstream
<template>
  <div class="flex flex-col items-center justify-center gap-4 h-screen">
    <h1 class="font-bold text-2xl text-(--ui-primary)">
      Shopping Lists
    </h1>

    <div class="flex items-center gap-2">
      <UButton
        label="Documentation"
        icon="i-lucide-square-play"
        to="https://ui.nuxt.com/getting-started/installation/nuxt"
        target="_blank"
      />

      <UButton
        label="GitHub"
        color="neutral"
        variant="outline"
        icon="i-simple-icons-github"
        to="https://github.com/nuxt/ui"
        target="_blank"
      />
=======
<script setup>
import { onMounted, ref } from "vue";

// Helper function to ensure all items are in the correct format

const lists = ref([]);
const saving = ref(false);
const selectedListIdx = ref(0);
const newListName = ref("");
const newItem = ref("");
const newItemQuantity = ref(1);
const loading = ref(true);
const showDropdown = ref(false);
const showCategoryDropdown = ref(false);
const newCategory = ref("");
const categories = ref(["Default"]);

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
      category: categories.value[0], // Use first category (Default)
    };
    console.error("Adding new item:", newItemObj);
    lists.value[selectedListIdx.value].items.push(newItemObj);
    newItem.value = "";
    newItemQuantity.value = 1;
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
  <div class="min-h-screen flex items-start justify-center" style="padding-top: 33vh;">
    <!-- Main Container -->
    <div class="w-full max-w-2xl px-4">
      <div class="flex flex-col items-center gap-6">
        <!-- Title and Status -->
        <div class="flex items-center gap-4">
          <h1 class="font-bold text-2xl text-(--ui-primary)">
            Shopping Lists
          </h1>
          <span v-if="saving" class="text-sm text-gray-500">
            Saving...
          </span>
        </div>

        <div v-if="loading" class="text-gray-500">
          Loading...
        </div>

        <div v-else class="w-full flex flex-col items-center gap-6">
          <!-- List Selector Dropdown -->
          <div class="relative dropdown-container w-64">
            <button
              class="w-full px-4 py-2 rounded border border-gray-300 bg-gray-800 flex items-center justify-between"
              @click.stop="showDropdown = !showDropdown"
            >
              <span>{{ lists[selectedListIdx]?.name || 'Select List' }}</span>
              <span class="text-gray-500">▼</span>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="showDropdown"
              class="absolute top-full mt-1 w-full border border-gray-700 rounded bg-gray-800 z-10 shadow-md"
            >
              <div v-for="(list, idx) in lists" :key="list.name">
                <div class="flex items-center justify-between px-4 py-2 hover:bg-gray-700 border-b border-gray-700">
                  <button
                    class="px-2 text-gray-300"
                    title="Reorder list"
                  >
                    ≡
                  </button>
                  <button
                    class="flex-grow text-center text-white"
                    @click="selectList(idx); showDropdown = false"
                  >
                    {{ list.name }}
                  </button>
                  <button
                    v-if="lists.length > 1"
                    class="px-2 text-red-400 hover:text-red-300"
                    title="Delete list"
                    @click="removeList(idx)"
                  >
                    ×
                  </button>
                </div>
              </div>

              <!-- Add List Form -->
              <form class="flex gap-1 p-2 border-t border-gray-700 bg-gray-800" @submit.prevent="addList">
                <input
                  v-model="newListName"
                  type="text"
                  placeholder="New list"
                  class="flex-grow border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white placeholder-gray-400"
                >
                <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500">
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
                  class="px-4 py-2 rounded border border-gray-300 bg-gray-800 flex items-center justify-between w-full"
                  @click.stop="showCategoryDropdown = !showCategoryDropdown"
                >
                  <span class="text-white">Manage Categories</span>
                  <span class="text-gray-500">▼</span>
                </button>
                <div
                  v-if="showCategoryDropdown"
                  class="absolute top-full mt-1 w-full border border-gray-700 rounded bg-gray-800 z-10 shadow-md"
                >
                  <div class="p-2">
                    
                    <div
                      v-for="cat in categories"
                      :key="cat"
                      class="flex justify-between items-center px-2 py-1 text-white"
                    >
                      {{ cat }}
                      <button
                        v-if="cat !== 'Default'"
                        class="text-red-400 hover:text-red-300"
                        @click="removeCategory(cat)"
                      >
                        ×
                      </button>
                      
                    </div>
                    <form class="flex py-1" @submit.prevent="addCategory">
                      <input
                        v-model="newCategory"
                        type="text"
                        placeholder="New category"
                        class="flex-grow border border-gray-600 rounded px-2 py-1 bg-gray-700 text-white placeholder-gray-400"
                      >
                      <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500">
                        +
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Item Form -->
            <form class="flex gap-2 w-full max-w-lg" @submit.prevent="addItem">
              <input
                v-model="newItem"
                type="text"
                placeholder="Add an item"
                class="flex-1 border rounded px-2 py-1"
              >
              <div class="flex items-center border rounded">
                <button
                  type="button"
                  class="px-2 py-1 hover:bg-gray-800"
                  tabindex="-1"
                  @click="newItemQuantity = Math.max(1, Number(newItemQuantity) - 1)"
                >
                  -
                </button>
                <span class="px-2">{{ newItemQuantity }}</span>
                <button
                  type="button"
                  class="px-2 py-1 hover:bg-gray-800"
                  tabindex="-1"
                  @click="newItemQuantity = Number(newItemQuantity) + 1"
                >
                  +
                </button>
                <button type="submit" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                  Add
                </button>
              </div>
            </form>

            <ul class="w-full max-w-lg mt-4">
              <li
                v-for="(item, idx) in lists[selectedListIdx].items"
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
                    class="border rounded bg-gray-800 text-white px-2 py-1"
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
                  <div class="flex items-center border rounded">
                    <button
                      class="px-2 py-1 hover:bg-gray-800"
                      @click="updateQuantity(idx, -1)"
                    >
                      -
                    </button>
                    <span class="px-2">{{ typeof item === 'string' ? 1 : item.quantity }}</span>
                    <button
                      class="px-2 py-1 hover:bg-gray-800"
                      @click="updateQuantity(idx, 1)"
                    >
                      +
                    </button>
                  </div>

                  <button
                    class="text-red-500 hover:text-red-600"
                    @click="removeItem(idx)"
                  >
                    X
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
>>>>>>> Stashed changes
    </div>
  </div>
</template>
