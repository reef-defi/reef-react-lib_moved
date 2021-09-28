import React, { useState } from "react"
import { useAsyncEffect } from "../../hooks";
import { Token } from "../../state/types";
import { ListItem } from "../common/List";

interface SelectToken {
  id?: string;
  iconUrl: string;
  fullWidth?: boolean;
  selectedTokenName: string;
  tokens: Token[],
  onTokenSelect: (newToken: Token) => void;
  findToken: (address: string) => Promise<void>;
}

const SelectToken = ({
  id = 'exampleModal', tokens, selectedTokenName, onTokenSelect, fullWidth = false, iconUrl, findToken
} : SelectToken): JSX.Element => {

  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');

  const isEmpty = selectedTokenName === 'Select token';

  const tokensView = tokens
    .filter((token) => token.name.startsWith(address) || token.address.startsWith(address))
    .map((token) => (
      <ListItem key={token.address}>
        
      </ListItem>
    ))

  useAsyncEffect(async () => {
    await Promise.resolve()
      .then(() => setIsLoading(true))
      .then(() => findToken(address))
      .finally(() => setIsLoading(false));
  }, [address])


  return (
    <>
    </>
  );
}

export default SelectToken;
