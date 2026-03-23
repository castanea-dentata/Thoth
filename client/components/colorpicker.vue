<style lang="scss">

</style>

<template>
    <Popover id="lpPickerContainer" :shown="shown" @hide="shown = false">
        <template #target>
            <span class="lpLegend" :style="{'background-color': color}" @click="shown = true" />
        </template>
        <template #content>
            <input type="color" :value="color" @input="onColorChange($event.target.value)">
        </template>
    </Popover>
</template>

<script>
import Popover from './popover.vue';

export default {
    name: 'ColorPicker',
    components: {
        Popover,
    },
    props: ['color'],
    data() {
        return {
            shown: false,
        };
    },
    methods: {
        onColorChange(newColor) {
            this.$emit('colorChange', newColor);
        },
    },
};
</script>