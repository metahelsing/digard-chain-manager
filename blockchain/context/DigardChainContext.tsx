import { ethers } from 'ethers';
import { hooks as metaMaskHooks, metaMask } from '../wallet/interfaces/MetaMaskConnectorInterface';
import { hooks as walletConnectHooks, walletConnect } from '../wallet/interfaces/WalletConnectConnectorInterface';
import { hooks as coinBaseHooks, coinBaseWallet} from '../wallet/interfaces/CoinBaseConnectorInterface';
import { Web3ReactHooks, Web3ReactProvider, useWeb3React } from '@web3-react/core';
import { TokenBalanceChange, WatchTokenBalance } from '../dto/WatchTokenBalance';
import React, { ReactNode, createContext, useEffect, useState } from 'react';
import { DigardChainInformation, DigardChainManager, DigardUtils } from '../DigardChainManager';
import { MetaMask } from "@web3-react/metamask";
import { CoinbaseWallet } from "@web3-react/coinbase-wallet";
import { WalletConnect } from '@web3-react/walletconnect';

type DigardChainContextType = {
  digardChainId: number;
  chainInformation: DigardChainInformation;
  chainManager: DigardChainManager;
  isValidChain: boolean;
  tokenBalances: Array<WatchTokenBalance>;
  toEtherFormat: (inputVal: any, decimals: number, formatFixed: number) => string;
  toWei: (inputVal: any, decimals: number) => BigInt;
  convertToShortTx: (val: string, firstCharLength: number) => string;
};

type Props = {
  children: ReactNode;
  digardChainId: number;
  chainConfig: any;
  watchTokenAssets: Array<string> | null;
};

const defaults: DigardChainContextType = {
  digardChainId: 1,
  chainInformation: {
    "chainId": "0x1",
    "chainName": "Ethereum",
    "nativeCurrency": {
      "name": "Ether",
      "symbol": "ETH",
      "decimals": 18
    },
    "rpcUrls": ["https://mainnet.infura.io/v3/"],
    "blockExplorerUrls": ["https://etherscan.io"]
  },
  chainManager: new DigardChainManager("chainConfig", 1),
  isValidChain: false,
  tokenBalances: [],
  toEtherFormat: (inputVal: any, decimals: number, formatFixed: number) => {
    inputVal = inputVal;
    decimals = decimals;
    formatFixed = formatFixed;
    return "";
  },
  toWei: (inputVal: any, decimals: number) => {
    inputVal = inputVal;
    decimals = decimals;
    return BigInt(0);
  },
  convertToShortTx: (val: string, firstCharLength: number) => {
    val = val;
    firstCharLength = firstCharLength;
    return "";
  }
};
export const DigardChainContext = createContext<DigardChainContextType>(defaults);

