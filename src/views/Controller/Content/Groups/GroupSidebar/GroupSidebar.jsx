import React, { Component } from "react";
import { Row, Col, Spinner } from "reactstrap"
import Requests from "../../../../../Requests"
import "./groupSidebar.css";

/**
 * This react component displays the members in the group
 */

const CircleIcon = props => {
  return <div className="memberCircle" style={{ backgroundColor: props.color }} />;
};

const PageLabel = props => {
  return (
    <span className="memberSet">
      <Row>
        <Col sm={2}>
          <CircleIcon color="#5cb85c" />
        </Col>
        <Col sm={10}>
          <button className="memberName">{props.name}</button>
        </Col>
      </Row>
    </span>
  );
};

class GroupSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      membersReady: false,
      members: null
    };
  }

  componentWillMount() {
    Requests.get(`api/groups/load/${this.props.selected.id}?data=["members"]`).then(data => {
      this.setState({membersReady:true, members:data.body.members})
    })
  }

  render() {
    if (this.state.membersReady) {
      const members = this.state.members.map(member => <PageLabel key={member.id} name={member.name} />)
      return (
        <div className="memberSidebar">
          <div id="membersTitle">
            <h4>Members</h4>
          </div>
          {members}
        </div>
      );
    }
    else {
      return (
        <div className="memberSpinnerContainer memberSidebar">
          <Spinner color="primary" id="memberSpinner" />
        </div>
      );
    }
  }
}

export default GroupSidebar;
