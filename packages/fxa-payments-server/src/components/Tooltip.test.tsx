import React, { useRef } from 'react';
import { render, cleanup, fireEvent, } from '@testing-library/react';
import 'jest-dom/extend-expect';
import { Omit } from '../lib/types';
import ScreenInfo from '../lib/screen-info';
import {
  Tooltip,
  TooltipProps,
  MIN_HEIGHT_TO_SHOW_TOOLTIP_BELOW,
  MIN_WIDTH_TO_SHOW_TOOLTIP_BELOW,
} from './Tooltip';

const LABEL_TEXT = 'Valid frobnitz required.';

afterEach(cleanup);

type SubjectProps = {
  clientHeight?: number,
  clientWidth?: number,
} & Omit<TooltipProps, "parentRef">;

const Subject = (props: SubjectProps) => {
  const {
    clientHeight = 2000,
    clientWidth = 2000,
    ...tooltipProps
  } = props;

  const parentRef = useRef(null);
  
  const screenInfo = new ScreenInfo(window);
  Object.assign(screenInfo, { clientHeight, clientWidth });
  
  return (
    <div className="input-row">
      <input ref={parentRef} name="name" type="text" className="name tooltip-below invalid" />
      <Tooltip {...{ ...tooltipProps, screenInfo, parentRef }} />
    </div>
  );
};

it('renders children as label', () => {
  const { queryByText } = render(
    <Subject>{LABEL_TEXT}</Subject>
  );
  const result = queryByText(LABEL_TEXT);
  expect(result).toBeInTheDocument();
  if (result) {
    expect(result).toHaveClass('tooltip');
    expect(result).toHaveClass('tooltip-below');
    expect(result).toHaveClass('fade-up-tt');
    expect(result.style.top).not.toContain('-');  
  }
});

it('renders with expected id and class names', () => {
  const { getByText } = render(
    <Subject id="xyzzy" extraClassNames="frobnitz">{LABEL_TEXT}</Subject>
  );
  const result = getByText(LABEL_TEXT);
  expect(result).toHaveAttribute('id', 'xyzzy');
  expect(result).toHaveClass('tooltip');
  expect(result).toHaveClass('tooltip-below');
  expect(result).toHaveClass('fade-up-tt');
  expect(result).toHaveClass('frobnitz');
});

it('handles being dismissible', () => {
  const onDismiss = jest.fn();
  const { queryByTestId } = render(
    <Subject dismissible onDismiss={onDismiss}>{LABEL_TEXT}</Subject>
  );
  const control = queryByTestId('dismiss-button');
  expect(control).toBeInTheDocument();
  fireEvent.click(control as Element);
  expect(onDismiss.mock.calls.length).toBe(1);
});

it('displays label above with showBelow=false', () => {
  const { getByText } = render(
    <Subject showBelow={false}>{LABEL_TEXT}</Subject>
  );
  const result = getByText(LABEL_TEXT);
  expect(result).not.toHaveClass('tooltip-below');
  expect(result).toHaveClass('fade-down-tt');
  expect(result.style.top).toContain('-');
});

it('displays label above on short window', () => {
  const { getByText } = render(
    <Subject clientHeight={MIN_HEIGHT_TO_SHOW_TOOLTIP_BELOW - 10}>{LABEL_TEXT}</Subject>
  );
  const result = getByText(LABEL_TEXT);
  expect(result).not.toHaveClass('tooltip-below');
  expect(result).toHaveClass('fade-down-tt');
  expect(result.style.top).toContain('-');
});

it('overrides showBelow={true} on short window', () => {
  const { getByText } = render(
    <Subject
      showBelow={true}
      clientHeight={MIN_HEIGHT_TO_SHOW_TOOLTIP_BELOW - 10}>{LABEL_TEXT}</Subject>
  );
  const result = getByText(LABEL_TEXT);
  expect(result).not.toHaveClass('tooltip-below');
  expect(result).toHaveClass('fade-down-tt');
  expect(result.style.top).toContain('-');
});

it('displays label above on narrow window', () => {
  const { getByText } = render(
    <Subject
      showBelow={true}
      clientWidth={MIN_WIDTH_TO_SHOW_TOOLTIP_BELOW - 10}>{LABEL_TEXT}</Subject>
  );
  const result = getByText(LABEL_TEXT);
  expect(result).not.toHaveClass('tooltip-below');
  expect(result).toHaveClass('fade-down-tt');
  expect(result.style.top).toContain('-');
});

it('overrides showBelow={true} on narrow window', () => {
  const { getByText } = render(
    <Subject
      showBelow={true}
      clientWidth={MIN_WIDTH_TO_SHOW_TOOLTIP_BELOW - 10}>{LABEL_TEXT}</Subject>
  );
  const result = getByText(LABEL_TEXT);
  expect(result).not.toHaveClass('tooltip-below');
  expect(result).toHaveClass('fade-down-tt');
  expect(result.style.top).toContain('-');
});
