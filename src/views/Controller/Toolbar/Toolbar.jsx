import React, { Component } from "react";
import vibe from "../../../vibe_small.png";
import {
  Navbar,
  Nav,
  NavItem,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Input
} from "reactstrap";
import {
  SettingsOutlined,
  NotificationsOutlined,
  Search
} from "@material-ui/icons";
import "./toolbar.css";

/**
 * This react component is the toolbar of the website. The toolbar consists of 
 * Vibe logo, search bar, notification icon and settings icon.
 * In the settings icon, the user can log out.
 */

class Toolbar extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      isOpen: false
    };
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  handleNot() {
    console.log("handled");
  }

  render() {
    return (
      <div id="toolbar">
        <Navbar color="transparent" light expand="md">
          <Nav className="navbar" navbar>
            <NavItem>
              <img src={vibe} id="vibe-logo" alt="Vibe Logo" />
            </NavItem>
              <NavItem>
                <Input
                  id="search-bar"
                  placeholder="Search"
                  className="navbar-icons"
                />
              </NavItem>
              <NavItem>
                <Search className="navbar-icons" id="search-icon" />
              </NavItem>
            <UncontrolledDropdown nav inNavbar id="nav-4">
              <DropdownToggle nav id="notification-icon">
                <NotificationsOutlined className="navbar-icons" />
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem>Notif1</DropdownItem>
                <DropdownItem>Notif2</DropdownItem>
                <DropdownItem>Notif3</DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
            <UncontrolledDropdown nav inNavbar>
              <DropdownToggle nav id="settings-icon">
                <SettingsOutlined className="navbar-icons" />
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem
                  className="text-danger"
                  onClick={() => this.props.acceptLogout()}>
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          </Nav>
        </Navbar>
      </div>
    );
  }
}

export default Toolbar;
