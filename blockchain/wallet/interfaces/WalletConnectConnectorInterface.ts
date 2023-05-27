import { initializeConnector } from '@web3-react/core'
import { WalletConnect } from '@web3-react/walletconnect'
import { DigardChainUrls } from "../../DigardChainManager";

export const [walletConnect, hooks] = initializeConnector<WalletConnect>(
  (actions: any) => 
    new WalletConnect({
      actions,
      options: {
        rpc: DigardChainUrls,
      },
    })
  
  
    
);