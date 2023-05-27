import React, { useEffect } from "react";
import { metaMask } from './interfaces/MetaMaskConnectorInterface';
//import { toastHelper } from "helper/toastHelper";
import detectEthereumProvider from '@metamask/detect-provider';


export default function MetaMaskConnector() {

    const connect = async () => {
        const provider = await detectEthereumProvider()
        if (provider) {
            metaMask
            .activate()
            .then(() => { })
            .catch((err) => {
                console.log(err);
            });
        } else {
            //Bildirim için bir notification library gerekiyor. Aşağıdaki satır örnek.
            //toastHelper.error('Please install MetaMask!');
        }
    };

    useEffect(() => {
        void metaMask.connectEagerly().catch(() => {
            console.debug('Failed to connect eagerly to metamask')
        })
    }, [])

    return (
        <li>
            <div onClick={connect}><img src="/images/wallet/metamask.svg" alt="Logo" width={50} height={50} />&nbsp;<span className='cs-wallet_text'>Metamask</span></div>
        </li>
    );
}