const DigardChainContextProvider: React.FC<Props> = ({ children, digardChainId, chainConfig, watchTokenAssets }: Props) => {

  const { account, chainId, provider } = useWeb3React();
  const [chainManager, setChainManager] = useState<DigardChainManager>(defaults.chainManager);
  const [isValidChain, setIsValidChain] = useState<boolean>(false);
  const [balanceChanged, setBalanceChanged] = useState<TokenBalanceChange>();
  const [tokenBalances, setTokenBalances] = useState<Array<WatchTokenBalance>>([]);
  const [chainInformation, setChainInformation] = useState<DigardChainInformation>(defaults.chainInformation);
  const { toEtherFormat, toWei, getDigardChainInformationConfig, convertToShortTx } = DigardUtils();

  const watchTokenBalance = async (tokenContractName: string) => {
    
    const tokenContract = await chainManager.contractWs(tokenContractName);
    if (account && tokenContract) {
     
      const tokenFilter = {
        address: tokenContract.address,
        topics: [
          ethers.utils.id('Transfer(address,address,uint256)'),
          ethers.utils.hexZeroPad(account, 32),
          ethers.utils.hexZeroPad(account, 32),
        ],
      };

      await tokenContract.contractOnEventListener(tokenFilter, (from, to, value) => {
        if (to == account) {
          setBalanceChanged({from: from, to: to, token: tokenContractName, value: value.toString(), isSum: true });
        }
        else setBalanceChanged({from: from, to: to, token: tokenContractName, value: value.toString(), isSum: false });
      });
    }

  }

  const getWatchingTokenBalance = async (tokenName: string) => {
    let _tokenBalance: WatchTokenBalance = { token: tokenName, balance: "0", balanceFormat: "0", decimals: 0 };
    if (tokenBalances.length > 0) {
      const tokenBalanceFind = tokenBalances.find(f => f.token == tokenName);
      if (tokenBalanceFind != null) {
        _tokenBalance = tokenBalanceFind;
      }
    }

    let contractInstance = await chainManager.contract(tokenName, false);
    if (contractInstance && account) {
      _tokenBalance.decimals = await contractInstance.getDecimals();
      _tokenBalance.balance = await contractInstance.getTokenBalance(account, false);
      _tokenBalance.balanceFormat = toEtherFormat(BigInt(_tokenBalance.balance), _tokenBalance.decimals, 3);
      return _tokenBalance;

    }
    return null;
  }

  const initWatchingTokenBalances = async () => {
    if (watchTokenAssets) {
      watchTokenAssets.forEach(async (tokenName) => {
        const _tokenBalance = await getWatchingTokenBalance(tokenName);
        if (_tokenBalance) {
          setTokenBalances((prev) => [...prev, _tokenBalance]);
          watchTokenBalance(tokenName);
        }

      });
    }
  }

  useEffect(() => {
    if (balanceChanged) {
      getWatchingTokenBalance(balanceChanged.token).then((_tokenBalance) => {
        if (_tokenBalance) {

          if (balanceChanged.isSum) _tokenBalance.balance = (BigInt(_tokenBalance.balance) + BigInt(balanceChanged.value)).toString();
          if (!balanceChanged.isSum) _tokenBalance.balance = (BigInt(_tokenBalance.balance) - BigInt(balanceChanged.value)).toString();
          _tokenBalance.balanceFormat = toEtherFormat(_tokenBalance.balance, _tokenBalance.decimals, 3);
          setTokenBalances((prev) => [...prev, _tokenBalance]);
        }
      });

    }
  }, [balanceChanged]);

  useEffect(() => {
    if (provider) {
      const _chainInformation = getDigardChainInformationConfig(digardChainId);
      if (_chainInformation) {
        setChainInformation(_chainInformation);
      }

      const _digardChainManager = new DigardChainManager(chainConfig, digardChainId);
      _digardChainManager.setProvider(provider);
      setChainManager(_digardChainManager);
    }


  }, [provider]);

  useEffect(() => {
    if (chainId) {
      const result = chainId == digardChainId;
      setIsValidChain(result);
    }
  }, [chainId]);

  useEffect(() => {
    if (account && isValidChain && chainManager) {
      if (watchTokenAssets) {
        initWatchingTokenBalances();
      }
    }
  }, [account, isValidChain, chainManager]);

  const values = {
    digardChainId: digardChainId,
    chainInformation: chainInformation,
    chainManager: chainManager,
    isValidChain: isValidChain,
    tokenBalances: tokenBalances,
    toEtherFormat: toEtherFormat,
    toWei: toWei,
    convertToShortTx: convertToShortTx
  };
  const connectors: [MetaMask | WalletConnect | CoinbaseWallet, Web3ReactHooks][] = [
    [metaMask, metaMaskHooks],
    [walletConnect, walletConnectHooks],
    [coinBaseWallet, coinBaseHooks]
  ];
  return (
    <Web3ReactProvider connectors={connectors}>
      <DigardChainContext.Provider value={values}>
        {children}
      </DigardChainContext.Provider>
    </Web3ReactProvider>

  );
};

export default DigardChainContextProvider;
