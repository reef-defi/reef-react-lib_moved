import React, { useEffect, useState } from 'react';
import { Pool } from '../../state';
import { calculatePoolShare, convert2Normal, toBalance } from '../../utils';
import { Button, EmptyButton } from '../common/Button';
import {
  Card, CardHeader, CardTitle, SubCard,
} from '../common/Card';
import {
  CenterColumn,
  CenterRow,
  ContentBetween,
  ContentEnd,
  FlexColumn,
  FlexRow,
  FullColumn,
  MS,
  MT,
  Width,
} from '../common/Display';
import { DownIcon, TokenIcon, UpIcon } from '../common/Icons';
import { ConfirmLabel } from '../common/Label';
import { List, ListItem } from '../common/List';
import { Loading } from '../common/Loading';
import { MiniText, MutedText, Text } from '../common/Text';

interface DefaultState {
  pool: Pool;
}

interface State extends DefaultState {
  toggle: () => void;
}

interface OpenState extends State {
  openRemoveLiquidity: (address1: string, address2: string) => void;
}

const DefaultState = ({ pool }: DefaultState): JSX.Element => (
  <FlexRow>
    <TokenIcon src={pool.token1.iconUrl} />
    <TokenIcon src={pool.token2.iconUrl} />
    <CenterRow>
      <MS size="2">
        <Text>
          {pool.token1.name}
          /
          {pool.token2.name}
        </Text>
      </MS>
    </CenterRow>
  </FlexRow>
);

const CloseState = ({ pool, toggle }: State): JSX.Element => (
  <ContentBetween>
    <DefaultState pool={pool} />
    <FlexColumn>
      <MiniText>
        <MutedText>Liquidity:</MutedText>
      </MiniText>
      <Text>
        {convert2Normal(pool.decimals, pool.minimumLiquidity).toFixed(4)}
      </Text>
    </FlexColumn>
    <FlexColumn>
      <MiniText>
        <MutedText>Supply:</MutedText>
      </MiniText>
      <Text>{convert2Normal(pool.decimals, pool.totalSupply).toFixed(4)}</Text>
    </FlexColumn>
    <EmptyButton onClick={toggle}>
      <DownIcon />
    </EmptyButton>
  </ContentBetween>
);

const OpenState = ({
  pool,
  toggle,
  openRemoveLiquidity,
}: OpenState): JSX.Element => (
  <FullColumn>
    <ContentBetween>
      <DefaultState pool={pool} />
      <EmptyButton onClick={toggle}>
        <UpIcon />
      </EmptyButton>
    </ContentBetween>
    <ContentBetween>
      {/* <div className="w-50 me-1 p-3 border border-1 border-rad">Basic Chart WIP...</div> */}
      <div className="w-100 ms-1">
        <SubCard>
          <ConfirmLabel
            title="Supply: "
            value={convert2Normal(pool.decimals, pool.totalSupply).toFixed(4)}
          />
          <ConfirmLabel
            title="Liquidity: "
            value={convert2Normal(pool.decimals, pool.minimumLiquidity).toFixed(
              4,
            )}
          />
          <ConfirmLabel
            title="Locked 1: "
            value={toBalance(pool.token1).toFixed(4)}
          />
          <ConfirmLabel
            title="Locked 2: "
            value={toBalance(pool.token2).toFixed(4)}
          />
          <ConfirmLabel
            title="Your share: "
            value={`${calculatePoolShare(pool).toFixed(4)} %`}
          />
        </SubCard>
      </div>
    </ContentBetween>
    <MT size="2" />
    <ContentEnd>
      <Button
        onClick={() => openRemoveLiquidity(pool.token1.address, pool.token2.address)}
      >
        Remove supply
      </Button>
      {/* <MS size="1" />
      <Button>Open pool</Button> */}
    </ContentEnd>
  </FullColumn>
);

interface PoolsComponent {
  pools: Pool[];
  isLoading: boolean;
  openAddLiquidity: () => void;
  openRemoveLiquidity: (address1: string, address2: string) => void;
}

export const PoolsComponent = ({
  pools,
  isLoading,
  openAddLiquidity,
  openRemoveLiquidity,
}: PoolsComponent): JSX.Element => {
  const [isOpen, setIsOpen] = useState<boolean[]>([]);

  const closeAll = (): void => {
    setIsOpen(pools.map(() => false));
  };
  const open = (index: number): void => {
    closeAll();
    setIsOpen([
      ...isOpen.slice(0, index),
      true,
      ...isOpen.slice(index + 1, isOpen.length),
    ]);
  };

  useEffect(() => {
    closeAll();
  }, [pools]);

  const poolsView = pools.map((pool, index) => (
    <ListItem key={pool.poolAddress}>
      {isOpen[index] ? (
        <OpenState
          pool={pool}
          toggle={closeAll}
          openRemoveLiquidity={openRemoveLiquidity}
        />
      ) : (
        <CloseState pool={pool} toggle={() => open(index)} />
      )}
    </ListItem>
  ));

  return (
    <CenterColumn>
      <div className="pools-list">
        <Width size={500}>
          <Card>
            <CardHeader>
              <CardTitle title="Pools" />
              <FlexRow>
                <Button onClick={openAddLiquidity}>Add supply</Button>
              </FlexRow>
            </CardHeader>

            {isLoading && !pools.length && (
              <MT size="3">
                <Loading />
              </MT>
            )}
            {!isLoading && pools.length > 0 && (
              <MT size="3">
                <List>{poolsView}</List>
              </MT>
            )}
          </Card>
        </Width>
      </div>
    </CenterColumn>
  );
};
