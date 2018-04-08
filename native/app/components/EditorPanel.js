import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Dimensions } from 'react-native';
import {RichTextEditor} from 'react-native-zss-rich-text-editor';


function escapeHtml(unsafe) {
  return unsafe
    // .replace(/&/g, "&amp;")
    // .replace(/</g, "&lt;")
    // .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


class RichTextExample extends Component {

  constructor(props) {
    super(props);
    this.getHTML = this.getHTML.bind(this);
    this.setFocusHandlers = this.setFocusHandlers.bind(this);
    this.noteContent = '';
    this.pollNoteChange = true;
  }

  componentWillUnmount() {
    this.pollNoteChange = false;
  }

  render() {
    return (
      <View style={styles.container}>
        <RichTextEditor
          ref={(r)=>this.richtext = r}
          style={styles.richText}
          hiddenTitle={true}
          // at first initialContentHTML must be `''` otherwise we would get undefined
          initialContentHTML=''
          contentPlaceholder='Take a note...'
          editorInitializedCallback={() => this.onEditorInitialized()}
        />
      </View>
    );
  }

  onEditorInitialized() {
    // TODO: probably there is a better way to do it
    const navigationId = this.props.navigation.state.params.rowId;
    const {height} = Dimensions.get('window');

    if (navigationId) {
      const firstNote = this.props.state.notes[navigationId].content;
      // need to call `escapeHtml` here because otherwise the editor will fail if strings have ` ' ` in them. :(
      this.richtext._sendAction('SET_CONTENT_HTML', escapeHtml(firstNote));
    } else {
      // set height if totally empty, helps with keyboard pull up
      this.richtext._sendAction('SET_EDITOR_HEIGHT', height - 300);
    }

    this.setFocusHandlers();
    this.pollNoteChanges();
  }

  async getHTML() {
    if (this.richtext) {
      try {
        const contentHtml = await this.richtext.getContentHtml();
        if (this.noteContent !== contentHtml) {
          this.noteContent = contentHtml;
          console.log('Note updated:', this.noteContent);
        }
      } catch (e) {
        console.log('Failed to getContentHtml, editor probably closed.', e);
      }
    }
  }

  setFocusHandlers() {
    this.richtext.setContentFocusHandler(() => {
      console.log('content focus');
    });
  }

  pollNoteChanges() {
    this.getHTML();
    if (this.pollNoteChange) {
      setTimeout(() => {
        this.pollNoteChanges();
      }, 2000);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'transparent'
  },
  richText: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});



function mapStateToProps(state) {
  return {
    state
  };
}


export default connect(mapStateToProps)(RichTextExample)
