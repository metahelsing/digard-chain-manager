import React from 'react'
import {useDigardChainManager, MetaMaskConnector, WalletConnector, CoinBaseConnector} from "digard-chain-manager";
const App = () => {
  const {tokenBalances} = useDigardChainManager();
  return <>
    <ul className="cs-list cs-style1 cs-mp0">
        <MetaMaskConnector/>
        <WalletConnector/>
        <CoinBaseConnector/>
    </ul>
    {(tokenBalances && (
        <p>{tokenBalances[0].balanceFormat}</p>
    ))}
   
  </>
}

export default App
