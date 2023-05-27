import React, { useContext, useEffect, useState } from "react";
import { initializeConnector } from "@web3-react/core";
import { CoinbaseWallet } from "@web3-react/coinbase-wallet";
import {DigardChainContext} from "../context/DigardChainContext";
export default function WalletConnectConnector() {
    
    const { chainInformation } = useContext(DigardChainContext);
    const [coinbaseWallet, setCoinbaseWallet] = useState<CoinbaseWallet>();
    const connect = () => {
        if(coinbaseWallet){
          coinbaseWallet
          .activate()
          .then(() => {})
          .catch(()=> {});
        }
        
      };
      
      useEffect(() => {
        if(chainInformation) {
          
          const [_coinbaseWallet] = initializeConnector<CoinbaseWallet>(
            (actions: any) =>
              new CoinbaseWallet({
                  actions,
                  options: {
                    url: chainInformation.rpcUrls[0],
                    appName: 'web3-react',
                  },
              })
          );
          setCoinbaseWallet(_coinbaseWallet);
    
          _coinbaseWallet.connectEagerly().catch(() => {
            console.debug('Failed to connect eagerly to walletconnect')
          })
        }
       
      }, [chainInformation]);

    return (
        <li>
            <div onClick={connect}><img src="/images/wallet/coinbase.svg" alt="Logo" width={35} height={35} style={{ "margin": "10px" }} />&nbsp;<span className='cs-wallet_text'>CoinBase</span></div>
        </li>
    )
}