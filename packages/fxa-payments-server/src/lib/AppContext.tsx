import React from 'react';
import { Config } from './types';

export interface AppContextInterface {
  accessToken: string,
  config: Config
};

const AppContext = React.createContext<AppContextInterface>({
  accessToken: '',
  config: {}
});

export default AppContext;