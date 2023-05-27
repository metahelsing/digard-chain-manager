export interface WatchTokenBalance {
    token: string,
    balance: string,
    balanceFormat: string,
    decimals: number
}

export interface TokenBalanceChange {
    from: string,
    to: string,
    token: string,
    value: string,
    isSum: boolean
}