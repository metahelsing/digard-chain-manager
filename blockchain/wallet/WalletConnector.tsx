import React, {useEffect} from "react";
import { URI_AVAILABLE } from '@web3-react/walletconnect'
import { walletConnect } from './interfaces/WalletConnectConnectorInterface';
export default function WalletConnectConnector(){
    
    const connect = () => {
      walletConnect
      .activate()
      .then(() => {

      })
      .catch((ex)=> {
        console.log(ex);
      });
    };
    
    useEffect(() => {
      walletConnect.events.on(URI_AVAILABLE, (uri: string) => {
        console.log(`uri: ${uri}`)
      });

      walletConnect.connectEagerly().catch(() => {
        console.debug('Failed to connect eagerly to walletconnect')
      })
    }, []);
  
    return (
      <li>
        <div onClick={connect}><img src="/images/wallet/walletconnect.svg" alt="Logo" width={50} height={50} />&nbsp;<span className='cs-wallet_text'>WalletConnect</span></div>
      </li>
    )
}