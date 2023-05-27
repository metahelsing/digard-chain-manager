import { ethers } from "ethers";
import { Contract, ContractInterface } from "@ethersproject/contracts";
import { Web3Provider, WebSocketProvider } from "@ethersproject/providers";
import DigardChainInformationFile from "./configs/chainInformationConfig.json";
import { Injected } from "./wallet/InjectedConnectors";
import type { Connector } from '@web3-react/types';

export interface DigardChainCurrency {
    name: string;
    symbol: string;
    decimals: number
}
export interface DigardChainInformation {
    chainId: string;
    chainName: string;
    nativeCurrency: DigardChainCurrency;
    rpcUrls: Array<string>,
    blockExplorerUrls: Array<string>
}

export interface DigardChainConfig {
    chainId: number;
    wssRPCUrl?: string;
    contracts: DigardContractConfig[];
}
export interface DigardContractConfig {
    name: string;
    address: string;
    abi: any;
}
export const DigardChainUrls: { [chainId: string]: string[] } = Object.keys(DigardChainInformationFile).reduce<{ [chainId: string]: string[] }>(
    (accumulator, chainId) => {
      
      const validURLs: string[] = DigardChainInformationFile[chainId].rpcUrls
  
      if (validURLs.length) {
        accumulator[chainId] = validURLs
      }
  
      return accumulator
    },
    {}
);
export const DigardUtils = () => {
    const toFixed = (x: any) => {
        if (Math.abs(x) < 1.0) {
            var e = parseInt(x.toString().split('e-')[1]);
            if (e) {
                x *= Math.pow(10, e - 1);
                x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
            }
        } else {
            var e = parseInt(x.toString().split('+')[1]);
            if (e > 20) {
                e -= 20;
                x /= Math.pow(10, e);
                x += (new Array(e + 1)).join('0');
            }
        }
        return x;
    }
    const toEtherFormat = (inputVal: any, decimals: number, formatFixed: number): string => {
        try {
            inputVal = ethers.utils.formatUnits(inputVal, decimals);
            inputVal = Number(inputVal);
            if (Number.isInteger(inputVal)) {
                return inputVal.toLocaleString();
            }
            return inputVal.toFixed(formatFixed).toLocaleString();
        } catch (ex) {
            return "0";
        }
    }

    const toWei = (inputVal: any, decimals: number = 18): BigInt => {
        let priceWei = Number(inputVal) * 10 ** decimals;
        priceWei = toFixed(priceWei);
        return BigInt(priceWei);
    }
    const getDigardChainInformationConfig = (chainId: number): DigardChainInformation | null => {
        let rtn: { [chainId: number]: DigardChainInformation } = DigardChainInformationFile;
        try {
            if (rtn) {
                let _DigardChainInformationConfig: DigardChainInformation = rtn[chainId];
                return _DigardChainInformationConfig;
            }
        } catch (ex) {
            console.log("--findDigardChainInformationConfig: " + ex);
        }
        return null;
    }

    const convertToShortTx = (val: string, firstCharLength: number=2): string => {
        if (!val)
          return "";
        
        const first2 = val.substring(0, firstCharLength);
        const lastCharacter = (firstCharLength-2);
        const last4 = val.slice((val.length - lastCharacter), val.length);
        return `${first2}...${last4}`
    }
    return { getDigardChainInformationConfig, toEtherFormat, toWei, convertToShortTx };
}
export class DigardChainManager {
    public chainId: number;
    public chainInformation: DigardChainInformation;
    private _provider:  Web3Provider | ethers.providers.WebSocketProvider;
    private _formatFixed: number;
    private _decimals: number;
    private _chainConfig: DigardChainConfig | undefined;
   
    private async _findDigardChainConfig(digardChainConfigFile: DigardChainConfig[]): Promise<DigardChainConfig | undefined> {
        let rtn: DigardChainConfig[] = digardChainConfigFile;
        try {
            if (rtn) {
                this._chainConfig = rtn.find((f: DigardChainConfig) => f.chainId == this.chainId);
                return this._chainConfig;
            }

        } catch (ex) {
            console.log("_findDigardChainConfig: " + ex);
        }

        return undefined;
    }
    
