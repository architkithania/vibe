import React, { Component } from "react";
import { Row, Col } from "reactstrap";
import Toolbar from "./Toolbar/Toolbar";
import Sidebar from "./Sidebar/Sidebar";
import Content from "./Content/Content";
import './controller.css'

/**
 * This react component is responsible for rendering the 3 parts of our website:
 * - Toolbar
 * - Sidebar
 * - Content: consists of the different pages like Dashboard, Groups, etc
 */

class Controller extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 'Dashboard'
    }
  }

  changeSelect(newSelect) {
    this.setState({currentPage:newSelect});
  }

  render() {
    return (
      <div className="controller">
        <Row>
          <Col>
            <Toolbar acceptLogout={this.props.acceptLogout}/>
          </Col>
        </Row>
        <Row>
          <Col>
            <Sidebar selected={this.state.currentPage} changeSelect={(change) => this.changeSelect(change)}/>
          </Col>
          <Col id="content">
            <Content selected={this.state.currentPage}/>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Controller;
