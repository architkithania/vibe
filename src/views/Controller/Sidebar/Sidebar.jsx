import React, { Component } from "react";
import { Row, Col } from "reactstrap";
import { Dashboard, Group, AccountCircle } from "@material-ui/icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import "./sidebar.css";

/**
 * This react component is responsible for displaying the sidebar on the website.
 * The sidebar consists of 4 pages: Dashboard, Groups, Explore and Account.
 * The sidebar has 4 names and 4 icons for each page that change color when user
 * hovers on them. Also, when clicked, the corresponding name's and icon's background
 * is change to light grey to indicate that you are on this page.
 * 
 * When the screens is small, the sidebar becomes a humburgermenu that the user
 * can click on for the sidebar to appear. This allows the website to have a good 
 * UI even on small devices.
 */

const PageLabel = props => {
  return (
    <span className="setName">
      <Row>
        <Col sm={2} id="icons">
          {props.children}
        </Col>
        <Col sm={10}>
          <button
            className={"pageName " + (props.selected ? "selected" : "")}
            onClick={() => props.changeSelect(props.name)}>
            {props.name}
          </button>
        </Col>
      </Row>
    </span>
  );
};

function hamburgermenu(e) {
  let dropdownItems = document.getElementById("sidebar");

  if (dropdownItems.style.display === "none") {
    dropdownItems.style.display = "flex";
  } else {
    dropdownItems.style.display = "none";
  }
}

let currentWidth = window.innerWidth;
window.addEventListener("resize", () => {
  let newWidth = window.innerWidth;
  if(newWidth > 1200 && currentWidth <= 1200)
    document.getElementById("sidebar").style.display = "flex"
  else if(newWidth <= 1200 && currentWidth > 1200)
    document.getElementById("sidebar").style.display = "none"
  currentWidth = newWidth;
  });

class Sidebar extends Component {
  render() {
    return (
      <div>
        <img
          id="burgerIcon"
          src="https://cdn4.iconfinder.com/data/icons/wirecons-free-vector-icons/32/menu-alt-512.png"
          alt=""
          onClick={e => hamburgermenu(e)}
        />
        <div id="sidebar">
          <PageLabel
            name="Dashboard"
            selected={this.props.selected === "Dashboard"}
            changeSelect={change => this.props.changeSelect(change)}>
            <Dashboard className="icon" />
          </PageLabel>
          <PageLabel
            name="Groups"
            selected={this.props.selected === "Groups"}
            changeSelect={change => this.props.changeSelect(change)}>
            <Group className="icon" />
          </PageLabel>
          <PageLabel
            name="Explore"
            selected={this.props.selected === "Explore"}
            changeSelect={change => this.props.changeSelect(change)}>
            <FontAwesomeIcon icon="compass" className="icon" id="compassIcon"/>
          </PageLabel>
          <PageLabel
            name="Account"
            selected={this.props.selected === "Account"}
            changeSelect={change => this.props.changeSelect(change)}>
            <AccountCircle className="icon" />
          </PageLabel>
        </div>
      </div>
    );
  }
}

export default Sidebar;
