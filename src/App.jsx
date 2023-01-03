import React , {useEffect, useState} from "react";
// import Snowfetti from "react-snowfetti";
import { ethers } from "ethers";

import './App.css';
import abi from './utils/wavePortal.json';

const getEthereumObject = () => window.ethereum;

const findMetaMaskAccount = async () => {
  try {
    const ethereum = getEthereumObject();

    /*
    * First make sure we have access to the Ethereum object.
    */
    if (!ethereum) {
      console.error("Make sure you have Metamask!");
      return null;
    }

    console.log("We have the Ethereum object", ethereum);
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      return account;
    } else {
      console.error("No authorized account found");
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [btnState, setBtnState] = useState(false);
  const [allWaves, setAllWaves] = useState([]);
  const [msg, setMsg] = useState("");

  // const contractAddress = "0x8D1182924934f1e5950223d6dd92674d07E2cbE2"
  // const contractAddress = "0x69ad4F1232355f22aB1ad2e04C3239DaD9Ca456c"
  const contractAddress = "0x2E28A0E32c40dE71a5bcf790F274f6533f90cf20"
  const contractABI = abi.abi;

  const getAllWaves = async () =>{
    try{
      const {ethereum} = window;
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();
        console.log(waves);
        let wavesCleaned = waves.map(wave =>{
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp*1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      }else{
        console.log("Ethereum object doesn't exist!!");
      }
    } catch (error){
      console.log(error);
    }
  };

  useEffect(()=>{
    let wavePortalContract;

    const onNewWave= (from, timestamp, message) =>{
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState=>[
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp* 1000),
          message: message,
        },
      ]);
    };

    if(window.ethereum){
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
    return () => {
      if(wavePortalContract){
        wavePortalContract.off("NewWave", onNewWave);
      }
    }
  },[]);

  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      getAllWaves();
    } catch (error) {
      console.error(error);
    }
  };

  const wave = async () =>{
    try {
      setBtnState(true);
      const {ethereum} = window;
      
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        
        const waveTxn = await wavePortalContract.wave(msg, {gasLimit: 300000});
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        
      } else {
        console.log("ethereum object doesn't exist...");
      }
    } catch (error) {
      console.log(error);
    } finally{
      setBtnState(false);
      setMsg("");
    }
  };
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        Hello!! 👋🏻
        </div>

        <div className="bio">
        </div>
        {currentAccount ?<>
          <lable>Enter message: 
          <input className="waveMsg" type="text" value={msg} onChange={(e)=>{setMsg(e.target.value)}}/>
          </lable>
        <button className="waveButton" onClick={wave} disabled={btnState}>
          {btnState ? 
          <>Waving</> 
          : <>Wanna Wave?</>}
        </button>
            </>
        : <button className="waveButton" onClick={connectWallet}>
            Connect Wallet to Wave!
          </button>}
        {allWaves.map((wave,index)=>{
      return (
        <div key={index} style = {{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px", borderRadius: "15em 50em 30em 5em" }}>
          <div><strong>Message:</strong> {wave.message}</div>
          <div><strong>Address:</strong> {wave.address}</div>
          <div><strong>Time:</strong> {wave.timestamp.toString()}</div>
        </div>
      )
        })}
      </div>
    </div>
  );
}
