import React, { Component } from "react";
import {
  Form,
  FormGroup,
  Input,
  FormFeedback,
  Button,
  Spinner,
  Alert
} from "reactstrap";
import Requests from "../../../Requests";
import vibe from "../../../vibe.png";
import "./signup.css";

/**
 * This react component is the sign up page.
 * If credentials are valid, then data.status = 201.
 * If there is an error, then data.status = 400.
 * If the user is already signed in, data.status = 409.
 * 
 * @state checks the state of each of the user's input.
 * @param are:
 * First name
 * Last name
 * User name
 * Password
 * Email
 */

class SignupHandler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      incompletePassword: false,
      userAlreadyInUse: false,
      incompleteUser: false,
      incompleteFirstName: false,
      incompleteLastName: false,
      incompleteEmail: false,
      loading: false,
      validSignUp: false,
      formatError: false,
    };  
  }

  handleSignup(e) {
    var that = this;
    async function main() {
      that.setState({
        incompletePassword: false,
        userAlreadyInUse: false,
        incompleteUser: false,
        incompleteFirstName: false,
        incompleteLastName: false,
        incompleteEmail: false,
        loading: false,
        validSignUp: false,
        formatError: false
      })
      const username = document.getElementById("userNameInput").value;
      const password = document.getElementById("passwordInput").value;
      const email = document.getElementById("emailInput").value;
      const firstname = document.getElementById("firstNameInput").value;
      const lastname = document.getElementById("lastNameInput").value;
      if (username === "") {
        that.setState({
          incompleteUser: true
        });
      }
      if (password === "") {
        that.setState({
          incompletePassword: true
        });
      }
      if (email === "") {
        that.setState({
          incompleteEmail: true
        });
      }
      if (firstname === "") {
        that.setState({
          incompleteFirstName: true
        });
      }
      if (lastname === "") {
        that.setState({
          incompleteLastName: true
        });
      }
      if ([firstname, lastname, email, password, username].includes('')) return;
      const options = {
        userName: username,
        password: password,
        firstName: firstname,
        lastName: lastname,
        email: email
      };
      Requests.post("api/authuser/signup", options).then(data => {
        if (data.status === 400) {
          that.setState({
            loading:false,
            formatError: true
          });
        }
        if (data.status === 409) {
          that.setState({
            userAlreadyInUse: true,
            loading: false
          });
        }
        if (data.status === 201) {
          that.setState({
            loading: false,
            validSignUp: true
          })
        }
      });
      that.setState({ loading: true });
    }
    main();
  }

  loadLogin() {
    this.props.changeMethod("login");
  }

  render() {
    const userNameError = (this.state.userAlreadyInUse ? 'Username unavailable' : 'Username is Required');
    let buttonArea;
    if (this.state.loading) {
      buttonArea = <Spinner color="primary" />;
    } else {
      buttonArea = (
        <Button
          color="primary"
          id="login-button"
          onClick={(e) => this.handleSignup(e)}
        >
          Submit
        </Button>
      );
    }
    const color = (this.state.formatError ? 'danger' : 'success')
    const msg = (this.state.formatError ? 'Incorrect Formats' : 'User Created')
    const messageBox = (this.state.validSignUp || this.state.formatError ? <Alert color={color}>{msg}</Alert> : null);
    return (
      <div className="form">
        <img src={vibe} id="vibe-logo2" alt="vibe logo" />
        <Form>
          <FormGroup>
            <Input
              type="text"
              name="firstName"
              placeholder="First Name"
              id="firstNameInput"
              invalid={this.state.incompleteFirstName}
            />
            <FormFeedback>First Name is Required</FormFeedback>
          </FormGroup>
          <FormGroup>
            <Input
              type="text"
              name="lastName"
              placeholder="Last Name"
              id="lastNameInput"
              invalid={this.state.incompleteLastName}
            />
            <FormFeedback>Last Name is Required</FormFeedback>
          </FormGroup>
          <FormGroup>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              id="emailInput"
              invalid={this.state.incompleteEmail}
            />
            <FormFeedback>Email is Required</FormFeedback>
          </FormGroup>
          <FormGroup>
            <Input
              type="text"
              name="text"
              placeholder="Username"
              id="userNameInput"
              invalid={this.state.incompleteUser || this.state.userAlreadyInUse}
            />
            <FormFeedback>{userNameError}</FormFeedback>
          </FormGroup>
          <FormGroup>
            <Input
              type="password"
              name="password"
              placeholder="Password"
              id="passwordInput"
              invalid={
                this.state.incompletePassword
              }
            />
            <FormFeedback>Password is Required</FormFeedback>
          </FormGroup>
          <div>{buttonArea}</div>
        </Form>
        {messageBox}
        <button id="create-account" onClick={() => this.loadLogin()}>
          Login Instead
        </button>
      </div>
    );
  }
}

export default SignupHandler;
