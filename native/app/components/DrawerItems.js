import * as Keychain from 'react-native-keychain';
import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { NavigationActions } from 'react-navigation';
import { Title, Text, TouchableRipple } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { View, ScrollView, StyleSheet, Image, Linking, Modal } from 'react-native';
import moment from 'moment';

import { COLOR_NOTES_BLUE } from "../utils/constants";
import { DrawerItem, DrawerSection, Colors } from 'react-native-paper';
import { trackEvent } from "../utils/metrics";
import fxaUtils from "../vendor/fxa-utils";
import store from "../store";


// Url to open to give feedback
const SURVEY_PATH = 'https://qsurvey.mozilla.com/s3/notes?ref=android';


class DrawerItems extends React.Component {

  constructor(props) {
    super(props);

    // DrawerItemsData store our drawer button list
    this.drawerItemsData = [
      {
        label  : 'Give Feedback',
        action : () => {
          return Linking.openURL(SURVEY_PATH);
        }
      },
      {
        label : 'Log out',
        action: () => {
          function navigateToLogin () {
            // Reset back button nav. See https://reactnavigation.org/docs/navigation-actions.html#reset
            const resetAction = NavigationActions.reset({
              index: 0,
              actions: [ NavigationActions.navigate({ routeName: 'LoginPanel' }) ],
            });
            this.props.navigation.dispatch(resetAction);
            trackEvent('webext-button-disconnect');
          }

          return Keychain.resetGenericPassword().then(navigateToLogin.bind(this), navigateToLogin.bind(this));
        }
      }
    ];

  }


  render() {
    return (
      <View style={styles.drawerContent}>
        <View style={{ paddingTop: 55, paddingLeft: 30, paddingBottom: 20, backgroundColor: COLOR_NOTES_BLUE }}>
          <Image
            style={{width: 75, height: 75 }}
            borderRadius={100}
            borderColor='#FFFFFF'
            borderWidth={2}
            resizeMode='cover'
            source={{uri: this.props.state.sync.avatar}}
          />
          <Title style={{ color: '#FFFFFF' }}>{this.props.state.sync.displayName}</Title>
          <Text style={{ color: '#FFFFFF' }}>{this.props.state.sync.email}</Text>
        </View>
        <ScrollView style={styles.drawerSection}>
          <DrawerSection>
            {this.drawerItemsData.map((item, index) => (
              <DrawerItem
                key={index}
                label={ item.label }
                style={{ paddingLeft: 14 }}
                // active={this.state.drawerItemIndex === item}
                onPress={() => item.action()}
              />
            ))}
          </DrawerSection>

        </ScrollView>
        <TouchableRipple style={styles.footer} onPress={() => console.log('was pressed')}>
          <View style={styles.footerWrapper}>
              <Text style={{ color: undefined, fontSize: 13 }}>Last synced { moment(this.props.state.sync.lastSynced).format('LT') }</Text>
              <MaterialIcons
                name="sync"
                style={{ marginRight: 10, color: undefined }}
                size={20}
              />
          </View>
        </TouchableRipple>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerSection: {
    flexGrow: 1,
    paddingTop: 10
  },
  footer: {
    flexGrow: 0
  },
  footerWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexGrow: 0,
    paddingTop: 15,
    paddingBottom: 14,
    paddingLeft: 28,
    paddingRight: 10
  }
});

function mapStateToProps(state) {
  return {
    state
  };
}

DrawerItems.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default connect(mapStateToProps)(DrawerItems)
