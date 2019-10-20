import React, { Component } from "react";
import { Row, Col, Spinner } from "reactstrap";
import {
  LocationOn,
  EventSeat,
  AccessTime,
} from "@material-ui/icons";
import Requests from "../../../../../Requests";
import "./eventContent.css";
import Cookie from "universal-cookie";

/**
 * This react component is responsible for displaying the content of each event.
 * If the arrow on the event card is pressed, the content becomes visible.
 * 
 * The content includes a countdown timer until the event is decided. 
 * It also has a column for the names of people who attended. 
 * In addition, the location and time of the event is also displayed.
 * 
 * @states keep track of whether the content is loaded successfully or not.
 * 
 */

const PageLabel = props => {
  return (
    <span className="memberSet">
      <Row>
        <Col>
          <button className="memberName">{props.name}</button>
        </Col>
      </Row>
    </span>
  );
};

const SideBar = props => {
  const attendees = props.attendees.map(person => (
    <PageLabel name={person.name} key={person.id} />
  ));
  return (
    <div className="eventSidebar mx-2 my-2">
      <div id="eventTitle">
        <h4>Attendees</h4>
      </div>
      {attendees}
    </div>
  );
};

const ErrorAlert = () => {
  return <div>Error</div>;
};

const EventCardHeader = props => {
  return (
    <div className="selectedEventHeader my-1 mx-2">
      <h3>{props.name}</h3>
    </div>
  );
};

class Clock extends Component {
  constructor(props) {
    super(props);
    this.state = {
      date: null,
      eventsReady: false
    };
  }

  componentDidMount() {
    this.timerID = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    let millis =
      new Date(this.props.till).getTime() - new Date(Date.now()).getTime();
    new Promise((resolve, reject) => {
      const days = Math.floor(millis / 8.64e7);
      millis %= 8.64e7;
      const hours = Math.floor(millis / 3.6e6);
      millis %= 3.6e6;
      const mins = Math.floor(millis / 60000);
      millis %= 60000;
      const secs = Math.floor(millis / 1000);
      const str = `${days}:${hours}:${mins}:${secs}`;
      resolve(str);
    }).then(str => {
      this.setState({
        eventsReady: true,
        date: str
      });
    });
  }

  render() {
    return (
      <div>
        {this.state.eventsReady ? (
          <h2>{this.state.date}</h2>
        ) : (
          <Spinner color="primary" />
        )}
      </div>
    );
  }
}

const CountDown = props => {
  return (
    <div>
      <h3>Event Finalizes in </h3>
      <div id="countDown" className="my-2">
        <Clock till={props.till} />
      </div>
    </div>
  );
};

const EventFinalCard = props => {
  const dateObj = new Date(parseInt(props.time));
  return (
    <div className="my-2">
      {dateObj.toLocaleString()} has attendance of {props.val}%
    </div>
  );
};

class EventFinalTimeInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: null,
      contentReady: false
    };
  }

  componentWillMount() {
    const sessionInfo = new Cookie().get("session-info");
    const options = {
      groupId: this.props.info.groupId,
      eventId: this.props.info.id,
      session: sessionInfo.session,
      num: 3
    };
    Requests.post("api/events/getbesttimes", options).then(data => {
      this.setState({ contentReady: true, content: data.body });
    });
  }

  render() {
    if (this.state.contentReady) {
      console.log(this.state.content);
      const events = Object.entries(this.state.content).map(entry => (
        <EventFinalCard time={entry[0]} val={entry[1]} />
      ));
      return <div className="topThreeEventTimes">{events}</div>;
    } else {
      return <Spinner color="primary" />;
    }
  }
}

class Content extends Component {
  render() {
    return (
      <div className="eventMainContent">
        <div className="metaContainer">
          <span className="metaGroup">
            <EventSeat className="mx-1" />
            <p>{this.props.selected.host.name}</p>
          </span>
          <span className="metaGroup">
            <LocationOn className="mx-1" />
            <p>{this.props.selected.location}</p>
          </span>
          <span className="metaGroup">
            <AccessTime className="mx-1" />
            <p>{this.props.selected.duration} Hrs.</p>
          </span>
        </div>
        {true ? (
          <div>
            <EventFinalTimeInfo info={this.props.selected} />
          </div>
        ) : (
          <CountDown till={this.props.selected.hammerDropTime} />
        )}
      </div>
    );
  }
}

class EventContent extends Component {
  constructor(props) {
    super(props);
    console.log(this.props.selected);
    this.state = {
      attensReady: false,
      attensError: false,
      attens: null
    };
  }

  componentWillMount() {
    const that = this;
    Requests.get(
      `api/events/load/${this.props.selected.groupId}/${
        this.props.selected.id
      }?data=["attendees"]`
    ).then(data => {
      if (data.status === 200) {
        that.setState({ attensReady: true, attens: data.body.attendees });
      } else {
        that.setState({ attensError: true });
      }
    });
  }

  render() {
    return (
      <Col>
        <div className="sEventCard">
          <EventCardHeader name={this.props.selected.eventName} />
          <div className="sEventCardBody">
            <Content selected={this.props.selected} />
            {this.state.attensReady ? (
              <SideBar attendees={this.state.attens} />
            ) : this.state.attensError ? (
              <ErrorAlert />
            ) : (
              <div className="eventSidebar spinnerContainer">
                <Spinner color="primary" />
              </div>
            )}
          </div>
        </div>
      </Col>
    );
  }
}

export default EventContent;
