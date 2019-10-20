import React, { Component } from 'react';
import Requests from '../../../../Requests';
import Cookie from 'universal-cookie';
import './account.css';
import { Spinner } from 'reactstrap';
import { Redirect } from 'react-router-dom';

/**
 * This react component is the account page. It displays the user's personal information
 * and account information. The user can also upload his profile picture to his account.
 * 
 * The user can authorize vibe to access his google calender by click "authorize calender".
 * 
 * @states keep track of the user's info by getting them from the back-end.
 */

const Row = props => {
  return (
    <div className='datarow'>
      <h3 className='leftdata'>{props.title}</h3>
      <p className='rightdata'>{props.data}</p>
    </div>
  );
};

class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorLoadingInfo: false,
      infoReady: false,
      info: null,
      selected: null,
      groupsarray: []
    };
    this.sessionInfo = null;
  }

  componentWillMount() {
    const sessionInfo = new Cookie().get('session-info');
    // console.log(JSON.stringify(sessionInfo, null, 2));
    const options = {
      id: sessionInfo.id,
      session: sessionInfo.session,
      dataNeeded: [
        'email',
        'firstName',
        'isCalLinked',
        'lastName',
        'profilePicture',
        'userId',
        'userName',
        'groups'
      ]
    };
    Requests.post('api/users/load', options).then(data => {
      console.log('data.body: ' + JSON.stringify(data.body, null, 2));
      if (data.status === 200) {
        this.setState({ infoReady: true, info: data.body });
        let groupsarray = [];
        if(this.state.info !== null && this.state.info !== undefined) {

          for (let i in this.state.info.groups) {
            if (this.state.info.groups.hasOwnProperty(i)) {
              groupsarray.push(this.state.info.groups[i].name);
            }
          }
          this.setState({ groupsarray: groupsarray });
        } else {
          this.setState({ errorLoadingInfo: true });
          console.log(data.status + ': Error loading info');
        }
      }
      });
    }

  perInfClick(e) {
    let perInf = document.getElementById('perInf');
    let accInf = document.getElementById('accInf');
    let perInfContent = document.getElementById('perInfContent');
    let accInfContent = document.getElementById('accInfContent');
    let img1 = document.getElementById('picbox');
    img1.style.display = 'flex';
    perInfContent.style.display = 'block';
    accInfContent.style.display = 'none';
    perInf.style.borderBottom = '5px solid #F7AB0A';
    perInf.style.borderRadius = '5px';
    perInf.style.color = '#F7AB0A';
    accInf.style.color = 'black';
    perInf.style.transition = '0.2s';
    accInf.style.borderBottom = 'none';
  }

  accInfClick(e) {
    let perInf = document.getElementById('perInf');
    let accInf = document.getElementById('accInf');
    let perInfContent = document.getElementById('perInfContent');
    let accInfContent = document.getElementById('accInfContent');
    let img1 = document.getElementById('picbox');
    img1.style.display = 'flex';
    perInfContent.style.display = 'none';
    accInfContent.style.display = 'block';
    accInf.style.borderBottom = '5px solid #F7AB0A';
    accInf.style.borderRadius = '5px';
    accInf.style.color = '#F7AB0A';
    accInf.style.transition = '0.2s';
    perInf.style.color = 'black';
    perInf.style.borderBottom = 'none';
  }

  imageupload(e) {
    document
      .querySelector('input[type="file"]')
      .addEventListener('change', function() {
        if (this.files && this.files[0]) {
          var img = document.querySelector('#pic'); // $('img')[0]
          img.src = URL.createObjectURL(this.files[0]); // set src to file url
          let img1 = document.getElementById('picInput');
          let img2 = document.getElementById('pic');
          img2.style.display = 'flex';
          img1.style.opacity = '0';
        }
      });
  }

  handleClick = () => {
    // const duckduckgo = 'http://duckduckgo.com';
    // window.location.assign(duckduckgo);
    Requests.get(
      'api/calendars/generate?userId=' + this.state.info.userId
    ).then(data => {
      window.location.assign(data.body);
    });
  };

  render() {
    if (this.state.infoReady) {
      console.log('cal linked: ' + this.state.info.isCalLinked);
      return (
        <div id='container'>
          <div id='settings'>
            <button
              className='headings'
              id='perInf'
              onClick={e => this.perInfClick(e)}>
              <h2>Personal Info</h2>
            </button>
            <button
              className='headings'
              id='accInf'
              onClick={e => this.accInfClick(e)}>
              <h2>Account Info</h2>
            </button>
          </div>
          <div id='picbox'>
            <input
              type='file'
              onClick={e => this.imageupload(e)}
              id='picInput'
            />
            <br />
            <img id='pic' src='' />
          </div>
          <div id='perInfContent'>
            <div className='data'>
              <Row title='First Name:' data={this.state.info.firstName} />
              <Row title='Last Name:' data={this.state.info.lastName} />
              <Row title='Email:' data={this.state.info.email} />
            </div>
          </div>
          <div id='accInfContent'>
            <div className='data'>
              <Row title='User Name:' data={this.state.info.userName} />
              <Row title='ID:' data={this.state.info.userId} />
              {/* <div className='datarow'>
                <h3 className='leftdata'>Password:</h3>
                <button id='password' className='rightdata'>
                  Change Password
                </button>
              </div> */}
              <Row title='Groups:' data={this.state.groupsarray.join(', ')} />
            </div>
            <div>
              {this.state.info.isCalLinked ? (
                null
              ) : (
                <button id='authorizebutton' onClick={this.handleClick}>
                  Authorise Google Calendar
                </button>
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className='groups'>
          <Spinner color='primary' id='groupSpinner' />
        </div>
      );
    }
  }
}

export default Account;
