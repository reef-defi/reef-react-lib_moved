import React, { useState } from 'react';
import { useAsyncEffect } from '../../hooks';
import { Token } from '../../state';
import { trim } from '../../utils';
import { IconButton } from '../common/Button';
import {
  CenterRow, FlexColumn, FlexRow, Margin,
} from '../common/Display';
import { TokenIcon, DownIcon } from '../common/Icons';
import { Input } from '../common/Input';
import { List, ListEmptyItem, ListItem } from '../common/List';
import { Loading } from '../common/Loading';
import {
  Modal, ModalBody, ModalClose, ModalHeader,
} from '../common/Modal';
import {
  Title, Text, LeadText, MiniText,
} from '../common/Text';
import { QuestionTooltip } from '../common/Tooltip';

interface SelectToken {
  id?: string;
  iconUrl: string;
  fullWidth?: boolean;
  selectedTokenName: string;
  tokens: Token[],
  onTokenSelect: (newToken: Token) => void;
  onAddressChange?: (address: string) => Promise<void>;
}

const COMMON_BASES = ['REEF'];

const emptyFunction = async (): Promise<void> => {};

const SelectToken = ({
  id = 'exampleModal', tokens, selectedTokenName, onTokenSelect, fullWidth = false, iconUrl, onAddressChange = emptyFunction,
} : SelectToken): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');

  const isEmpty = selectedTokenName === 'Select token';

  const tokensView = tokens
    .filter((token) => token.name.startsWith(address) || token.address.startsWith(address))
    .map((token) => (
      <ListItem key={token.address}>
        <FlexRow>
          <CenterRow>
            <TokenIcon src={token.iconUrl} />
          </CenterRow>
          <Margin size="3">
            <FlexColumn>
              <LeadText>{token.name}</LeadText>
              <MiniText>{trim(token.address, 20)}</MiniText>
            </FlexColumn>
          </Margin>
          <CenterRow>
            <Text>
              {}
              Balance TODO!
            </Text>
          </CenterRow>
        </FlexRow>
      </ListItem>
    ));

  const commonBasesView = tokens
    .filter((token) => COMMON_BASES.includes(token.name))
    .map((token) => (
      <IconButton onClick={() => onTokenSelect(token)} key={token.address}>
        <TokenIcon src={token.iconUrl} />
        <Text>{token.name}</Text>
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
      <button type="button" className={`btn btn-select border-rad ${fullWidth && 'w-100'} ${isEmpty ? 'btn-reef' : 'btn-token-select'}`} data-bs-toggle="modal" data-bs-target={`#${id}`}>
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
          <Margin size="3">
            Common bases
            <QuestionTooltip>
              These tokens are commonly
              {' '}
              <br />
              paired with other tokens.
            </QuestionTooltip>
          </Margin>
          <Margin>
            {commonBasesView}
          </Margin>
          <List>
            <ListEmptyItem />
            {isLoading ? <Loading /> : tokensView}
            <ListEmptyItem />
          </List>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default SelectToken;
