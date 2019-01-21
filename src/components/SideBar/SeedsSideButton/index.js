import React, { Component } from 'react';
import { connect } from 'react-redux';

import SideBarButton from 'components/Core/SideBarButton';
import icon from './seed-icon.png';
import { switchToList } from '../../../state';

class SeedsButton extends Component {
  render() {
    return <SideBarButton active={this.props.active} img={icon} onClick={this.props.onClick} />;
  }
}

const mapStateToProps = state => {
  return {
    active: state.listView === 'Seeds'
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onClick: () => {
      dispatch(switchToList('Seeds'));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SeedsButton);
