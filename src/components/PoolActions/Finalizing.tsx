import React from 'react';
import Uik from '@reef-defi/ui-kit';
import './finalizing.css';

export const Finalizing = (): JSX.Element => (
  <div className="pool-actions-finalizing">
    <div className="pool-actions-finalizing__animation">
      <Uik.FishAnimation />
      <Uik.FishAnimation />
    </div>
    <Uik.Text text="We're just finalizing your transaction." />
    <Uik.Text type="mini" text="This proccess usually takes up to one minute." />
  </div>
);