    constructor(chainConfig: any, chainId: number, formatFixed: number = 3, decimals: number = 18) {
        const {getDigardChainInformationConfig} = DigardUtils();
        this.chainId = chainId;
        this._formatFixed = formatFixed;
        this._decimals = decimals;
        this._findDigardChainConfig(chainConfig);
        const _chainInformation = getDigardChainInformationConfig(chainId);
        if(_chainInformation) {
            this.chainInformation = _chainInformation;
        }
        
    }
    createWebSocketProvider(): ethers.providers.WebSocketProvider | null {
        if(this._chainConfig) {
            if (this._chainConfig.wssRPCUrl) {
                return new ethers.providers.WebSocketProvider(this._chainConfig.wssRPCUrl);
            }
        }
        console.log("--No Chain WSSRPC");
        return null;
    }
    setProvider(provider: Web3Provider | ethers.providers.WebSocketProvider | undefined) {
        if(provider) {
            this._provider = provider;
        }
        
    };
    async contract(name: string, signer: boolean = false): Promise<DigardContract | null> {
        if(this._chainConfig){
            const contractConfig = this._chainConfig.contracts.find((f: DigardContractConfig) => f.name == name);
            if (!contractConfig) return null;
            let _signerOrProvider:ethers.Signer | ethers.providers.Provider; 
            if(signer){
                _signerOrProvider = this._provider.getSigner().connectUnchecked();
            }
            else _signerOrProvider = this._provider;
            
            let signerOrProvider:ethers.Signer | ethers.providers.Provider = _signerOrProvider as ethers.Signer | ethers.providers.Provider;
            const contract = new DigardContract(contractConfig.address, contractConfig.abi, signerOrProvider);
            contract.setProvider(this._provider);
            return contract;
        }
        return null;
    }
    async contractWs(name:string) {
        if(this._chainConfig){
            const contractConfig = this._chainConfig.contracts.find((f: DigardContractConfig) => f.name == name);
            if (!contractConfig) return null;
            const wsProvider = this.createWebSocketProvider();
            if(wsProvider) {
                return new DigardContract(contractConfig.address, contractConfig.abi, wsProvider);
            }
        }
        return null;
    }
    async balanceCompare(compareWei: BigInt): Promise<boolean> {
        const signer = this._provider.getSigner();
        const signerAddress: string = await signer.getAddress();
        let balanceBigInt = await this._provider.getBalance(signerAddress);
      
        return (Number(balanceBigInt) >= Number(compareWei));
    }
    async getBalance(): Promise<string> {
        const signer = this._provider.getSigner();
        const signerAddress: string = await signer.getAddress();
        let balanceBigInt = await this._provider.getBalance(signerAddress);
        const { toEtherFormat } = DigardUtils();
        return toEtherFormat(balanceBigInt, this._decimals, this._formatFixed);
    }
    isCorrectChain(chainId: number): boolean {
        return chainId == this.chainId;
    }
    async addChain(chainId?: number): Promise<void> {
        let __chainId = this.chainId;
        if (chainId) __chainId = chainId;
        const {getDigardChainInformationConfig} = DigardUtils();
        const chainInformation = getDigardChainInformationConfig(__chainId);
        if (!chainInformation) return;
        try {
            await this._provider.send("wallet_addEthereumChain", [chainInformation]);
        } catch (ex) {
            console.log("--addChain: " + ex);
        }
    }
    async switchChain(connector: Connector, chainId?: number): Promise<void> {
        let __chainId = this.chainId;
        if (chainId) __chainId = chainId;
        try {
            const isAuthorized = await Injected.isAuthorized();
            if (isAuthorized) {
                try {
                    await connector.activate(__chainId);
                } catch (switchError) {
                    if (switchError.code === 4902) await this.addChain();
                    else console.log(`Cannot connect wallet with unknown code.`);
                }
            }
        } catch (ex) {
            console.log(`SwitchChain error.`);
        }
    }
    createScanTxLink(txCode: string): string {
        return `${this.chainInformation.blockExplorerUrls[0]}/tx/${txCode}`;
    }
    
}

export class DigardContract extends Contract {
    private _decimals: number = 0;
    private _symbol: string = "";
    private _provider: Web3Provider | WebSocketProvider;
    public address:string;
    
    constructor(addressOrName: string, contractInterface: ContractInterface, signerOrProvider?: ethers.Signer | ethers.providers.Provider) {
        
        super(addressOrName, contractInterface, signerOrProvider);

    }
    setProvider(provider: Web3Provider | WebSocketProvider) {
        this._provider = provider;
    }
    async getDecimals(): Promise<number> {
        if (this._decimals == 0) {
            return await this.decimals();
        }
        return await this._decimals;
    }
    async getSymbol(): Promise<string> {
        if (!this._symbol) {
            return await this.symbol();
        }
        return await this._symbol;
    }
    
    async getTokenBalance(balanceAddress: string | null, isFormat: boolean = true): Promise<string> {
        if (balanceAddress === undefined) {
            balanceAddress = null; 
        }
        if (!this._provider) {
            console.log("--getTokenBalance: Not find provider");
            return "";
        }

        const { toEtherFormat } = DigardUtils();
        const decimals = await this.getDecimals();
        if (!balanceAddress) {
            const signer = this._provider.getSigner();
            balanceAddress = await signer.getAddress();
        }
        const tokenBalance = await this.balanceOf(balanceAddress);
        if(tokenBalance){
            if(isFormat) return toEtherFormat(tokenBalance, decimals, 3);
            return tokenBalance.toString();
        }
        return "";
    }
    async addToken(tokenImage: string): Promise<void> {
        if (!this._provider) {
            console.log("--addToken: Not find provider");
            return;
        }
        const tokenAddress = this.address;
        const tokenSymbol = await this.getSymbol();
        try {
            await this._provider.send("wallet_watchAsset", [{
                type: 'ERC20',
                options: {
                    address: tokenAddress,
                    symbol: tokenSymbol,
                    decimals: 18,
                    image: tokenImage,
                }
            }]);
        } catch (ex) {
            console.log("--addToken: " + ex);
        }
    }
   

    async contractOnEventListener(eventName: string | ethers.EventFilter, callBack: (...args: Array<any>) => void): Promise<any> {
        this.on(eventName, callBack);
    }

    async contractLastHistoryEvent(eventName: string, args?: Array<any>): Promise<any | null> {
        let eventFilter = this.filters[eventName](args);
            if (eventFilter) {
                const logs = await this.queryFilter(eventFilter, this._provider.blockNumber-10000, 'latest');
                if (logs.length > 0) {
                    const lastIndex = logs.length-1;
                    return logs[lastIndex].args;
                }

            }
    }
}