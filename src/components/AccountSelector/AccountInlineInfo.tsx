import React from "react"
import Identicon from '@polkadot/react-identicon';
import { FlexRow, MX, PY } from "../common/Display";
import { trim } from "../../utils";

interface AccountInlineInfo {
  name: string;
  address: string;
  evmAddress: string;
  toggle?: string;
  onClick: () => void;
}

const AccountInlineInfo = ({name, address, evmAddress, toggle="modal-toggle", onClick} : AccountInlineInfo): JSX.Element => (
  <FlexRow>
    <MX size="2" />
    <PY size="auto">
      <div className="rounded-circle">
        <Identicon
          value={address}
          size={32}
          theme="substrate"
        />
      </div>
    </PY>
    <div
      tabIndex={0}
      role="button"
      onClick={onClick}
      data-bs-toggle="modal"
      data-bs-dismiss="modal"
      data-bs-target={`#${toggle}`}
      className="d-flex flex-column align-start ps-2 pe-4"
    >
      <span className="lead-text">{trim(name, 30)}</span>
      <span className="sub-text">{trim(evmAddress, 30)}</span>
    </div>
  </FlexRow>
);

export default AccountInlineInfo;
