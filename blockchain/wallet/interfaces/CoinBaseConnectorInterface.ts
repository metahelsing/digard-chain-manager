import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector } from '@web3-react/core'


export const [coinBaseWallet, hooks] = initializeConnector<CoinbaseWallet>(
  (actions: any) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        appName: 'web3-react',
      },
    })
)