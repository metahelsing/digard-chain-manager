import {useContext} from 'react'
import {DigardChainContext} from "../blockchain/context/DigardChainContext";

export const useDigardChainManager = () => {
  const {digardChainId,
    chainInformation,
    chainManager,
    isValidChain,
    tokenBalances,
    toEtherFormat,
    toWei,
    convertToShortTx} = useContext(DigardChainContext);

  return {digardChainId,
    chainInformation,
    chainManager,
    isValidChain,
    tokenBalances,
    toEtherFormat,
    toWei,
    convertToShortTx}
}

export {default as ChainProvider} from "../blockchain/context/DigardChainContext";
export {default as MetaMaskConnector} from "../blockchain/wallet/MetaMaskConnector";
export {default as WalletConnector} from "../blockchain/wallet/WalletConnector";
export {default as CoinBaseConnector} from "../blockchain/wallet/CoinBaseConnector";