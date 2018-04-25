import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native'

import {
  Title,
  Subheading } from 'react-native-paper';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLOR_NOTES_BLUE } from '../utils/constants';
import moment from 'moment';

const striptags = require('striptags');

function formatLastModified(date = new Date()) {

  var m = moment(date);

  if (m.isSame(new Date(), 'day')) {
    return m.format('LT');
  } else {
    return m.format('ll');
  }
}

class ListItem extends React.Component {

  constructor (props) {
    super(props);

    this._navigateToNote = () => {
      props.navigate('EditorPanel', { id: props.note.id });
    }
  }

  render() {
    const {
      note
    } = this.props;

    let firstLine = '', secondLine = '';
    // FIXME: not perfect, need to be properly done but is good for testing.
    if (note.content) {
      firstLine = striptags(note.content.replace('&nbsp;', ' ').split('</')[0]).substr(0, 150);
      secondLine = striptags(note.content.replace('&nbsp;', ' ').replace(firstLine, '')).substr(0, 150);
    }

    return (
      <TouchableOpacity onPress={this._navigateToNote} >
        <View style={styles.wrapper} >
          <Text style={ styles.selector } >
            <MaterialIcons
              name="remove"
              style={{ color: COLOR_NOTES_BLUE }}
              size={22}

            />
          </Text>
          <View style={ styles.content }>
            <Text numberOfLines={1} style={styles.title}>{firstLine}</Text>
            { styles.subtitle ?
              <Text numberOfLines={1} style={styles.subtitle}>{secondLine}</Text>
              : '' }
          </View>
          <Text style={styles.time}>{formatLastModified(note.lastModified)}</Text>
        </View>
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 0,
    paddingRight: 10,
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  selector: {
    flexShrink: 0,
    paddingLeft: 18,
    paddingRight: 18
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 4,
    paddingRight: 10
  },
  title: {
    color: 'black',
    fontWeight: '400'
  },
  subtitle: {
    color: undefined
  },
  time: {
    flexShrink: 0,
    color: undefined,
    fontSize: 11,
    paddingLeft: 10,
    paddingRight: 5
  }
});

export default ListItem
