<style lang="scss">
@use "../css/_globals" as *;

</style>

<template>
    <Popover :shown="shown" @mouseenter="show" @mouseleave="startHideTimeout">
        <template #target>
            <slot name="target" />
        </template>
        <template #content>
            <slot name="content" />
        </template>
    </Popover>
</template>

<script>
import Popover from './popover.vue';

export default {
    name: 'PopoverHover',
    components: {
        Popover,
    },
    data() {
        return {
            shown: false,
            hideTimeout: null,
        };
    },
    methods: {
        show() {
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
                this.hideTimeout = null;
            }
            this.shown = true;
            this.$emit('shown');
        },
        startHideTimeout() {
            this.hideTimeout = setTimeout(this.hide, 50);
        },
        hide() {
            this.shown = false;
            this.$emit('hidden');
        },
    },
};
</script>
