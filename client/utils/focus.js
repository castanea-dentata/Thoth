import uniqueId from 'lodash/uniqueId';
import store from '../store/store.js';
import bus from '../bus.js';

export const selectOnFocus = {
    mounted(el) {
        el.addEventListener('focus', () => {
            el.select();
        });
    },
};

export const focusOnCreate = {
    mounted(el, binding) {
        if (binding.expression && binding.value || !binding.expression) {
            el.focus();
        }
    },
};

export const focusOnBus = {
    mounted(el, binding) {
        bus.on(binding.value, () => {
            el.focus();
        });
    },
};

export const selectOnBus = {
    mounted(el, binding) {
        bus.on(binding.value, () => {
            el.select();
        });
    },
};

export const emptyIfZero = {
    mounted(el) {
        el.addEventListener('focus', () => {
            if (el.value === '0' || el.value === '0.00') {
                el.dataset.originalValue = el.value;
                el.value = '';
            }
        });
        el.addEventListener('blur', () => {
            if (el.value === '') {
                el.value = el.dataset.originalValue || '0';
            }
        });
    },
};

export const clickOutside = {
    mounted(el, binding) {
        const handler = (evt) => {
            if (el.contains(evt.target)) return;
            if (binding && typeof binding.value === 'function') {
                binding.value();
            }
        };
        window.addEventListener('click', handler);
        el.dataset.clickoutside = uniqueId();
        store.commit('addDirectiveInstance', { key: el.dataset.clickoutside, value: handler });
    },
    unmounted(el) {
        const handler = store.state.directiveInstances[el.dataset.clickoutside];
        store.commit('removeDirectiveInstance', el.dataset.clickoutside);
        window.removeEventListener('click', handler);
    },
};