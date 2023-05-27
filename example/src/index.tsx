import './index.css'

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import DigardChainConfig from './configs/chainConfig.json';
import {ChainProvider} from "digard-chain-manager";

ReactDOM.render(
    <ChainProvider chainConfig={DigardChainConfig} watchTokenAssets={["ELDAToken"]}>
        <App />
    </ChainProvider>
   
, document.getElementById('root'))
