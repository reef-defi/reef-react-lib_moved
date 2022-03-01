import React, { useEffect, useState } from 'react';
import { utils } from 'ethers';
import { useAsyncEffect } from '../../hooks';
import { ReefSigner, Token } from '../../state';
import {
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
  ContentEnd,
  FlexColumn,
  FlexRow,
  FullRow,
  Margin,
  MS,
} from '../common/Display';
import { DownIcon, TokenIcon } from '../common/Icons';
import { Input } from '../common/Input';
import { List, ListEmptyItem, ListItemDismissModal } from '../common/List';
import { Loading } from '../common/Loading';
import {
  Modal, ModalBody, ModalClose, ModalHeader,
} from '../common/Modal';
import {
  LeadText, MiniText, MutedText, Text, Title,
} from '../common/Text';
import { QuestionTooltip } from '../common/Tooltip';
import { loadToken } from '../../rpc';

interface SelectToken {
  id?: string;
  iconUrl: string;
  fullWidth?: boolean;
  selectedTokenName: string;
  tokens: Token[];
  onTokenSelect: (newToken: Token) => void;
  onAddressChange?: (address: string) => Promise<void>;
  hideCommonBaseView?: boolean;
  signer: ReefSigner;
}

const COMMON_BASES = ['REEF'];

const emptyFunction = async (): Promise<void> => {};

const SelectToken = ({
  id = 'exampleModal',
  tokens,
  selectedTokenName,
  onTokenSelect,
  fullWidth = false,
  iconUrl,
  onAddressChange = emptyFunction,
  hideCommonBaseView,
  signer,
}: SelectToken): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [foundSearchTokens, setFoundSearchTokens] = useState<
    DataWithProgress<Token[]>
  >([...tokens]);

  const isEmpty = selectedTokenName === 'Select token';

  useEffect(() => {
    if (!signer) {
      return;
    }
    async function searchTokens(): Promise<void> {
      let tokenSearchRes = [...tokens].filter(
        (token) => token.name.toLowerCase().startsWith(address.toLowerCase())
          || token.address.toLowerCase().startsWith(address.toLowerCase()),
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

  // let foundAvailableTokens = tokens.filter((token) => token.name.toLowerCase().startsWith(address.toLowerCase()) || token.address.toLowerCase().startsWith(address.toLowerCase()));
  const tokensView = getData(foundSearchTokens)?.map((token) => (
    <ListItemDismissModal
      key={token.address}
      onClick={() => onTokenSelect(token)}
    >
      <FullRow>
        <CenterRow>
          <TokenIcon src={token.iconUrl} />
        </CenterRow>
        <MS size="3">
          <FlexColumn>
            <LeadText>{token.name}</LeadText>
            <MutedText>
              <MiniText>{trim(token.address, 20)}</MiniText>
            </MutedText>
          </FlexColumn>
        </MS>
        <ContentEnd>
          <CenterRow>
            <Text>{toBalance(token).toFixed(4)}</Text>
          </CenterRow>
        </ContentEnd>
      </FullRow>
    </ListItemDismissModal>
  ));

  const commonBasesView = tokens
    ?.filter((token) => COMMON_BASES.includes(token.name))
    .map((token) => (
      <IconButton onClick={() => onTokenSelect(token)} key={token.address}>
        <TokenIcon src={token.iconUrl} />
        <MS size="2">
          <Text>{token.name}</Text>
        </MS>
      </IconButton>
    ));

  useAsyncEffect(async () => {
    await Promise.resolve()
      .then(() => setIsLoading(true))
      .then(() => onAddressChange(address))
      .finally(() => setIsLoading(false));
  }, [address]);

  return (
    <div>
      <button
        type="button"
        className={`btn btn-select border-rad ${fullWidth && 'w-100'} ${
          isEmpty ? 'btn-reef' : 'btn-token-select'
        }`}
        data-bs-toggle="modal"
        data-bs-target={`#${id}`}
      >
        {!isEmpty && <TokenIcon src={iconUrl} />}
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

export default SelectToken;
