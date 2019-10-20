import React, { Component } from "react";
import {
  Form,
  FormGroup,
  Input,
  FormFeedback,
  Button,
  Spinner
} from "reactstrap";
import Cookie from 'universal-cookie'
import Requests from '../../../Requests'
import vibe from '../../../vibe.png'
import "./login.css";

/**
 * This react component is the sign in page.
 * The data is tested for valid format in the front-end before sending them to the back-end.
 * 
 * If credentials are valid, then data.status = 200.
 * If an error occurs, data.status = 403 or 404 depending on the error.
 * 
 * @state checks the state of Username and password.
 * @param are:
 * Username
 * Password
 */

class LoginHandler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLogin: true,
      incorrectPassword: false,
      incompletePassword: false,
      incompleteUser: false,
      loading: false
    };
  }

  handleLogin(e) {
    var that = this;
    async function main() {
      const username = document.getElementById("userNameInput").value;
      const password = document.getElementById("passwordInput").value;
      if (username === "") {
        that.setState({
          incompleteUser: true
        });
      }
      else {
        that.setState({incompleteUser: false});
      }
      if (password === "") {
        that.setState({
          incompletePassword: true
        });
      }
      else {
        that.setState({incompletePassword: false});
      }
      if (username === "" || password === "") return;
      const options = {
        userName: username,
        password: password
      };
      Requests.post("api/authuser/login", options).then(data => {
        if (data.status === 403 || data.status === 404) {
          that.setState({
            loading: false,
            incorrectPassword: true
          });
        }
        if (data.status === 200) {
          const sessionCookie = new Cookie();
          sessionCookie.set('session-info', data.body);
          that.props.acceptLogin();
        }
      })
      that.setState({loading:true});
    }
    main();
  }

  loadSignup() {
    this.props.changeMethod("signup");
  }

  render() {
    let buttonArea;
    const passwordError = this.state.incorrectPassword
      ? "Invalid Credentials"
      : "Password is Required";
    if (this.state.loading) {
      buttonArea = (
        <Spinner color="primary" />
      );
    }
    else {
      buttonArea = (
        <Button
          color="primary"
          id="login-button"
          onClick={e => this.handleLogin(e)}
        >
          Submit
        </Button>
      );
    }
    return (
      <div className="form">
        <img src={vibe} id="vibe-logo1" alt="vibe logo" />
        <Form>
          <FormGroup>
            <Input
              type="text"
              name="text"
              placeholder="Username"
              id="userNameInput"
              autoComplete="false"
              invalid={this.state.incompleteUser}
            />
            <FormFeedback>Username is Required</FormFeedback>
          </FormGroup>
          <FormGroup>
            <Input
              type="password"
              name="password"
              placeholder="Password"
              id="passwordInput"
              invalid={
                this.state.incompletePassword || this.state.incorrectPassword
              }
            />
            <FormFeedback>{passwordError}</FormFeedback>
          </FormGroup>
          <div>{buttonArea}</div>
        </Form>
        <button id="create-account" onClick={() => this.loadSignup()}>Create Account</button>
      </div>
    );
  }
}

export default LoginHandler;
