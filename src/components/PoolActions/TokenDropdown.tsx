import Uik from '@reef-defi/ui-kit';
import React, { useState } from 'react';
import BigNumber from 'bignumber.js';
import { Token, TokenWithAmount } from '../../state';
import { showBalance } from '../../utils';
import './token-field.css';

interface TokenDropdown {
  token: TokenWithAmount;
  tokens: Token[];
  selectToken?: (token: Token) => void;
}

interface TokenDropdownItem {
  token: Token;
  selectToken: (token: Token) => void;
}

const formatHumanBalance = (token): string => {
  const balance = new BigNumber(showBalance(token).replace(token.name, '').replace(token.symbol, '')).toNumber();

  if (isNaN(balance)) return '0';

  if (balance >= 1000000) {
    const hBalance = Uik.utils.formatHumanAmount(balance);
    if (hBalance === 'NaN') return '0';
    return hBalance;
  }

  return String(balance);
};

const TokenDropdownItem = ({ token, selectToken }: TokenDropdownItem): JSX.Element => (
  <Uik.DropdownItem onClick={() => selectToken(token)}>
    <Uik.Container className="uik-pool-actions-token__select-dropdown-token">
      <img
        src={token.iconUrl}
        alt={token.name}
      />
      <div className="uik-pool-actions-token__select-dropdown-token-info">
        <Uik.Text type="mini">{token.name}</Uik.Text>
        <Uik.Text type="mini">{token.symbol}</Uik.Text>
      </div>

      <div className="uik-pool-actions-token__select-dropdown-token-balance" title={showBalance(token)}>{ formatHumanBalance(token) }</div>
    </Uik.Container>
  </Uik.DropdownItem>
);

const TokenDropdown = ({ token, tokens, selectToken } : TokenDropdown): JSX.Element => {
  const [isOpen, setOpen] = useState(token.isEmpty && !!selectToken);
  const [search, setSearch] = useState('');

  const shownTokens = tokens
    .filter((token) => {
      if (!selectToken) {
        return false;
      }
      if (
        search === ''
        || token.symbol.toLowerCase().startsWith(search.toLowerCase())
        || token.name.toLowerCase().startsWith(search.toLowerCase())
        || token.address.toLowerCase().startsWith(search.toLowerCase())
      ) {
        return true;
      }
      return false;
    })
    .map((token) => (
      <TokenDropdownItem
        token={token}
        key={token.address}
        selectToken={(token) => {
          selectToken!(token);
          setOpen(false);
        }}
      />
    ));

  return (
    <div className={`
      uik-pool-actions-token__select-wrapper
      ${token.isEmpty ? 'uik-pool-actions-token__select-wrapper--select' : ''}
    `}
    >
      <button
        className={!token.isEmpty
          ? 'uik-pool-actions-token__token'
          : 'uik-pool-actions-token uik-pool-actions-token--select'}
        type="button"
        disabled={!selectToken}
        onClick={() => setOpen(true)}
      >
        <div
          className="uik-pool-actions-token__image"
          style={{
            backgroundImage: `url(${token.iconUrl})`,
          }}
        />

        {
          token.isEmpty
          && <span>Select token</span>
        }

        { !token.isEmpty
          && (
          <div className="uik-pool-actions-token__info">
            <div className="uik-pool-actions-token__symbol">{ token.symbol }</div>
            <div className="uik-pool-actions-token__amount" title={showBalance(token)}>
              { formatHumanBalance(token) }
              {' '}
              { token.symbol }
            </div>
          </div>
          )}
      </button>

      <Uik.Dropdown
        className="uik-pool-actions-token__select-dropdown"
        isOpen={isOpen}
        onClose={() => setOpen(false)}
      >
        <Uik.Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search token"
        />
        {shownTokens}
      </Uik.Dropdown>
    </div>
  );
};

export default TokenDropdown;
