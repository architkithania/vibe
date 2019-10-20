import React, { Component } from "react";
import LoginHandler from "./Login/LoginHandler";
import SignupHandler from './Signup/SignupHandler'

/**
 * This react component renders the either the sign in or sign up component.
 * If page is loaded for first time, then the sign in page is shown. 
 * If user clicks on create account, then the sign up page is rendered.
 * 
 * @state checks which page to load.
 */

class Authentication extends Component {
  constructor(props) {
    super(props);
    this.state = {
      method: "login"
    };
  }

  changeMethod(newMethod) {
    this.setState({ method: newMethod });
  }

  render() {
    if (this.state.method === "login") {
      return (
        <LoginHandler acceptLogin={() => this.props.acceptLogin()} changeMethod={(met) => this.changeMethod(met)}/>
      );
    }
    else {
      return (
        <SignupHandler changeMethod={(met) => this.changeMethod(met)}/>
      );
    }
  }
}

export default Authentication;