<script setup>
import { onMounted, ref } from "vue";

const lists = ref([]);
const saving = ref(false);
const selectedListIdx = ref(0);
const newListName = ref("");
const newItem = ref("");
const newItemQuantity = ref(1);
const loading = ref(true);
const showDropdown = ref(false);

const initialLoad = ref(true);

async function fetchLists() {
  loading.value = true;
  try {
    const data = await $fetch("/api/lists");
    console.error("Fetched lists:", data);

    if (Array.isArray(data) && data.length > 0) {
      lists.value = data.map(list => ({
        name: list.name,
        items: list.items.map(ensureItemFormat),
      }));
    }
    else if (initialLoad.value) {
      lists.value = [{ name: "Main List", items: [] }];
      await saveLists();
    }
    initialLoad.value = false;
  }
  catch (error) {
    console.error("Error fetching lists:", error);
    if (lists.value.length === 0) {
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
    const plainLists = JSON.parse(JSON.stringify(lists.value));
    plainLists.forEach((list) => {
      list.items = list.items.map(ensureItemFormat);
    });
    console.error("Saving lists:", plainLists);

    const response = await $fetch("/api/lists", {
      method: "POST",
      body: plainLists,
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

// Helper function to ensure all items are in the correct format
function ensureItemFormat(item) {
  if (typeof item === "string") {
    return { name: item, quantity: 1, checked: false };
  }
  return {
    name: item.name || "Unnamed Item",
    quantity: item.quantity || 1,
    checked: item.checked || false,
  };
}
</script>

<template>
  <div class="flex flex-col items-center min-h-screen">
    <!-- Header with spacing -->
    <div class="w-full pt-6">
      <div class="sticky top-4 w-full z-20">
        <div class="max-w-4xl mx-auto px-4 flex flex-col items-center gap-4">
          <div class="flex items-center gap-4">
            <h1 class="font-bold text-2xl text-(--ui-primary)">
              Shopping Lists
            </h1>
            <span v-if="saving" class="text-sm text-gray-500">
              Saving...
            </span>
          </div>
          <div v-if="loading">
            Loading...
          </div>
          <div v-else>
            <!-- List Selector Dropdown -->
            <div class="relative dropdown-container w-64">
              <button
                class="w-full px-4 py-2 rounded border border-gray-300 flex items-center justify-between bg-white"
                @click.stop="showDropdown = !showDropdown"
              >
                <span>{{ lists[selectedListIdx]?.name || 'Select List' }}</span>
                <span class="text-gray-500">▼</span>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="showDropdown"
                class="absolute top-full mt-1 w-full border border-gray-300 rounded bg-white z-10"
              >
                <div v-for="(list, idx) in lists" :key="list.name">
                  <div class="flex items-center justify-between px-4 py-2 hover:bg-gray-50 border-b border-gray-200">
                    <button
                      class="px-2 text-gray-500"
                      title="Reorder list"
                    >
                      ≡
                    </button>
                    <button
                      class="flex-grow text-center"
                      @click="selectList(idx); showDropdown = false"
                    >
                      {{ list.name }}
                    </button>
                    <button
                      v-if="lists.length > 1"
                      class="px-2 text-red-500"
                      title="Delete list"
                      @click="removeList(idx)"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <!-- Add List Form -->
                <form class="flex gap-1 p-2 border-t border-gray-200" @submit.prevent="addList">
                  <input
                    v-model="newListName"
                    type="text"
                    placeholder="New list"
                    class="flex-grow border border-gray-300 rounded px-2 py-1"
                  >
                  <button type="submit" class="bg-blue-500 text-white px-3 py-1 rounded">
                    +
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-1 w-full max-w-4xl px-4 pb-6">
          <div v-if="lists[selectedListIdx]" class="flex flex-col items-center">
            <form class="flex gap-2 w-full max-w-lg" @submit.prevent="addItem">
              <input
                v-model="newItem"
                type="text"
                placeholder="Add an item"
                class="flex-1 border rounded px-2 py-1"
              >
              <input
                v-model.number="newItemQuantity"
                type="number"
                min="1"
                class="border rounded px-2 py-1 w-20"
              >
              <button type="submit" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                Add
              </button>
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
                  <div class="flex items-center border rounded">
                    <button
                      class="px-2 py-1 hover:bg-gray-100"
                      @click="updateQuantity(idx, -1)"
                    >
                      -
                    </button>
                    <span class="px-2">{{ typeof item === 'string' ? 1 : item.quantity }}</span>
                    <button
                      class="px-2 py-1 hover:bg-gray-100"
                      @click="updateQuantity(idx, 1)"
                    >
                      +
                    </button>
                  </div>
                  <button
                    class="text-red-500 hover:underline"
                    @click="removeItem(idx)"
                  >
                    Remove
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
