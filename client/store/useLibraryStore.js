import { defineStore } from 'pinia';
import debounce from 'lodash/debounce';
import bus from '../bus.js';
import { Library } from '../dataTypes.js';
import weightUtils from '../utils/weight.js';

const saveInterval = 1000;

export const useLibraryStore = defineStore('library', {
    state: () => ({
        library: false,
        isSaving: false,
        syncToken: false,
        saveType: null,
        lastSaveData: null,
        loggedIn: false,
        directiveInstances: {},
        globalAlerts: [],
    }),

    getters: {
        activeList(state) {
            if (!state.library || typeof state.library.getListById !== 'function') return null;
            return state.library.getListById(state.library.defaultListId);
        },
    },

    actions: {
        // ── State setters (replaces mutations) ──────────────────────────────
        setSaveType(saveType) {
            this.saveType = saveType;
        },
        setSyncToken(syncToken) {
            this.syncToken = syncToken;
        },
        setLastSaveData(lastSaveData) {
            this.lastSaveData = lastSaveData;
        },
        setIsSaving(isSaving) {
            this.isSaving = isSaving;
        },
        signout() {
            createCookie('lp', '', -1);
            this.library = false;
            this.loggedIn = false;
        },
        setLoggedIn(loggedIn) {
            this.loggedIn = loggedIn;
        },
        loadLibraryData(libraryData) {
            const library = new Library();
            try {
                libraryData = JSON.parse(libraryData);
                library.load(libraryData);
                this.library = library;
            } catch (err) {
                this.globalAlerts.push({ message: 'An error occurred while loading your data.' });
            }
            this.lastSaveData = JSON.stringify(library.save());
        },
        clearLibraryData() {
            this.library = false;
        },
        toggleSidebar() {
            this.library.showSidebar = !this.library.showSidebar;
        },
        setDefaultList(list) {
            this.library.defaultListId = list.id;
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        setTotalUnit(unit) {
            this.library.totalUnit = unit;
        },
        toggleOptionalField(optionalField) {
            this.library.optionalFields[optionalField] = !this.library.optionalFields[optionalField];
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        updateCurrencySymbol(currencySymbol) {
            this.library.currencySymbol = currencySymbol;
        },
        newItem({ category, _isNew }) {
            this.library.newItem({ category, _isNew });
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        newCategory(list) {
            const category = this.library.newCategory({ list, _isNew: true });
            const item = this.library.newItem({ category });
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        newList() {
            if (!this.library) {
                console.error("Library not initialized");
                return;
            }
            const list = this.library.newList();
            const category = this.library.newCategory({ list });
            this.library.newItem({ category });
            list.calculateTotals();
            this.library.defaultListId = list.id;
            this.library.lists = [...this.library.lists];
        },
        removeItem(item) {
            this.library.removeItem(item.id);
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        removeCategory(category) {
            this.library.removeCategory(category.id);
        },
        removeList(list) {
            this.library.removeList(list.id);
        },
        reorderList(args) {
            this.library.lists = arrayMove(this.library.lists, args.before, args.after);
        },
        reorderCategory(args) {
            const list = this.library.getListById(args.list.id);
            list.categoryIds = arrayMove(list.categoryIds, args.before, args.after);
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        reorderItem(args) {
            const item = this.library.getItemById(args.itemId);
            const dropCategory = this.library.getCategoryById(args.categoryId);
            const list = this.library.getListById(args.list.id);
            const originalCategory = this.library.findCategoryWithItemById(item.id, list.id);
            const oldCategoryItem = originalCategory.getCategoryItemById(item.id);
            const oldIndex = originalCategory.categoryItems.indexOf(oldCategoryItem);

            if (originalCategory === dropCategory) {
                dropCategory.categoryItems = arrayMove(dropCategory.categoryItems, oldIndex, args.dropIndex);
            } else {
                originalCategory.categoryItems.splice(oldIndex, 1);
                dropCategory.categoryItems.splice(args.dropIndex, 0, oldCategoryItem);
            }
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        addItemToCategory(args) {
            const item = this.library.getItemById(args.itemId);
            const dropCategory = this.library.getCategoryById(args.categoryId);

            if (item && dropCategory) {
                dropCategory.addItem({ itemId: item.id });
                const categoryItem = dropCategory.getCategoryItemById(item.id);
                const categoryItemIndex = dropCategory.categoryItems.indexOf(categoryItem);
                if (categoryItem && categoryItemIndex !== -1) {
                    dropCategory.categoryItems = arrayMove(dropCategory.categoryItems, categoryItemIndex, args.dropIndex);
                }
                this.library.getListById(this.library.defaultListId).calculateTotals();
            }
        },
        updateListName(updatedList) {
            const list = this.library.getListById(updatedList.id);
            list.name = updatedList.name;
        },
        updateListDescription(updatedList) {
            const list = this.library.getListById(updatedList.id);
            list.description = updatedList.description;
        },
        setExternalId(args) {
            const list = this.library.getListById(args.list.id);
            list.externalId = args.externalId;
        },
        updateCategoryName(updatedCategory) {
            const category = this.library.getCategoryById(updatedCategory.id);
            category.name = updatedCategory.name;
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        updateCategoryColor(updatedCategory) {
            const category = this.library.getCategoryById(updatedCategory.id);
            category.color = updatedCategory.color;
        },
        updateItem(item) {
            this.library.updateItem(item);
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        updateItemLink(args) {
            const item = this.library.getItemById(args.item.id);
            item.url = args.url;
        },
        updateItemImageUrl(args) {
            const item = this.library.getItemById(args.item.id);
            item.imageUrl = args.imageUrl;
            this.library.optionalFields.images = true;
            bus.emit('optionalFieldChanged');
        },
        updateItemImage(args) {
            const item = this.library.getItemById(args.item.id);
            item.image = args.image;
            this.library.optionalFields.images = true;
            bus.emit('optionalFieldChanged');
        },
        updateItemUnit(unit) {
            this.library.itemUnit = unit;
        },
        removeItemImage(updateItem) {
            const item = this.library.getItemById(updateItem.id);
            item.image = '';
        },
        updateCategoryItem(args) {
            args.category.updateCategoryItem(args.categoryItem);
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        removeItemFromCategory(args) {
            args.category.removeItem(args.itemId);
            this.library.getListById(this.library.defaultListId).calculateTotals();
        },
        copyList(listId) {
            const copiedList = this.library.copyList(listId);
            this.library.defaultListId = copiedList.id;
        },
        importCSV(importData) {
            const list = this.library.newList({});
            let category;
            const newCategories = {};
            let item;
            let categoryItem;
            let row;
            let i;

            list.name = importData.name;

            for (i in importData.data) {
                row = importData.data[i];
                if (newCategories[row.category]) {
                    category = newCategories[row.category];
                } else {
                    category = this.library.newCategory({ list });
                    newCategories[row.category] = category;
                }

                item = this.library.newItem({ category, _isNew: false });
                categoryItem = category.getCategoryItemById(item.id);

                item.name = row.name;
                item.description = row.description;
                categoryItem.qty = parseFloat(row.qty);
                item.weight = weightUtils.WeightToMg(parseFloat(row.weight), row.unit);
                item.authorUnit = row.unit;
                category.name = row.category;
            }
            list.calculateTotals();
            this.library.defaultListId = list.id;
        },
        addDirectiveInstance({ key, value }) {
            this.directiveInstances[key] = value;
        },
        removeDirectiveInstance(key) {
            delete this.directiveInstances[key];
        },

        // ── Remote/local data actions ────────────────────────────────────────
        init() {
            if (readCookie('lp')) {
                return this.loadRemote();
            } if (localStorage.library) {
                return this.loadLocal();
            }
            return new Promise((resolve) => {
                this.setLoggedIn(false);
                this.clearLibraryData();
                resolve();
            });
        },
        loadLocal() {
            const libraryData = localStorage.library;
            this.loadLibraryData(libraryData);
            this.setSaveType('local');
            this.setLoggedIn(false);
        },
        loadRemote() {
            return fetchJson('/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
            })
                .then((response) => {
                    this.setSyncToken(response.syncToken);
                    this.loadLibraryData(response.library);
                    this.setSaveType('remote');
                    this.setLoggedIn(response.username);
                })
                .catch((response) => {
                    if (response.status == 401) {
                        bus.emit('unauthorized');
                    } else {
                        return Promise.reject('An error occurred while fetching your data, please try again later.');
                    }
                });
        },

        // ── Save plugin (replaces Vuex plugin) ──────────────────────────────
        initSavePlugin() {
            const debouncedSave = debounce((state) => {
                if (!state.library) return;

                const saveData = JSON.stringify(state.library.save());
                if (saveData === state.lastSaveData) return;

                const saveRemotely = (data) => {
                    if (state.isSaving) {
                        setTimeout(() => debouncedSave(state), saveInterval + 1);
                        return;
                    }

                    this.setIsSaving(true);
                    this.setLastSaveData(data);

                    fetchJson('/saveLibrary/', {
                        method: 'POST',
                        body: JSON.stringify({ syncToken: state.syncToken, username: state.loggedIn, data }),
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                    })
                        .then((response) => {
                            this.setSyncToken(response.syncToken);
                            this.setIsSaving(false);
                        })
                        .catch((response) => {
                            this.setIsSaving(false);
                            let error = 'An error occurred while attempting to save your data.';
                            if (response.json && response.json.status) {
                                error = response.json.status;
                            }
                            if (response.status == 401) {
                                bus.emit('unauthorized', error);
                            } else {
                                alert(error);
                            }
                        });
                };

                if (state.saveType === 'remote') {
                    saveRemotely(saveData);
                } else if (state.saveType === 'local') {
                    localStorage.library = saveData;
                }
            }, saveInterval, { maxWait: saveInterval * 3 });

            this.$subscribe((mutation, state) => {
                const ignore = ['setIsSaving', 'setSaveType', 'setSyncToken', 'setLastSaveData', 'signout', 'setLoggedIn', 'loadLibraryData', 'clearLibraryData'];
                if (mutation.type && ignore.some(name => mutation.type.endsWith(name))) return;
                debouncedSave(state);
            });
        },
    },
});