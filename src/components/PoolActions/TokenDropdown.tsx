import Uik from "@reef-defi/ui-kit";
import React, { useState } from "react"
import { Token, TokenWithAmount } from "../../state";
import { showBalance } from "../../utils";
import './token-field.css';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';

interface TokenDropdown {
  token: TokenWithAmount;
  tokens: Token[];
  selectToken?: (token: Token) => void;
}

interface TokenDropdownItem {
  token: Token;
  selectToken: (token: Token) => void;
}

const TokenDropdownItem = ({token, selectToken}: TokenDropdownItem): JSX.Element => (
  <Uik.DropdownItem onClick={() => selectToken(token)}>
    <div className="d-flex flex-row">
      <img src={token.iconUrl} className="me-2" style={{ width: 30, height: 30 }}/>
      <div>
        <Uik.Text>{token.name}</Uik.Text>
        <Uik.Text>{token.symbol}</Uik.Text>
      </div>
    </div>
  </Uik.DropdownItem>
);

const TokenDropdown = ({token, tokens, selectToken} : TokenDropdown): JSX.Element => {
  const [isOpen, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const shownTokens = tokens
    .filter((token) => {
      if (!selectToken) {
        return false;
      }
      if (
        search === '' ||
        token.symbol.startsWith(search) ||
        token.name.startsWith(search) ||
        token.address.startsWith(search)
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
    <div>
      <button
        className={!token.isEmpty
          ? "uik-pool-actions-token__token"
          : "uik-pool-actions-token uik-pool-actions-token--select"
        }
        type="button"
        disabled={!selectToken}
        onClick={() => setOpen(true)}
      >
        <div
          className="uik-pool-actions-token__image"
          style={{
            backgroundImage: `url(${token.iconUrl})`,
          }}
        >
          {token.isEmpty && <Uik.Icon className="mx-3 px-2" icon={faQuestion} />}
        </div>
        { !token.isEmpty &&
          <div className="uik-pool-actions-token__info">
            <div className="uik-pool-actions-token__symbol">{ token.symbol }</div>
              <div className="uik-pool-actions-token__amount">
                Available
                {' '}
                { showBalance(token) }
              </div>
          </div>
        }
      </button>

      <Uik.Dropdown
        isOpen={isOpen}
        position="bottomRight"
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
}

export default TokenDropdown;
