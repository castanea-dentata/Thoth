import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import mitt from 'mitt';
import bus from './bus.js';

import RootApp from './RootApp.vue';
import store from './store/store';
import routes from './routes';
import { selectOnFocus, focusOnCreate, focusOnBus, selectOnBus, emptyIfZero, clickOutside } from './utils/focus.js'; // ← ADD

const dataTypes = require('./dataTypes.js'); // ← REMOVE the focusDirectives require line
const utils = require('./utils/utils.js');

const { Item, Category, List, Library } = dataTypes;

window.bus = mitt();
window.router = createRouter({
    history: createWebHistory(),
    routes,
});

bus.on('unauthorized', () => {
    window.location = '/signin';
});

store.dispatch('init')
    .then(() => initLighterPack())
    .catch(() => {
        if (!store.state.library) {
            window.router.push('/welcome');
        }
        initLighterPack();
    });

var initLighterPack = function () {
    const app = createApp(RootApp);
    app.use(store);
    app.use(window.router);
    app.directive('select-on-focus', selectOnFocus);   // ← ADD
    app.directive('focus-on-create', focusOnCreate);   // ← ADD
    app.directive('focus-on-bus', focusOnBus);         // ← ADD
    app.directive('select-on-bus', selectOnBus);       // ← ADD
    app.directive('empty-if-zero', emptyIfZero);       // ← ADD
    app.directive('click-outside', clickOutside);      // ← ADD
    app.mount('#lp');
    window.LighterPack = app;
};