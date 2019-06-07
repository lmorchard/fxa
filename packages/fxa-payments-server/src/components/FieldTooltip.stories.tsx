import React, { useRef } from 'react';
import { storiesOf } from '@storybook/react';
import MockApp from '../../.storybook/components/MockApp';
import { SignInLayout } from '../components/AppLayout';
import { FieldTooltip } from './FieldTooltip';

function init() {
  storiesOf('components/FieldTooltip', module)
    .add('showBelow = false,true', () => 
      <MockPage>
        <Field showBelow={false} />
        <Field showBelow />
      </MockPage>
    )
    .add('clientHeight = 300,1000', () => 
      <MockPage>
        <Field clientHeight={300} />
        <Field />
      </MockPage>
    );
}

type FieldProps = {
  showBelow?: boolean,
  clientHeight?: number,
};

const Field = ({
  showBelow = undefined,
  clientHeight = 1000,
}: FieldProps) => {
  const fieldRef = useRef(null);
  return (
    <div className="input-row">
      <span className="label-text">Email address</span>
      <input ref={fieldRef} name="name" type="text" className="name tooltip-below invalid" defaultValue="" required autoFocus aria-invalid="true" />
      <FieldTooltip
        parentRef={fieldRef}
        showBelow={showBelow}
        screenInfo={{ clientHeight, clientWidth: 600 }}>Valid email required</FieldTooltip>
    </div>          
  );
};

type MockPageProps = {
  children: React.ReactNode,
};

const MockPage = ({ children }: MockPageProps) => {
  return (  
    <MockApp>
      <SignInLayout>
        <form className="payment">
          {children}
        </form>
      </SignInLayout>
    </MockApp>
  );
};

init();