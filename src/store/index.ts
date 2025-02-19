import { defineStore } from 'pinia';
import { formatAge, getTimestamp } from '@/utils/timeTools';
import moveDecimal from 'move-decimal-point';
import { getIbcChainsAPI, getIbcBaseDenomsAPI } from '@/api/index';
import { API_CODE } from '@/constants/apiCode';
import { getIbcTxsAPI } from '@/api/transfers';
import { getIbcDenomsAPI } from '@/api/home';
import { getDenomKey } from '@/helper/baseDenomHelper';
import { GlobalState } from '@/types/interface/store.interface';
import { IBaseDenom, IResponsePagingData } from '@/types/interface/index.interface';
import { IIbcTx } from '@/types/interface/transfers.interface';
import { IResponseIbcDenom } from '@/types/interface/home.interface';
import { axiosCancel } from '@/utils/axios';

export const useIbcStatisticsChains = defineStore('global', {
    state: (): GlobalState => {
        return {
            ibcChains: {
                all: [],
                active: [],
                inactive: []
            },
            ibcBaseDenoms: [],
            ibcDenoms: [],
            isShowLoading: false,
            isShow500: false,
            ibcTxs: []
        };
    },
    getters: {
        ibcBaseDenomsUniqueKeyMapGetter(): { [key: string]: IBaseDenom } {
            const ibcBaseDenomsUniqueKeyMap: { [key: string]: IBaseDenom } = {};
            this.ibcBaseDenoms.forEach((token: IBaseDenom) => {
                const key = getDenomKey(token.chain_id, token.denom);
                ibcBaseDenomsUniqueKeyMap[key] = token;
            });
            return ibcBaseDenomsUniqueKeyMap;
        },
        ibcBaseDenomsSymbolKeyMapGetter(): { [key: string]: IBaseDenom } {
            const ibcBaseDenomsSymbolKeyMap: { [key: string]: IBaseDenom } = {};
            this.ibcBaseDenoms.forEach((token: IBaseDenom) => {
                ibcBaseDenomsSymbolKeyMap[token.symbol] = token;
            });
            return ibcBaseDenomsSymbolKeyMap;
        },
        ibcDenomsMapGetter(): { [key: string]: IResponseIbcDenom } {
            const ibcDenomsMap: { [key: string]: IResponseIbcDenom } = {};
            this.ibcDenoms.forEach((token: IResponseIbcDenom) => {
                const key = getDenomKey(token.chain_id, token.denom);
                ibcDenomsMap[key] = token;
            });
            return ibcDenomsMap;
        }
    },
    actions: {
        async initStateAction() {
            const promiseArray = [];
            if (this.ibcBaseDenoms.length <= 0) {
                promiseArray.push(this.getIbcBaseDenomsAction);
            }
            if (this.ibcChains.all.length <= 0) {
                promiseArray.push(this.getIbcChainsAction);
            }
            await Promise.all(promiseArray.map((item) => item()));
        },
        async getIbcBaseDenomsAction() {
            try {
                const { code, data } = await getIbcBaseDenomsAPI();
                if (code == API_CODE.success && data && data.items && data.items.length > 0) {
                    this.ibcBaseDenoms = data.items;
                }
            } catch (error) {
                console.log('getIbcBaseDenomsAction', error);
            }
        },
        async getIbcChainsAction(isNeedJudgeShow500 = true) {
            try {
                const { code, data } = await getIbcChainsAPI();
                if (code == API_CODE.success && data && data.items && data.items.length > 0) {
                    this.ibcChains = data.items[0];
                }
            } catch (error) {
                if (isNeedJudgeShow500 === true) {
                    this.isShow500 = true;
                }
                console.log('getIbcChains', error);
            }
        },
        async getIbcDenomsAction() {
            try {
                const { code, data } = await getIbcDenomsAPI();
                if (code === API_CODE.success && data && data.items && data.items.length > 0) {
                    this.ibcDenoms = data.items;
                }
            } catch (error) {
                console.log('getIbcDenomsAPI', error);
            }
        },
        async getIbcTxsAction(queryParams: any, isNeedJudgeShow500 = true) {
            if (queryParams?.date_range) {
                queryParams.date_range = queryParams.date_range?.toString();
            }
            if (queryParams?.status) {
                queryParams.status = queryParams.status?.toString();
            }
            const { use_count } = queryParams;
            try {
                const { code, data } = await getIbcTxsAPI(queryParams);
                if (code === API_CODE.success) {
                    if (use_count) {
                        return data;
                    } else {
                        const result = (data as IResponsePagingData<IIbcTx[]>).items;
                        const promiseArray = [];
                        if (this.ibcDenoms.length <= 0) {
                            console.log('getIbcTxsAction-execute: getIbcDenomsAction');
                            promiseArray.push(this.getIbcDenomsAction);
                        }
                        if (this.ibcBaseDenoms.length <= 0) {
                            console.log('getIbcTxsAction-execute: getIbcBaseDenomsAction');
                            promiseArray.push(this.getIbcBaseDenomsAction);
                        }
                        try {
                            await Promise.all(promiseArray.map((item) => item()));
                        } catch (error) {
                            console.log(
                                'getIbcTxsAction update ibcDenoms or ibcBaseDenoms error',
                                error
                            );
                        }
                        const getSymbolInfo = (data: IIbcTx[]) => {
                            return data.map((item: IIbcTx) => {
                                const symbol =
                                    this.ibcDenomsMapGetter[
                                        getDenomKey(item.sc_chain_id, item.denoms.sc_denom)
                                    ]?.symbol;
                                let symbolNum = item.sc_tx_info?.msg_amount?.amount || 0;
                                let symbolDenom = item.base_denom || '';
                                let symbolIcon = '';
                                if (symbol) {
                                    const baseDenomsObj =
                                        this.ibcBaseDenomsSymbolKeyMapGetter[symbol];
                                    if (baseDenomsObj) {
                                        symbolNum = moveDecimal(
                                            item.sc_tx_info?.msg_amount?.amount || 0,
                                            0 - baseDenomsObj.scale
                                        );
                                        symbolDenom = baseDenomsObj.symbol;
                                        symbolIcon = baseDenomsObj.icon;
                                    }
                                }
                                return {
                                    ...item,
                                    expanded: false,
                                    symbolNum,
                                    symbolDenom,
                                    symbolIcon,
                                    parseTime: formatAge(
                                        getTimestamp(),
                                        item.tx_time * 1000,
                                        '',
                                        ''
                                    )
                                };
                            });
                        };
                        return getSymbolInfo(result);
                    }
                }
            } catch (error) {
                if (!axiosCancel(error)) {
                    if (isNeedJudgeShow500 === true) {
                        this.isShow500 = true;
                    }
                }
                console.log('getIbcTxsAPI', error);
                throw error;
            }
        }
    }
});
