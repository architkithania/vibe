import React, { Component } from "react";
import {
  Row,
  Col,
  Spinner,
  Alert,
  Form,
  FormGroup,
  Input,
  FormFeedback,
  Button
} from "reactstrap";
import Cookie from "universal-cookie";
import EventCard from "../EventCard/EventCard";
import { ArrowBackIos, Error, Add, Create } from "@material-ui/icons";
import GroupSidebar from "../GroupSidebar/GroupSidebar";
import EventContent from "../EventContent/EventContent";
import "./groupContent.css";
import Requests from "../../../../../Requests";

/**
 * This react component is responsible for the content of each group. 
 * When clicking on the desired group, the events and members of the group 
 * are fetched using a back-end request. These data are then splitted to different 
 * cards to be displayed. 
 * There is a column on the right that shows all the members in the group.
 * At the centre, the events that the group is hosting is displayed, each in its
 * own card.
 * There is an icon for the user to make new events and an arrow to go back to previous page.
 * 
 * @states check whether the content is loaded successfully or not.
 * Also, the icon pressed change the state so that the website reacts correctly with
 * the user's behaviour.
 */

const GroupHeader = props => {
  return (
    <Row className="my-4">
      <Col sm={1}>
        <span className="iconbg" onClick={() => props.changeSelect(null)}>
          <ArrowBackIos id="backIcon" />
        </span>
      </Col>
      <Col sm={11} id="groupContainer">
        <h3>{props.selected.name}</h3>
      </Col>
    </Row>
  );
};

class GroupContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      eventsReady: false,
      eventsError: false,
      events: null,
      isEventSelcted: false,
      selectedEventInfo: null,
      addEvent: false,
      createEvent: false,
      loading: false
    };
    this.sessionInfo = null;
  }

  componentWillMount() {
    Requests.get(
      `api/groups/load/${this.props.selected.id}?data=["events"]`
    ).then(data => {
      if (data.status === 200) {
        this.setState({
          eventsReady: true,
          events: data.body.events
        });
      } else {
        this.setState({ eventsError: true });
      }
    });
  }

  createEvent(e) {
    this.setState({ createEvent: true });
    let groupContent = document.getElementById("groupContentinner");
    groupContent.style.opacity = "0.2";
  }

  reloadPage() {
    Requests.get(
      `api/groups/load/${this.props.selected.id}?data=["events"]`
    ).then(data => {
      if (data.status === 200) {
        this.setState({eventsReady: true, events: data.body.events, loading: false, createEvent: false})
      }
      else {
        this.setState({eventsError: true});
      }
    })
  }

  handleLogin(e) {
    this.setState({loading: true});
    let groupContent = document.getElementById("groupContentinner");
    let eventName = document.getElementById("eventName").value;
    let startTimeX = document.getElementById("startTime").value;
    let startTimeY = new Date(startTimeX);
    let startTime = startTimeY.toISOString();
    let endTimeX = document.getElementById("endTime").value;
    let endTimeY = new Date(endTimeX);
    let endTime = endTimeY.toISOString();
    let hammerDropTimeX = document.getElementById("hammerDropTime").value;
    let hammerDropTimeY = new Date(hammerDropTimeX);
    let hammerDropTime = hammerDropTimeY.toISOString();
    let duration = document.getElementById("duration").value;
    let location = document.getElementById("location").value;
    let type = document.getElementById("type").value;
    let description = document.getElementById("description").value;
    groupContent.style.opacity = "1";
    this.sessionInfo = new Cookie().get("session-info");
    const options = {
      groupId: this.props.selected.id,
      eventName: eventName,
      host: {
        id: this.sessionInfo.id,
        name: this.sessionInfo.firstName + " " + this.sessionInfo.lastName
      },
      startTime: startTime,
      endTime: endTime,
      hammerDropTime: hammerDropTime,
      duration: duration,
      location: location,
      type: type,
      description: description,
      session: this.sessionInfo.session
    };
    Requests.post("api/events/create", options).then(data => {
      if (data.status === 201) {
        this.reloadPage();
      }
    });
  }

  changeSelect(eventInfo) {
    if (eventInfo == null) {
      this.setState({ isEventSelcted: false, selectedEventInfo: null });
    } else {
      this.setState({
        isEventSelcted: true,
        selectedEventInfo: eventInfo
      });
    }
  }
  closeForm(e) {
    let groupContent = document.getElementById("groupContentinner");
    groupContent.style.opacity = "1";
    this.setState({ createEvent: false });
  }

  render() {
    let buttonArea;
    if (this.state.loading) {
      buttonArea = <Spinner color="primary" />;
    } else {
      buttonArea = (
        <Button
          color="primary"
          id="createGroupButton"
          onClick={e => this.handleLogin(e)}>
          Create
        </Button>
      );
    }
    if (this.state.eventsReady) {
      const events =
        this.state.events.length !== 0 ? (
          this.state.events.map(event => (
            <EventCard
              info={event}
              key={event.id}
              changeSelect={name => this.changeSelect(name)}
            />
          ))
        ) : (
          <h3>No Events</h3>
        );
      return (
        <div id="groupContent">
          <div id="groupContentinner">
            <Row>
              <Col sm={9}>
                <GroupHeader
                  selected={this.props.selected}
                  changeSelect={name => this.props.changeSelect(name)}
                />
                <Row>
                  <Col>
                    <h3 id="eventsTitle">Events</h3>
                  </Col>
                  <Col>
                    <span className="innerhighspan">
                      {/* <span className="iconbg" onClick={e => this.addEvent(e)}>
                        <Add className="headerIcon" />
                      </span> */}
                      <span
                        className="iconbg"
                        onClick={e => this.createEvent(e)}>
                        <Create className="headerIcon" />
                      </span>
                    </span>
                  </Col>
                </Row>
                <Row id="eventsContainter">{events}</Row>
                <Row>
                  {this.state.isEventSelcted ? (
                    <EventContent selected={this.state.selectedEventInfo} />
                  ) : null}
                </Row>
              </Col>
              <Col sm={3}>
                <GroupSidebar selected={this.props.selected} />
              </Col>
            </Row>
          </div>
          <div>
            {this.state.createEvent ? (
              <div id="upperLayerGroups" className="upper-layer-groups pt-5">
              <div id="closeButtondiv">
              <img id="closeButton" src="https://image.flaticon.com/icons/png/512/69/69324.png" onClick={e => this.closeForm(e)}/>
              </div>
                <Form>
                  <FormGroup>
                    <Input
                      type="text"
                      name="text"
                      placeholder="Event Name"
                      id="eventName"
                      autoComplete="false"
                      invalid={this.state.incompleteGroupName}
                    />
                    <FormFeedback>Group Name is Required</FormFeedback>
                  </FormGroup>
                  <FormGroup>
                    <Input
                      type="datetime-local"
                      name="date"
                      placeholder="Start Time"
                      id="startTime"
                      invalid={this.state.incompleteTags}
                    />
                    <FormFeedback>Input atleast 3 tags</FormFeedback>
                  </FormGroup>
                  <FormGroup>
                    <Input
                      type="datetime-local"
                      name="date"
                      placeholder="End Time"
                      id="endTime"
                      invalid={this.state.incompleteTags}
                    />
                    <FormFeedback>Input atleast 3 tags</FormFeedback>
                  </FormGroup>
                  <FormGroup>
                    <Input
                      type="datetime-local"
                      name="date"
                      placeholder="Drop Time"
                      id="hammerDropTime"
                      invalid={this.state.incompleteTags}
                    />
                    <FormFeedback>Input atleast 3 tags</FormFeedback>
                  </FormGroup>
                  <FormGroup>
                    <Input
                      type="number"
                      name="number"
                      placeholder="Duration"
                      id="duration"
                      invalid={this.state.incompleteTags}
                    />
                    <FormFeedback>Input atleast 3 tags</FormFeedback>
                  </FormGroup>
                  <FormGroup>
                    <Input
                      type="text"
                      name="text"
                      placeholder="Location"
                      id="location"
                      invalid={this.state.incompleteTags}
                    />
                    <FormFeedback>Input atleast 3 tags</FormFeedback>
                  </FormGroup>
                  <FormGroup>
                    <Input
                      type="text"
                      name="text"
                      placeholder="Type of Event"
                      id="type"
                      invalid={this.state.incompleteTags}
                    />
                    <FormFeedback>Input atleast 3 tags</FormFeedback>
                  </FormGroup>
                  <FormGroup>
                    <Input
                      type="text"
                      name="text"
                      placeholder="Description"
                      id="description"
                      invalid={this.state.incompleteTags}
                    />
                    <FormFeedback>Input atleast 3 tags</FormFeedback>
                  </FormGroup>
                  <div>
                   {buttonArea}
                  </div>
                </Form>
              </div>
            ) : null}
            {this.state.addEvent ? <div /> : null}
          </div>
        </div>
      );
    } else if (this.state.eventsError) {
      return (
        <div id="groupContent">
          <Row>
            <Col sm={9}>
              <GroupHeader
                selected={this.props.selected}
                changeSelect={name => this.props.changeSelect(name)}
              />
              <Row>
                <Col>
                  <h3 id="eventsTitle">Events</h3>
                </Col>
              </Row>
              <Row>
                <Col id="loaderContainer">
                  <Alert color="dark">
                    <Error className="mx-2" />
                    Cannot Load Events
                  </Alert>
                </Col>
              </Row>
            </Col>
            <Col sm={3}>
              <GroupSidebar selected={this.props.selected} />
            </Col>
          </Row>
        </div>
      );
    } else {
      return (
        <div id="groupContent">
          <Row>
            <Col sm={9}>
              <GroupHeader
                selected={this.props.selected}
                changeSelect={name => this.props.changeSelect(name)}
              />
              <Row>
                <Col>
                  <h3 id="eventsTitle">Events</h3>
                </Col>
              </Row>
              <Row>
                <Col id="loaderContainer">
                  <Spinner color="primary" id="eventSpinner" />
                </Col>
              </Row>
            </Col>
            <Col sm={3}>
              <GroupSidebar selected={this.props.selected} />
            </Col>
          </Row>
        </div>
      );
    }
  }
}

export default GroupContent;
