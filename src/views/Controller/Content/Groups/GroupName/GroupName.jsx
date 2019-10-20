import React, { Component } from "react";
import { Row, Col, Card, CardBody, CardText } from "reactstrap";
import "./groupName.css";

/**
 * This react component is responsible for displaying the groups the user joined.
 * It gives each group a random color to help user differentiate between different groups.
 * 
 * @states
 * - colorChoices are the set of colors to be chosen from.
 */

const CircleIcon = props => {
  return <div className="circle" style={{ backgroundColor: props.color }} />;
};

class GroupName extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: true
    };
    this.colorChoices = ["orange", "green", "red", "blue", "purple"];
  }

  render() {
    return (
      <div>
        <Card onClick={() => this.props.changeSelect({name: this.props.name, id: this.props.id})} className="nameCard my-2">
          <CardBody>
            <Row>
              <Col>
                <CircleIcon
                  color={
                    this.colorChoices[
                      Math.floor(Math.random() * this.colorChoices.length)
                    ]
                  }
                />
              </Col>
              <Col>
                <CardText>              
                  {this.props.name}
                </CardText>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </div>
    );
  }
}

export default GroupName;
