import './css/lighterpack.scss';
import './utils/utils.js';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import mitt from 'mitt';
import bus from './bus.js';

import RootApp from './RootApp.vue';
import { useLibraryStore } from './store/useLibraryStore.js';
import routes from './routes';
import { selectOnFocus, focusOnCreate, focusOnBus, selectOnBus, emptyIfZero, clickOutside } from './utils/focus.js';

window.bus = mitt();
window.router = createRouter({
    history: createWebHistory(),
    routes,
});

bus.on('unauthorized', () => {
    window.location = '/signin';
});

const pinia = createPinia();

// Initialize store and app
const app = createApp(RootApp);
app.use(pinia);
app.use(window.router);

const store = useLibraryStore();
store.initSavePlugin();

store.init()
    .then(() => initLighterPack())
    .catch(() => {
        if (!store.library) {
            window.router.push('/welcome');
        }
        initLighterPack();
    });

var initLighterPack = function () {
    app.directive('select-on-focus', selectOnFocus);
    app.directive('focus-on-create', focusOnCreate);
    app.directive('focus-on-bus', focusOnBus);
    app.directive('select-on-bus', selectOnBus);
    app.directive('empty-if-zero', emptyIfZero);
    app.directive('click-outside', clickOutside);
    app.mount('#lp');
    window.LighterPack = app;
};