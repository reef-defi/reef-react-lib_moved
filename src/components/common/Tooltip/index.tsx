import React from 'react';
import ReactTooltip from 'react-tooltip';

interface Tooltip {
  id?: string;
}

export const QuestionTooltip: React.FC<Tooltip> = ({
  children,
  id = 'question-tooltip',
}): JSX.Element => (
  <div>
    <b className="ms-1" data-tip data-for={id}>
      ?
    </b>
    <ReactTooltip
      id={id}
      place="right"
      effect="solid"
      backgroundColor="#46288b"
    >
      {children}
    </ReactTooltip>
  </div>
);
