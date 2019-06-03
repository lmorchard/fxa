import React from 'react';
import { storiesOf } from '@storybook/react';
import { AppLayout } from './AppLayout';

storiesOf('components/AppLayout', module)
.add('full header', () => (
  <AppLayout>
    App contents go here
  </AppLayout>
))
.add('sign-in style', () => (
  <AppLayout>
    App contents go here
  </AppLayout>
))
;
