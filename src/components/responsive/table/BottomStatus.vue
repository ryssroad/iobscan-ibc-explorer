<template>
    <div class="status_container">
        <div class="flex justify-between items-center flex-wrap status_container__content">
            <div>{{ type }} Status: </div>
            <div class="flex status_content">
                <div class="flex items-center ml-16">
                    <img
                        :src="activeImgInfo.src"
                        :width="activeImgInfo.width"
                        :height="activeImgInfo.height"
                        class="mr-4"
                    />
                    <div>{{
                        type === BottomStatusType.CHANNEL
                            ? CHANNEL_STATUS.OPEN
                            : RELAYER_STATUS.RUNNING
                    }}</div>
                </div>
                <div class="flex items-center ml-24">
                    <img
                        :src="inActiveImgInfo.src"
                        :width="inActiveImgInfo.width"
                        :height="inActiveImgInfo.height"
                        class="mr-4"
                    />
                    <div>{{
                        type === BottomStatusType.CHANNEL
                            ? CHANNEL_STATUS.CLOSED
                            : RELAYER_STATUS.UNKNOWN
                    }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { BottomStatusType, TBottomStatus } from '@/types/interface/components/table.interface';
    import { RELAYER_STATUS } from '@/constants/relayers';
    import { CHANNEL_STATUS } from '../../../constants/channels';

    interface IProps {
        type: TBottomStatus; // 目前支持 channels 和 relayers
    }

    const props = defineProps<IProps>();

    const activeImgInfo = computed(() => {
        if (props.type === BottomStatusType.CHANNEL) {
            return {
                src: new URL('../../../assets/channels/open.png', import.meta.url).href,
                height: 16,
                width: 46
            };
        } else {
            return {
                src: new URL('../../../assets/relayers/running.png', import.meta.url).href,
                height: 18.5,
                width: 18.5
            };
        }
    });

    const inActiveImgInfo = computed(() => {
        if (props.type === BottomStatusType.CHANNEL) {
            return {
                src: new URL('../../../assets/channels/closed.png', import.meta.url).href,
                height: 16,
                width: 46
            };
        } else {
            return {
                src: new URL('../../../assets/relayers/stopped.png', import.meta.url).href,
                height: 18.5,
                width: 18.5
            };
        }
    });
</script>

<style lang="less" scoped>
    .status_container {
        background: #f8f9fc;
        border-radius: 14px;
        line-height: 28px;
        color: var(--bj-text-third);
        padding: 0 16px 0 8px;
        display: inline-block;

        .icon {
            height: 20px;
            width: 20px;
            margin: 0 5px 0 24px;
            background: salmon;
            border-radius: 50%;
        }
    }

    @media screen and (max-width: 530px) {
        .status_container {
            line-height: 20px;
            padding: 8px 16px 8px 8px;
        }
    }
    @media screen and (max-width: 402px) {
        .status_container {
            &__content {
                flex-direction: column;
                align-items: flex-start;
                .status_content {
                    margin-top: 8px;
                }
            }
        }
    }
</style>
