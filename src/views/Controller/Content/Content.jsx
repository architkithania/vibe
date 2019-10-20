import React, { Component } from 'react'
import Dashboard from './Dashboard/Dashboard'
import Groups from './Groups/Groups'
import Explore from './Explore/Explore'
import Account from './Account/Account'
import './content.css'

/**
 * This react component renders the content of the website based on which page is clicked.
 * There is Dashboard, Groups, Explore and Account pages that the user can 
 * click on in the sidebar.
 */

class Content extends Component {
  render() {
      switch(this.props.selected) {
        case 'Dashboard':
          return <Dashboard className="content" />
        case 'Groups':
          return <Groups className="content"/>
        case 'Explore':
          return <Explore className="content"/>
        case 'Account':
          return <Account className="content"/>
        default:
          return <Dashboard className="content"/>
      }
  }
}

export default Content;