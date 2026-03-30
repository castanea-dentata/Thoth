<style lang="scss">
@use "../css/_globals" as *;

.lpGlobalAlerts {
    background: $yellow1;
    border: 1px solid $darkYellow;
    border-radius: 0 0 10px 10px;
    border-top: none;
    left: 50%;
    margin: 0;
    padding: 0;
    position: fixed;
    text-align: center;
    top: 0;
    transform: translateX(-50%);
    width: 50%;
    z-index: $aboveDialog;
}

.lpGlobalAlert {
    border-bottom: 1px solid $darkYellow;
    list-style-type: none;
    margin: 0;
    padding: $spacingMedium;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:last-child {
        border-bottom: none;
    }
}

.lpAlertDismiss {
    cursor: pointer;
    font-size: 14px;
    margin-left: $spacingMedium;
    opacity: 0.6;

    &:hover {
        opacity: 1;
    }
}
</style>

<template>
    <ul v-if="alerts && alerts.length" class="lpGlobalAlerts">
        <li v-for="(alert, index) in alerts" :key="index" class="lpGlobalAlert">
            {{ alert.message }}
            <a class="lpAlertDismiss" @click="dismiss(index)">✕</a>
        </li>
    </ul>
</template>

<script>
import { useLibraryStore } from '../store/useLibraryStore.js';

export default {
    name: 'GlobalAlerts',
    computed: {
        store() {
            return useLibraryStore();
        },
        alerts() {
            return this.store.globalAlerts;
        },
    },
    methods: {
        dismiss(index) {
            this.store.globalAlerts.splice(index, 1);
        },
    },
};
</script>
