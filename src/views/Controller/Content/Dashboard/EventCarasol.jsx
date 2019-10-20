import React, { Component } from "react";
import {
  Row,
  Spinner,
  Alert
} from "reactstrap";
import Cookie from 'universal-cookie';
import { Error } from "@material-ui/icons";
import Requests from "../../../../Requests";
import "./dashboard.css";

/**
 * This react component gets the events of the user from the back-end. 
 * These events are summarised into individual cards inside the events container.
 * 
 * This allows the user to see all the events he is enrolled in.
 * 
 * @states keeps track of whether the events are loaded successfully or not.
 */

const EventCard = props => {
  return (
  
      <div className="eventCard">
          <div>{props.title}</div>
          <div>{props.text}</div>
      </div>
  
  );
};

class EventCarasol extends Component {
  constructor(props) {
    super(props);
    this.state = {
      eventsReady: false,
      eventLoadError: false,
      eventsArray : [],
    };
  }

  componentWillMount() {
    const sessionInfo = new Cookie().get('session-info');
    const options = {
      id : sessionInfo.id,
      session: sessionInfo.session,
      dataNeeded: ["groups"]
    };
    Requests.post("api/users/load",options).then(data => {
      if (data.status === 200){
        this.setState({ eventsReady: true});
        let events = [];
        Object.entries(data.body.groups).forEach(entry => {
          const [key, val] = entry;
          if (val.hasActiveEvents && (val.events !== null && val.events !== undefined)) {
            Object.entries(val.events).forEach(async en => {
              const [eKey, eVal] = en;
              Requests.get(`api/events/load/${val.id}/${eKey}?data=["eventName", "attendees"]`).then(data => {
                if (data.status == 200) {
                  events.push(data.body);
                  this.setState({eventsArray:events});
                }
                console.log(events);
              });
            });
          }
        })
    }
      else {
        this.setState({ eventLoadError: true });
      }
    });
  }
  render() {
    if (this.state.eventsReady) {
      console.log(this.state.eventsArray);
      const events = this.state.eventsArray.map(event => {
        return (
          <div >
          <div className="">
              <EventCard title={event.eventName} text="" key={event.eventId}/>
          </div>
          </div>
        )
      })
      return (
        <div className="eventCarasol3">
          <Row>
            {events}
          </Row>
        </div>
      );
    } else if (this.state.eventLoadError) {
      return (
        <div className="eventCarasol">
          <Alert color="dark">
            <Error id="errorIcon"/> 
            Cannot Load Events
          </Alert>
        </div>
      );
    } else {
      return (
        <div className="eventCarasol">
          <Spinner color="primary" id="eventSpinner" />
        </div>
      );
    }
  }
}

export default EventCarasol;
