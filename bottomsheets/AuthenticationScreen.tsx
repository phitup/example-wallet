import 'fast-text-encoding';
import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Button} from 'react-native-paper';
import {
  AuthorizeDappCompleteResponse,
  AuthorizeDappRequest,
  MWARequestFailReason,
  resolve,
} from '@solana-mobile/mobile-wallet-adapter-walletlib';

import {useWallet} from '../components/WalletProvider';
import MWABottomsheetHeader from '../components/MWABottomsheetHeader';
import {
  VerificationInProgress,
  VerificationState,
} from '../utils/ClientTrustUseCase';
import {useClientTrust} from '../components/ClientTrustProvider';

interface AuthenticationScreenProps {
  request: AuthorizeDappRequest;
}

export default function AuthenticationScreen({
  request,
}: AuthenticationScreenProps) {
  const {wallet} = useWallet();
  const {clientTrustUseCase} = useClientTrust();
  const [verificationState, setVerificationState] = useState<
    VerificationState | undefined
  >(undefined);

  // We should always have an available keypair here.
  if (!wallet) {
    throw new Error('Wallet is null or undefined');
  }

  useEffect(() => {
    const verifyClient = async () => {
      const verificationState =
        await clientTrustUseCase?.verifyAuthorizationSource(
          request.appIdentity?.identityUri,
        );
      setVerificationState(verificationState);
    };

    verifyClient();
  }, []);

  return (
    <View>
      <MWABottomsheetHeader
        title={'Authorize Dapp'}
        cluster={request.chain}
        appIdentity={request.appIdentity}
        verificationState={verificationState ?? new VerificationInProgress('')}
      />
      <View style={styles.buttonGroup}>
        <Button
          style={styles.actionButton}
          onPress={() => {
            resolve(request, {
              accounts: [
                {
                  publicKey: wallet.publicKey.toBytes(),
                  accountLabel: 'JamboApp',
                  icon: 'data:text/plain;base64',
                  chains: ['solana:devnet', 'solana:testnet'],
                  features: ['solana:signTransactions'],
                },
              ],
              authorizationScope: [97, 112, 112],
            } as AuthorizeDappCompleteResponse);
          }}
          mode="contained">
          Authorize
        </Button>
        <Button
          style={styles.actionButton}
          onPress={() => {
            resolve(request, {failReason: MWARequestFailReason.UserDeclined});
          }}
          mode="outlined">
          Decline
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    marginEnd: 8,
  },
});
