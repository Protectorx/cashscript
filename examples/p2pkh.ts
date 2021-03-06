import { BITBOX } from 'bitbox-sdk';
import { TxnDetailsResult } from 'bitcoin-com-rest';
import { Contract, Sig } from 'cashscript';
import path from 'path';

run();
async function run(): Promise<void> {
  // Initialise BITBOX
  const network = 'testnet';
  const bitbox = new BITBOX({ restURL: 'https://trest.bitcoin.com/v2/' });

  // Initialise HD node and alice's keypair
  const rootSeed = bitbox.Mnemonic.toSeed('CashScript');
  const hdNode = bitbox.HDNode.fromSeed(rootSeed, network);
  const alice = bitbox.HDNode.toKeyPair(bitbox.HDNode.derive(hdNode, 0));

  // Derive alice's public key and public key hash
  const alicePk = bitbox.ECPair.toPublicKey(alice);
  const alicePkh = bitbox.Crypto.hash160(alicePk);

  // Compile the P2PKH Cash Contract
  const P2PKH = Contract.compile(path.join(__dirname, 'p2pkh.cash'), network);

  // Instantiate a new P2PKH contract with constructor arguments: { pkh: alicePkh }
  const instance = P2PKH.new(alicePkh);

  // Get contract balance & output address + balance
  const contractBalance = await instance.getBalance();
  console.log('contract address:', instance.address);
  console.log('contract balance:', contractBalance);

  // Call the spend function with alice's signature + pk
  // And use it to send 0. 000 100 00 BCH back to the contract's address
  const tx = await instance.functions
    .spend(alicePk, new Sig(alice))
    .to(instance.address, 10000)
    .send();
  console.log('transaction details:', tx);

  // Call the spend function with alice's signature + pk
  // And use it to send two outputs of 0. 000 150 00 BCH back to the contract's address
  const tx2: TxnDetailsResult = await instance.functions
    .spend(alicePk, new Sig(alice))
    .to(instance.address, 15000)
    .to(instance.address, 15000)
    .send();
  console.log('transaction details:', tx2);
}
