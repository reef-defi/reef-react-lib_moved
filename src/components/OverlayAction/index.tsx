import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import Uik from '@reef-defi/ui-kit';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import './overlay-action.css';

interface OverlayAction {
  isOpen: boolean;
  onClose?: () => any;
  className?: string,
  title?: string,
}

export const OverlayAction: React.FC<OverlayAction> = ({
  isOpen,
  onClose,
  className,
  title,
  children,
}): JSX.Element => {
  const wrapper = useRef(null);

  const opened = (): void => {
    document.body.style.overflow = 'hidden';
  };

  const closed = (): void => {
    document.body.style.overflow = '';
  };

  return (
    <div
      className={`
        overlay-action
        ${className || ''}
      `}
    >
      <CSSTransition
        in={isOpen}
        className="overlay-action__wrapper"
        nodeRef={wrapper}
        timeout={500}
        unmountOnExit
        onEnter={opened}
        onExited={closed}
      >
        <div
          ref={wrapper}
          className="overlay-action__wrapper"
        >
          <div className="overlay-action__content">
            <div className="overlay-action__head">
              <div className="overlay-action__title">{ title }</div>

              <button
                className="overlay-action__close-btn"
                type="button"
                onClick={onClose}
              >
                <Uik.Icon
                  className="overlay-action__close-btn-icon"
                  icon={faXmark}
                />
              </button>
            </div>

            <div className="overlay-action__slot">
              { children }
            </div>
          </div>
        </div>
      </CSSTransition>
    </div>
  );
};
