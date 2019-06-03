import React, { ReactNode } from 'react';

import './AppLayout.scss';

export type AppLayoutProps = {
  className: string,
  children: ReactNode,
};

export const AppLayout = ({
  className,
  children
}: AppLayoutProps) => (
  <div id="stage" className="app-layout">
    <div className="settings">

      <div id="fxa-settings-header-wrapper">
        <header id="fxa-settings-header">
          <h1 id="fxa-manage-account">
            <span className="fxa-account-title">Firefox Accounts</span>
          </h1>
        </header>
      </div>

      <div id="main-content" className="card visible">
        <div className="app">
          {children}
        </div>
      </div>

      <footer>
        <section className="left">
          <a id="about-mozilla" rel="author" target="_blank" href="https://www.mozilla.org/about/?utm_source=firefox-accounts&amp;utm_medium=Referral"></a>
        </section>
        <section className="right">
          <a className="terms" href="/legal/terms">Terms of Service</a>
          <a className="privacy" href="/legal/privacy">Privacy Notice</a>
        </section>
      </footer>
    </div>
  </div>
);

export default AppLayout;