import React, { useEffect, useState } from 'react';
import { utils } from 'ethers';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useAsyncEffect } from '../../hooks';
import { ReefSigner, Token } from '../../state';
import {
  toReefEVMAddressWithNotification,
  DataProgress,
  DataWithProgress,
  getData,
  getProgress,
  toBalance,
  trim,
} from '../../utils';
import { IconButton } from '../common/Button';
import {
  CenterRow,
  FlexColumn,
  FlexRow,
  FullRow,
  Margin,
  MS,
} from '../common/Display';
import { CopyIcon, DownIcon, TokenIcon } from '../common/Icons';
import { Input } from '../common/Input';
import { List, ListEmptyItem, ListItemActionModal } from '../common/List';
import { Loading } from '../common/Loading';
import {
  Modal, ModalBody, ModalClose, ModalHeader,
} from '../common/Modal';
import {
  LeadText, MiniText, MutedText, Text, Title,
} from '../common/Text';
import { QuestionTooltip } from '../common/Tooltip';
import { loadToken } from '../../rpc';
import { closeModal, openModal } from '../../utils/modalUtil';

interface SelectToken {
  id: string;
  iconUrl: string;
  fullWidth?: boolean;
  selectedTokenName: string;
  tokens: Token[];
  onTokenSelect: (newToken: Token) => void;
  onAddressChange?: (address: string) => Promise<void>;
  hideCommonBaseView?: boolean;
  signer: ReefSigner;
}

const COMMON_BASES = ['0x0000000000000000000000000000000001000000'];

export const SelectToken = ({
  id = 'exampleModal',
  tokens,
  selectedTokenName,
  onTokenSelect,
  fullWidth = false,
  iconUrl,
  onAddressChange,
  hideCommonBaseView,
  signer,
}: SelectToken): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [foundSearchTokens, setFoundSearchTokens] = useState<
    DataWithProgress<Token[]>
  >([...tokens]);

  const isEmpty = selectedTokenName === 'Select token';

  const handleSelectToken = (token): void => {
    closeModal(id);
    onTokenSelect(token);
    setSelectedToken(token);
  };

  useEffect(() => {
    if (!signer) {
      return;
    }
    async function searchTokens(): Promise<void> {
      let tokenSearchRes = [...tokens].filter(
        (token) => (token.address.toLowerCase().startsWith(address.toLowerCase())
        || token.name.toLowerCase().startsWith(address.toLowerCase())
        || token.symbol.toLowerCase().startsWith(address.toLowerCase())),
      );
      if (!tokenSearchRes.length && utils.isAddress(address)) {
        setFoundSearchTokens(DataProgress.LOADING);
        const contractToken: Token | null = await loadToken(
          address,
          signer.signer,
        );
        if (contractToken) {
          tokenSearchRes = [contractToken];
        } else {
          console.log('searchTokens contract not found addr=', address);
        }
      }
      setFoundSearchTokens(tokenSearchRes);
    }

    searchTokens();
  }, [address, tokens]);

  const tokensView = getData(foundSearchTokens)?.map((token) => (
    <ListItemActionModal
      key={token.address}
      onClick={() => handleSelectToken(token)}
    >
      <FullRow>
        <CenterRow>
          <TokenIcon
            src={token.iconUrl}
            address={token.address}
          />
        </CenterRow>
        <div className="flex-grow-1 ms-3">
          <FlexColumn>
            <LeadText>{token.symbol}</LeadText>
            <MutedText>
              <MiniText>{trim(token.address, 20)}</MiniText>
              <CopyToClipboard text={toReefEVMAddressWithNotification(token.address)}>
                <span
                  onClick={(event) => event.stopPropagation()}
                  className="form-text ms-2"
                  style={{ cursor: 'pointer' }}
                >
                  <CopyIcon small />
                  <MiniText>Copy Address</MiniText>
                </span>
              </CopyToClipboard>
            </MutedText>
          </FlexColumn>
        </div>
        <CenterRow>
          <Text>{toBalance(token).toFixed(4)}</Text>
        </CenterRow>
      </FullRow>
    </ListItemActionModal>
  ));

  const commonBasesView = tokens
    .filter((token) => COMMON_BASES.includes(token.address))
    .map((token) => (
      <IconButton onClick={() => onTokenSelect(token)} key={token.address}>
        <TokenIcon
          src={token.iconUrl}
          address={token.address}
        />
        <MS size="2">
          <Text>{token.symbol}</Text>
        </MS>
      </IconButton>
    ));

  useAsyncEffect(async () => {
    await Promise.resolve()
      .then(() => setIsLoading(true))
      .then(() => {
        if (onAddressChange) {
          onAddressChange(address);
        }
      })
      .finally(() => setIsLoading(false));
  }, [address]);

  return (
    <div>
      <button
        type="button"
        className={`btn btn-select border-rad ${fullWidth && 'w-100'} ${
          isEmpty ? '' : 'btn-token-select'
        }`}
        onClick={() => openModal(id)}
      >
        {!isEmpty && <TokenIcon src={iconUrl} address={selectedToken?.address} />}
        <div className={`my-auto ${!isEmpty ? 'mx-2' : 'me-2'}`}>
          {selectedTokenName}
        </div>
        <DownIcon small />
      </button>
      <Modal id={id}>
        <ModalHeader>
          <Title>Select token</Title>
          <ModalClose />
        </ModalHeader>
        <ModalBody>
          <Input
            value={address}
            maxLength={42}
            onChange={setAddress}
            placeholder="Search token name or address"
          />
          {!hideCommonBaseView && (
            <div>
              <Margin size="3">
                <FlexRow>
                  Common bases
                  <QuestionTooltip>
                    These tokens are commonly
                    {' '}
                    <br />
                    paired with other tokens.
                  </QuestionTooltip>
                </FlexRow>
              </Margin>
              <Margin>{commonBasesView}</Margin>
            </div>
          )}
          <List>
            <ListEmptyItem />
            {isLoading
            || getProgress(foundSearchTokens) === DataProgress.LOADING ? (
              <Loading />
              ) : (
                tokensView
              )}
            <ListEmptyItem />
          </List>
        </ModalBody>
      </Modal>
    </div>
  );
};
