import React, { Component } from 'react';
import Cookie from 'universal-cookie'
import Authentication from './views/Authentication/Authentication';
import Controller from './views/Controller/Controller'

/**
 * Renders the controller that in turn renders the app components
 */
class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      view: 'login'
    }
  }

  acceptLogin() {
    this.setState({view: 'controller'});
  }

  acceptLogout() {
    this.setState({view: 'login'});
    (new Cookie()).remove('session-info');
  }

  render() {
    if (this.state.view === 'login') {
      return (
        <Authentication acceptLogin={() => this.acceptLogin()} />
      );
    }
    else {
      return (
        <Controller acceptLogout={() => this.acceptLogout()}/>
      );
    }
  }
}

export default App;
