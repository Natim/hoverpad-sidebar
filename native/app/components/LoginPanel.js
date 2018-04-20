import fxaUtils from '../vendor/fxa-utils';
import kintoClient from '../vendor/kinto-client';
import PropTypes from 'prop-types';
import React from 'react';
import store from '../store';
import sync from '../utils/sync';
import { authenticate } from '../actions';
import { Button } from 'react-native-paper';
import { COLOR_NOTES_BLUE } from '../utils/constants';
import { connect } from 'react-redux';
import { NavigationActions } from 'react-navigation';
import { trackEvent } from '../utils/metrics';
import { View, Text, ToastAndroid, Image } from 'react-native';

import i18nGetMessage from '../utils/i18n';
import { KINTO_LOADED } from '../utils/constants';
import browser from '../browser';

class LoginPanel extends React.Component {
  onAuth () {
    this.props.navigation.navigate('LoadingPanel');

    return Promise.resolve().then(() => {
      return fxaUtils.launchOAuthKeyFlow();
    }).then((loginDetails) => {
      trackEvent('login-success');
      this.props.dispatch(authenticate(loginDetails));
      ToastAndroid.show('Logged in as ' + loginDetails.profile.email, ToastAndroid.SHORT);
      browser.runtime.sendMessage({
        action: KINTO_LOADED
      });
      return Promise.resolve();
    }).catch((err) => {
      this.props.navigation.dispatch(NavigationActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({ routeName: 'LoginPanel' })],
      }));
      console.log('onAuth', err);
      ToastAndroid.show('Something went wrong: ' + err, ToastAndroid.SHORT);
      trackEvent('login-failed');
    })
  }

  componentWillReceiveProps(newProps) {
    if (newProps.state.kinto.isLoaded) {
      // Reset back button nav. See https://reactnavigation.org/docs/navigation-actions.html#reset
      this.props.navigation.dispatch(NavigationActions.reset({
        index: 0,
        actions: [ NavigationActions.navigate({ routeName: 'ListPanel' }) ],
      }));
    }
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Image
          style={{width: 150, height: 150 }}
          source={require('../assets/notes-1024.png')}
        />
        <Text style={{ fontWeight: 'bold', fontSize: 22, padding: 10 }}>{ i18nGetMessage('welcomeTitle3') }</Text>
        <Text style={{ fontSize: 16, padding: 10 }}>Access your Test Pilot Notes</Text>
        <Button raised onPress={this.onAuth.bind(this)} color={COLOR_NOTES_BLUE}>SIGN IN</Button>
      </View>
    );
  }
}

function mapStateToProps(state) {
  return {
    state
  };
}

LoginPanel.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default connect(mapStateToProps)(LoginPanel)
