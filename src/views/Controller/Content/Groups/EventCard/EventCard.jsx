import React, { Component } from "react";
import { Spinner, CardTitle, CardBody, Button, Col, Row } from "reactstrap";
import {
  SupervisedUserCircle,
  Check,
  KeyboardArrowDown,
  KeyboardArrowUp,
  CheckCircleOutline
} from "@material-ui/icons";
import "./eventCard.css";
import Cookie from "universal-cookie";
import Requests from "../../../../../Requests";

/**
 * This react component displays each event in its own card. 
 * Each card has the name of the event and a column that includes 
 * the names of people who joined this event.
 * The name of the host is also displayed.
 * The card also has a countdown until the event is decided.
 * 
 * The class EventCard has states that keep track of whether the card's arrow
 * was pressed or not.
 * 
 * The required data is fetched using a back-end request and if response was
 * 200 or 201, this means the data is successfully fetched. Otherwise, an error
 * has occurred.
 */

const BadgeIcon = props => {
  return <div className="circle grpEvtBdg">{props.number}</div>;
};

class EventCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: false,
      eventReady: true,
      eventInfo: null,
      eventInfoIsOpen: false,
      loadingJoin: false,
      added: false,
      arrowUp: false
    };
  }

  changeSelect() {
    if (this.state.eventInfoIsOpen) {
      this.setState({ eventInfoIsOpen: false, arrowUp: false });
      this.props.changeSelect(null);
    } else {
      this.setState({ eventInfoIsOpen: true, arrowUp: true });
      this.props.changeSelect(this.props.info);
    }
  }

  handleJoin() {
    this.setState({ loading: true });
    const sessionInfo = new Cookie().get("session-info");
    const options = {
      eventId: this.props.info.id,
      id: sessionInfo.id,
      name: sessionInfo.firstName + " " + sessionInfo.lastName,
      groupId: this.props.info.groupId,
      session: sessionInfo.session
    };
    Requests.post("api/events/join", options).then(data => {
      if (data.status === 200 || data.status === 201)
        this.setState({ loading: false, added: true });
    });
  }

  render() {
    let arrow;
    console.log(this.state.arrowUp);
    return (
      <Col>
        <div className="groupEventCard">
          <CardBody>
            <CardTitle className="eventCardTitle">
              {this.props.info.eventName}
            </CardTitle>
            <Row>
              <Col>Hosted by {this.props.info.host.name}</Col>
            </Row>
            <Row>
              {this.state.added ? (
                <CheckCircleOutline className="addedCheck" />
              ) : this.state.loading ? (
                <Spinner color="primary" />
              ) : (
                <Button
                  color="primary"
                  className="eventJoinButton"
                  onClick={() => this.handleJoin()}
                >
                  Join
                </Button>
              )}
              <Col className="cardInfoBarContainer">
                <div className="cardEventIcons">
                  <Check className="mr-1" />
                  <div>
                    <SupervisedUserCircle />
                    <BadgeIcon number={this.props.info.attendees} />
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col className="arrowInCard">
                <span className="innerhighspan2">
                  <span className="iconbg2">
                    {this.state.arrowUp ? (
                      <KeyboardArrowUp
                        className="headerIcon2 spinnerAni"
                        onClick={() => this.changeSelect()}
                      />
                    ) : (
                      <KeyboardArrowDown
                        className="headerIcon2 spinnerAni"
                        onClick={() => this.changeSelect()}
                      />
                    )}
                  </span>
                </span>
              </Col>
            </Row>
          </CardBody>
        </div>
      </Col>
    );
  }
}

export default EventCard;
