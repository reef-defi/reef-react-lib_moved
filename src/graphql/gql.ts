export const CONTRACT_EVENTS_GQL = `
          subscription events(
            $blockNumber: bigint
            $perPage: Int!
            $offset: Int!
            $contractAddressFilter: String!
          ) {
            event(
              limit: $perPage
              offset: $offset
              where: {block_number: { _eq: $blockNumber }, section: { _eq: "evm" }, method: { _eq: "Log" }, data: {_like: $contractAddressFilter}}
              order_by: { block_number: desc, event_index: desc }
            ) {
              block_number
              event_index
              data
              method
              phase
              section
              timestamp
            }
          }
        `;

export const REEF_TRANSFERS_GQL = `
          subscription reefTransfers(
            $blockNumber: bigint
            $perPage: Int!
            $offset: Int!
            $address: String!
          ) {
            transfer(
              limit: $perPage
              offset: $offset
              where: {block_number: { _eq: $blockNumber }, source: { _eq: $address } }
              order_by: { block_number: desc, extrinsic_index: desc }
            ) {
              block_number
              section
              method
              hash
              source
              destination
              amount
              denom
              fee_amount
              success
              error_message
              timestamp
            }
          }
        `;

export const TOKEN_BALANCES_GQL = `
          subscription tokenHolders(
            $contractId: String!
            $accountAddress: String!
            $perPage: Int!
            $offset: Int!
          ) {
            token_holder(
              limit: $perPage
              offset: $offset
              where: {contract_id: { _eq: $contractId }, holder_evm_address: { _like: $accountAddress } }
              order_by: { block_height: desc }
            ) {
              contract_id
              holder_account_id
              holder_evm_address
              balance
              block_height
              timestamp
            }
          }
        `;
