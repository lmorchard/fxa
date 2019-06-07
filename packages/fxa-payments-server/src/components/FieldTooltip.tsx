// This is a React version of this Bootstrap view:
// https://github.com/mozilla/fxa/blob/master/packages/fxa-content-server/app/scripts/views/tooltip.js

import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';

const PADDING_BELOW_TOOLTIP_PX = 2;
const PADDING_ABOVE_TOOLTIP_PX = 4;

// These values should be the same as
// https://github.com/mozilla/fxa-content-server/blob/0eab619612897dcda43e8074dafdf55e8cbe11ee/app/styles/_breakpoints.scss#L6
const MIN_HEIGHT_TO_SHOW_TOOLTIP_BELOW = 480;
const MIN_WIDTH_TO_SHOW_TOOLTIP_BELOW = 520;

export type FieldTooltipProps = {
  children: React.ReactNode,
  parentRef: React.RefObject<HTMLInputElement | HTMLDivElement>,
  id?: string,
  showBelow?: boolean,
  dismissable?: boolean,
  onDismiss?: () => void,
  extraClassNames?: string,
  screenInfo?: {
    clientHeight: number,
    clientWidth: number,
  }
};

export const FieldTooltip = ({
  children,
  parentRef,
  id = '',
  showBelow = true,
  dismissable = false,
  onDismiss = () => {},
  extraClassNames = '',
  screenInfo = {
    clientHeight: 600,
    clientWidth: 600,
  },
}: FieldTooltipProps) => {
  const doShowBelow =
    showBelow &&
    (screenInfo.clientHeight >= MIN_HEIGHT_TO_SHOW_TOOLTIP_BELOW) &&
    (screenInfo.clientWidth >= MIN_WIDTH_TO_SHOW_TOOLTIP_BELOW);

  const tooltipRef = useRef<HTMLElement>(null);

  // After initial render, nudge tooltip position relative to parent element
  useEffect(() => {
    const tooltipEl = tooltipRef.current;
    const parentEl = parentRef.current;
    if (tooltipEl && parentEl) {
      if (doShowBelow) {
        tooltipEl.style.top = parentEl.offsetTop + parentEl.offsetHeight + PADDING_ABOVE_TOOLTIP_PX + 'px';
      } else {
        tooltipEl.style.top = parentEl.offsetTop + (0 - tooltipEl.offsetHeight - PADDING_BELOW_TOOLTIP_PX) + 'px';
      }
    }
  }, [ doShowBelow, tooltipRef, parentRef ]);

  const asideClassNames = [
    'tooltip',
    doShowBelow
      ? 'tooltip-below fade-up-tt'
      : 'fade-down-tt',
    extraClassNames,
  ]; 

  return (
    <aside ref={tooltipRef} id={id} className={classNames(...asideClassNames)}>
      {children}
      {dismissable && <>
        {" "}<span onClick={onDismiss} className="dismiss" tabIndex={2}>&#10005;</span>
      </>}
    </aside>
  );
};

export default FieldTooltip;