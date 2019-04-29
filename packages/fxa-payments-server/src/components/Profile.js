// eslint-disable-next-line no-unused-vars
import React from 'react';
import { connect } from 'react-redux';
import { selectors } from '../store';

export const Profile = ({ profile: { loading, error, result } }) => {
  return (
    <div>
      {loading && <h1>(profile loading...)</h1>}
      {error && <h1>(profile error! {'' + error})</h1>}
      {result && (
        <div>
          <img alt={result.email} src={result.avatar} width="64" height="64" /><br />
          {result.displayName && (
            <>
              {result.displayName}<br />
              {result.email}
            </>
          )}
          {! result.displayName && (
            <>
              {result.email}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default connect(
  state => ({ profile: selectors.profile(state) })
)(Profile);
